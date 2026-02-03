from typing import List, Optional

from sqlalchemy.orm import Session

from app.config import get_settings
from app.repositories.page_repository import PageRepository
from app.schemas.feed import FeedItem, FeedResponse


class FeedService:
    """Business logic for feed operations."""

    def __init__(self, db: Session):
        self.page_repo = PageRepository(db)
        self.settings = get_settings()

    def get_feed(
        self,
        cursor: Optional[str] = None,
        exclude_ids: Optional[List[int]] = None,
    ) -> FeedResponse:
        """
        Get paginated feed of high-vibe pages.

        Args:
            cursor: Pagination cursor (page ID to start after)
            exclude_ids: Page IDs to exclude from results

        Returns:
            FeedResponse with items and pagination info
        """
        cursor_int = int(cursor) if cursor else None

        pages, next_cursor = self.page_repo.get_feed_pages(
            vibe_threshold=self.settings.vibe_threshold,
            limit=self.settings.page_size,
            cursor=cursor_int,
            exclude_ids=exclude_ids,
        )

        items = [
            FeedItem(
                id=page.id,
                book_id=book.id,
                title=book.title,
                author=book.author,
                page_number=page.page_number,
                content_text=page.content_text,
                cover_url=book.cover_url,
                vibe_score=page.vibe_score,
            )
            for page, book in pages
        ]

        return FeedResponse(
            items=items,
            next_cursor=str(next_cursor) if next_cursor else None,
            has_more=next_cursor is not None,
        )
