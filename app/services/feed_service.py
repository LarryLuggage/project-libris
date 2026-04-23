from typing import List, Optional
import base64
import json

from sqlalchemy.orm import Session

from app.config import get_settings
from app.repositories.page_repository import PageRepository
from app.schemas.feed import FeedItem, FeedResponse


class FeedService:
    """Business logic for feed operations."""

    def __init__(self, db: Session):
        self.page_repo = PageRepository(db)
        self.settings = get_settings()

    @staticmethod
    def _encode_cursor(cursor: tuple[int, int, int]) -> str:
        """Encode keyset cursor tuple to URL-safe opaque string."""
        payload = {"s": cursor[0], "v": cursor[1], "id": cursor[2]}
        encoded = base64.urlsafe_b64encode(
            json.dumps(payload, separators=(",", ":")).encode("utf-8")
        ).decode("utf-8")
        return encoded.rstrip("=")

    @staticmethod
    def _decode_cursor(cursor: str) -> tuple[int, int, int]:
        """Decode and validate opaque cursor string."""
        try:
            padded = cursor + "=" * (-len(cursor) % 4)
            decoded = base64.urlsafe_b64decode(padded.encode("utf-8")).decode("utf-8")
            payload = json.loads(decoded)
            score = int(payload["s"])
            vibe_bucket = int(payload["v"])
            page_id = int(payload["id"])
        except Exception as exc:
            raise ValueError("Invalid cursor format") from exc

        if score < 0 or vibe_bucket < 0 or page_id < 1:
            raise ValueError("Invalid cursor values")

        return score, vibe_bucket, page_id

    def get_feed(
        self,
        cursor: Optional[str] = None,
        exclude_ids: Optional[List[int]] = None,
        device_id: Optional[str] = None,
    ) -> FeedResponse:
        """
        Get paginated feed of high-vibe pages.

        Args:
            cursor: Pagination cursor (page ID to start after)
            exclude_ids: Page IDs to exclude from results
            device_id: Optional device ID for server-side repeat suppression

        Returns:
            FeedResponse with items and pagination info
        """
        decoded_cursor = self._decode_cursor(cursor) if cursor else None

        pages, next_cursor = self.page_repo.get_feed_pages(
            vibe_threshold=self.settings.vibe_threshold,
            limit=self.settings.page_size,
            cursor=decoded_cursor,
            exclude_ids=exclude_ids,
            device_id=device_id,
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
            next_cursor=self._encode_cursor(next_cursor) if next_cursor else None,
            has_more=next_cursor is not None,
        )
