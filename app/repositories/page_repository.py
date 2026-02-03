from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models import Page, Book


class PageRepository:
    """Data access layer for Page entities."""

    def __init__(self, db: Session):
        self.db = db

    def get_feed_pages(
        self,
        vibe_threshold: float,
        limit: int,
        cursor: Optional[int] = None,
        exclude_ids: Optional[List[int]] = None,
    ) -> Tuple[List[Tuple[Page, Book]], Optional[int]]:
        """
        Fetch pages for feed with cursor-based pagination.

        Args:
            vibe_threshold: Minimum vibe score to include
            limit: Maximum number of items to return
            cursor: ID to start after (for pagination)
            exclude_ids: Page IDs to exclude from results

        Returns:
            Tuple of (list of (Page, Book) tuples, next_cursor or None)
        """
        query = (
            self.db.query(Page, Book)
            .join(Book)
            .filter(Page.vibe_score > vibe_threshold)
        )

        if cursor is not None:
            query = query.filter(Page.id > cursor)

        if exclude_ids:
            query = query.filter(Page.id.notin_(exclude_ids))

        # Order by ID for consistent cursor-based pagination
        query = query.order_by(Page.id).limit(limit + 1)
        results = query.all()

        # Check if there are more results
        has_more = len(results) > limit
        pages = results[:limit]

        # Get next cursor
        next_cursor = pages[-1][0].id if pages and has_more else None

        return pages, next_cursor

    def get_page_by_id(self, page_id: int) -> Optional[Page]:
        """Get a single page by ID."""
        return self.db.query(Page).filter(Page.id == page_id).first()

    def get_pages_by_book(self, book_id: int) -> List[Page]:
        """Get all pages for a book."""
        return (
            self.db.query(Page)
            .filter(Page.book_id == book_id)
            .order_by(Page.page_number)
            .all()
        )
