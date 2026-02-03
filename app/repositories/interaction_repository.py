from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models import Bookmark, Like


class InteractionRepository:
    """Data access layer for user interactions (bookmarks, likes)."""

    def __init__(self, db: Session):
        self.db = db

    # Bookmark operations
    def add_bookmark(self, device_id: str, page_id: int) -> Bookmark:
        """Add a bookmark for a page."""
        bookmark = Bookmark(device_id=device_id, page_id=page_id)
        self.db.add(bookmark)
        self.db.commit()
        self.db.refresh(bookmark)
        return bookmark

    def remove_bookmark(self, device_id: str, page_id: int) -> bool:
        """Remove a bookmark. Returns True if deleted, False if not found."""
        result = (
            self.db.query(Bookmark)
            .filter(
                and_(Bookmark.device_id == device_id, Bookmark.page_id == page_id)
            )
            .delete()
        )
        self.db.commit()
        return result > 0

    def get_bookmark(self, device_id: str, page_id: int) -> Optional[Bookmark]:
        """Get a specific bookmark."""
        return (
            self.db.query(Bookmark)
            .filter(
                and_(Bookmark.device_id == device_id, Bookmark.page_id == page_id)
            )
            .first()
        )

    def get_bookmarks(self, device_id: str, limit: int = 50) -> List[Bookmark]:
        """Get all bookmarks for a device."""
        return (
            self.db.query(Bookmark)
            .filter(Bookmark.device_id == device_id)
            .order_by(Bookmark.created_at.desc())
            .limit(limit)
            .all()
        )

    def is_bookmarked(self, device_id: str, page_id: int) -> bool:
        """Check if a page is bookmarked."""
        return self.get_bookmark(device_id, page_id) is not None

    # Like operations
    def toggle_like(self, device_id: str, page_id: int) -> bool:
        """Toggle like status. Returns True if now liked, False if unliked."""
        existing = (
            self.db.query(Like)
            .filter(and_(Like.device_id == device_id, Like.page_id == page_id))
            .first()
        )

        if existing:
            self.db.delete(existing)
            self.db.commit()
            return False
        else:
            like = Like(device_id=device_id, page_id=page_id)
            self.db.add(like)
            self.db.commit()
            return True

    def get_like_count(self, page_id: int) -> int:
        """Get total like count for a page."""
        return self.db.query(Like).filter(Like.page_id == page_id).count()

    def is_liked(self, device_id: str, page_id: int) -> bool:
        """Check if a page is liked by a device."""
        return (
            self.db.query(Like)
            .filter(and_(Like.device_id == device_id, Like.page_id == page_id))
            .first()
            is not None
        )

    def get_liked_page_ids(self, device_id: str) -> List[int]:
        """Get all liked page IDs for a device."""
        likes = self.db.query(Like.page_id).filter(Like.device_id == device_id).all()
        return [like.page_id for like in likes]
