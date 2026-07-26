from typing import Any, List, Optional, Tuple

from sqlalchemy import Integer, and_, cast, func, or_, select
from sqlalchemy.orm import Session

from app.models import Book, Bookmark, FeedEvent, Like, Page


class PageRepository:
    """Data access layer for Page entities."""

    def __init__(self, db: Session):
        self.db = db

    def get_feed_pages(
        self,
        vibe_threshold: float,
        limit: int,
        cursor: Optional[Tuple[int, int, int]] = None,
        exclude_ids: Optional[List[int]] = None,
        device_id: Optional[str] = None,
        preferred_genres: Optional[List[str]] = None,
        preferred_vibes: Optional[List[str]] = None,
    ) -> Tuple[List[Tuple[Page, Book]], Optional[Tuple[int, int, int]]]:
        """
        Fetch pages for feed with cursor-based pagination.

        Args:
            vibe_threshold: Minimum vibe score to include
            limit: Maximum number of items to return
            cursor: (ranking_score, vibe_bucket, page_id) tuple
            exclude_ids: Page IDs to exclude from results
            device_id: Optional device ID for server-side repeat suppression
            preferred_genres: Optional list of user's preferred genres
            preferred_vibes: Optional list of user's preferred vibes

        Returns:
            Tuple of (list of (Page, Book) tuples, next_cursor tuple or None)
        """
        from sqlalchemy import case, literal

        likes_subquery = (
            self.db.query(
                Like.page_id.label("page_id"),
                func.count(Like.id).label("like_count"),
            )
            .group_by(Like.page_id)
            .subquery()
        )
        bookmarks_subquery = (
            self.db.query(
                Bookmark.page_id.label("page_id"),
                func.count(Bookmark.id).label("bookmark_count"),
            )
            .group_by(Bookmark.page_id)
            .subquery()
        )

        like_count = func.coalesce(likes_subquery.c.like_count, 0)
        bookmark_count = func.coalesce(bookmarks_subquery.c.bookmark_count, 0)
        interaction_score_expr = like_count * 2 + bookmark_count * 3
        vibe_bucket = cast(Page.vibe_score * 1000, Integer).label("vibe_bucket")

        # Compute personalization boosts (+50 for matching genre, +50 for matching vibe)
        genre_boost: Any = case(
            (Book.genre.in_(preferred_genres), 50),
            else_=0
        ) if preferred_genres else literal(0)

        vibe_conditions = []
        if preferred_vibes:
            for vibe in preferred_vibes:
                if vibe == "thoughtful":
                    vibe_conditions.append(and_(Page.vibe_score >= 0.4, Page.vibe_score <= 0.7))
                elif vibe == "romantic":
                    vibe_conditions.append(and_(Page.vibe_score >= 0.7, Page.vibe_score <= 1.0))
                elif vibe == "adventurous":
                    vibe_conditions.append(and_(Page.vibe_score >= 0.5, Page.vibe_score <= 0.8))
                elif vibe == "dark":
                    vibe_conditions.append(and_(Page.vibe_score >= 0.0, Page.vibe_score <= 0.4))

        vibe_boost: Any = case(
            (or_(*vibe_conditions), 50),
            else_=0
        ) if (preferred_vibes and vibe_conditions) else literal(0)

        ranking_score = (interaction_score_expr + genre_boost + vibe_boost).label("ranking_score")


        query = (
            self.db.query(Page, Book, ranking_score, vibe_bucket)
            .join(Book)
            .outerjoin(likes_subquery, likes_subquery.c.page_id == Page.id)
            .outerjoin(bookmarks_subquery, bookmarks_subquery.c.page_id == Page.id)
            .filter(Page.vibe_score > vibe_threshold)
        )

        if cursor is not None:
            cursor_score, cursor_vibe_bucket, cursor_page_id = cursor
            query = query.filter(
                or_(
                    ranking_score < cursor_score,
                    and_(
                        ranking_score == cursor_score,
                        vibe_bucket < cursor_vibe_bucket,
                    ),
                    and_(
                        ranking_score == cursor_score,
                        vibe_bucket == cursor_vibe_bucket,
                        Page.id > cursor_page_id,
                    ),
                )
            )

        if exclude_ids:
            query = query.filter(Page.id.notin_(exclude_ids))

        if device_id:
            hidden_events = select(FeedEvent.page_id).where(
                FeedEvent.device_id == device_id,
                FeedEvent.event_type.in_(["seen", "skipped"]),
            )
            query = query.filter(Page.id.notin_(hidden_events))

        # Deterministic ranking: personalized ranking score first, then vibe quality, then stable ID tie-break.
        query = query.order_by(
            ranking_score.desc(), vibe_bucket.desc(), Page.id
        ).limit(limit + 1)
        results = query.all()

        # Check if there are more results
        has_more = len(results) > limit
        pages = results[:limit]

        # Get next cursor
        if pages and has_more:
            last_page, _, last_score, last_vibe_bucket = pages[-1]
            next_cursor = (int(last_score), int(last_vibe_bucket), last_page.id)
        else:
            next_cursor = None

        return [(page, book) for page, book, _, _ in pages], next_cursor


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
