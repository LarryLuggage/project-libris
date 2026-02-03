"""
Gutenberg ingestion pipeline - orchestrates fetching, processing, and storing books.
"""

import logging
import time
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional, Tuple

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Book, Page
from app.repositories.book_repository import BookRepository
from app.services.ingest import strip_gutenberg_headers, chunk_text, analyze_vibe
from app.services.gutenberg.client import GutenbergClient, GutenbergFetchError

logger = logging.getLogger(__name__)


@dataclass
class IngestionProgress:
    """Progress tracking for ingestion runs."""

    current_book: int
    total_books: int
    current_title: str
    current_author: str
    books_processed: int
    books_skipped: int
    books_failed: int
    pages_created: int


@dataclass
class IngestionResult:
    """Statistics from an ingestion run."""

    books_processed: int
    books_skipped: int
    books_failed: int
    pages_created: int
    high_vibe_pages: int
    errors: List[str] = field(default_factory=list)
    duration_seconds: float = 0.0

    def summary(self) -> str:
        """Generate a human-readable summary."""
        total_attempted = self.books_processed + self.books_skipped + self.books_failed
        high_vibe_pct = (
            (self.high_vibe_pages / self.pages_created * 100)
            if self.pages_created > 0
            else 0
        )

        lines = [
            "Summary",
            "-------",
            f"Books processed: {self.books_processed}",
            f"Books skipped:   {self.books_skipped} (already existed)",
            f"Books failed:    {self.books_failed}",
            f"Pages created:   {self.pages_created:,}",
            f"High-vibe pages: {self.high_vibe_pages:,} ({high_vibe_pct:.1f}%)",
            f"Total time:      {self._format_duration()}",
        ]

        if self.errors:
            lines.append("")
            lines.append(f"Errors ({len(self.errors)}):")
            for error in self.errors[:10]:  # Show first 10 errors
                lines.append(f"  - {error}")
            if len(self.errors) > 10:
                lines.append(f"  ... and {len(self.errors) - 10} more")

        return "\n".join(lines)

    def _format_duration(self) -> str:
        """Format duration as human-readable string."""
        if self.duration_seconds < 60:
            return f"{self.duration_seconds:.1f}s"
        elif self.duration_seconds < 3600:
            minutes = int(self.duration_seconds // 60)
            seconds = int(self.duration_seconds % 60)
            return f"{minutes}m {seconds}s"
        else:
            hours = int(self.duration_seconds // 3600)
            minutes = int((self.duration_seconds % 3600) // 60)
            return f"{hours}h {minutes}m"


class GutenbergPipeline:
    """
    Orchestrates the full book ingestion pipeline.

    Coordinates fetching from Gutenberg, processing text, and storing
    books and pages in the database.
    """

    def __init__(
        self,
        db: Session,
        client: Optional[GutenbergClient] = None,
        word_count: int = 300,
        progress_callback: Optional[Callable[[IngestionProgress], None]] = None,
    ):
        """
        Initialize the pipeline.

        Args:
            db: Database session
            client: Gutenberg client (created if not provided)
            word_count: Words per chunk (default 300)
            progress_callback: Optional callback for progress updates
        """
        self.db = db
        self.client = client or GutenbergClient()
        self.word_count = word_count
        self.progress_callback = progress_callback
        self.book_repo = BookRepository(db)
        self._settings = get_settings()

    def ingest_book(
        self, gutenberg_id: int, title: str, author: str
    ) -> Optional[Book]:
        """
        Ingest a single book.

        Steps:
        1. Check if book already exists (by gutenberg_id)
        2. Fetch text content
        3. Strip Gutenberg headers
        4. Chunk into pages
        5. Score each chunk
        6. Persist Book and Pages

        Args:
            gutenberg_id: Gutenberg book ID
            title: Book title
            author: Author name

        Returns:
            Created Book instance, or None if skipped/failed

        Raises:
            GutenbergFetchError: If book cannot be fetched
        """
        # Check for duplicate
        existing = self.book_repo.get_by_gutenberg_id(gutenberg_id)
        if existing:
            logger.info(f"Skipping {gutenberg_id} '{title}' (already exists)")
            return None

        # Fetch text
        logger.info(f"Fetching {gutenberg_id} '{title}' by {author}")
        raw_text = self.client.fetch_text(gutenberg_id)
        logger.debug(f"Downloaded {len(raw_text):,} bytes")

        # Process text
        chunks = self._process_text(raw_text)
        logger.debug(f"Created {len(chunks)} chunks")

        if not chunks:
            logger.warning(f"No chunks created for {gutenberg_id} '{title}'")
            return None

        # Get cover URL
        cover_url = self.client.get_cover_url(gutenberg_id)

        # Create book and pages
        book = self._create_book_with_pages(
            gutenberg_id=gutenberg_id,
            title=title,
            author=author,
            cover_url=cover_url,
            chunks=chunks,
        )

        logger.info(
            f"Created book {gutenberg_id} '{title}' with {len(chunks)} pages"
        )
        return book

    def ingest_batch(self, books: List[Dict]) -> IngestionResult:
        """
        Ingest a batch of books.

        Args:
            books: List of dicts with 'gutenberg_id', 'title', 'author'

        Returns:
            IngestionResult with statistics
        """
        start_time = time.time()

        books_processed = 0
        books_skipped = 0
        books_failed = 0
        pages_created = 0
        high_vibe_pages = 0
        errors: List[str] = []

        total = len(books)

        for i, book_info in enumerate(books):
            gutenberg_id = book_info["gutenberg_id"]
            title = book_info["title"]
            author = book_info["author"]

            # Emit progress
            if self.progress_callback:
                progress = IngestionProgress(
                    current_book=i + 1,
                    total_books=total,
                    current_title=title,
                    current_author=author,
                    books_processed=books_processed,
                    books_skipped=books_skipped,
                    books_failed=books_failed,
                    pages_created=pages_created,
                )
                self.progress_callback(progress)

            try:
                book = self.ingest_book(gutenberg_id, title, author)

                if book is None:
                    # Book was skipped (already exists)
                    books_skipped += 1
                else:
                    books_processed += 1
                    book_pages = len(book.pages)
                    pages_created += book_pages
                    high_vibe_pages += sum(
                        1
                        for p in book.pages
                        if p.vibe_score > self._settings.vibe_threshold
                    )

            except GutenbergFetchError as e:
                logger.error(f"Failed to fetch: {e}")
                errors.append(str(e))
                books_failed += 1

            except Exception as e:
                logger.exception(f"Unexpected error for {gutenberg_id} '{title}'")
                errors.append(f"Book {gutenberg_id}: Unexpected error - {str(e)}")
                books_failed += 1

        duration = time.time() - start_time

        return IngestionResult(
            books_processed=books_processed,
            books_skipped=books_skipped,
            books_failed=books_failed,
            pages_created=pages_created,
            high_vibe_pages=high_vibe_pages,
            errors=errors,
            duration_seconds=duration,
        )

    def _process_text(self, text: str) -> List[Tuple[str, float]]:
        """
        Process raw text into scored chunks.

        Returns:
            List of (chunk_text, vibe_score) tuples
        """
        # Strip Gutenberg headers/footers
        clean_text = strip_gutenberg_headers(text)

        # Chunk into pages
        chunks = chunk_text(clean_text, word_count=self.word_count)

        # Score each chunk
        scored_chunks = []
        for chunk in chunks:
            if chunk.strip():  # Skip empty chunks
                score = analyze_vibe(chunk)
                scored_chunks.append((chunk, score))

        return scored_chunks

    def _create_book_with_pages(
        self,
        gutenberg_id: int,
        title: str,
        author: str,
        cover_url: Optional[str],
        chunks: List[Tuple[str, float]],
    ) -> Book:
        """
        Create Book and Page records in a single transaction.

        Args:
            gutenberg_id: Gutenberg book ID
            title: Book title
            author: Author name
            cover_url: Optional cover image URL
            chunks: List of (text, vibe_score) tuples

        Returns:
            Created Book instance with pages loaded
        """
        try:
            # Create book
            book = Book(
                gutenberg_id=gutenberg_id,
                title=title,
                author=author,
                cover_url=cover_url,
            )
            self.db.add(book)
            self.db.flush()  # Get book.id without committing

            # Create pages
            pages = []
            for i, (text, vibe_score) in enumerate(chunks):
                page = Page(
                    book_id=book.id,
                    page_number=i + 1,
                    content_text=text,
                    vibe_score=vibe_score,
                )
                pages.append(page)

            self.db.add_all(pages)
            self.db.commit()
            self.db.refresh(book)

            return book

        except IntegrityError:
            # Race condition - book was created by another process
            self.db.rollback()
            logger.warning(
                f"Book {gutenberg_id} already exists (race condition)"
            )
            existing = self.book_repo.get_by_gutenberg_id(gutenberg_id)
            if existing:
                return existing
            raise

        except Exception:
            self.db.rollback()
            raise

    def close(self) -> None:
        """Close resources."""
        if self.client:
            self.client.close()

    def __enter__(self) -> "GutenbergPipeline":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()
