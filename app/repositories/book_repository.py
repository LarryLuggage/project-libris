from typing import List, Optional

from sqlalchemy.orm import Session

from app.models import Book, Page


class BookRepository:
    """Data access layer for Book entities."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, book_id: int) -> Optional[Book]:
        """Get a book by ID."""
        return self.db.query(Book).filter(Book.id == book_id).first()

    def get_by_gutenberg_id(self, gutenberg_id: int) -> Optional[Book]:
        """Get a book by Gutenberg ID."""
        return self.db.query(Book).filter(Book.gutenberg_id == gutenberg_id).first()

    def get_all(self) -> List[Book]:
        """Get all books."""
        return self.db.query(Book).all()

    def create(self, book: Book) -> Book:
        """Create a new book."""
        self.db.add(book)
        self.db.commit()
        self.db.refresh(book)
        return book

    def create_with_pages(self, book: Book, pages: List[Page]) -> Book:
        """
        Create a book with its pages in a single transaction.

        Args:
            book: Book instance to create
            pages: List of Page instances (book_id will be set automatically)

        Returns:
            Created Book with pages attached
        """
        self.db.add(book)
        self.db.flush()  # Get book.id without committing

        for page in pages:
            page.book_id = book.id

        self.db.add_all(pages)
        self.db.commit()
        self.db.refresh(book)
        return book
