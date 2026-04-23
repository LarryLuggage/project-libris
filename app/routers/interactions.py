from collections import defaultdict, deque
from time import monotonic

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import Page
from app.repositories.interaction_repository import InteractionRepository
from app.schemas.interaction import (
    BookmarkResponse,
    BookmarksListResponse,
    FeedEventRequest,
    FeedEventResponse,
    LikeResponse,
    LikesListResponse,
)

router = APIRouter(prefix="/interactions", tags=["interactions"])

RATE_LIMIT_MAX_REQUESTS = 120
RATE_LIMIT_WINDOW_SECONDS = 60
_request_log: dict[str, deque[float]] = defaultdict(deque)


def get_device_id(
    x_device_id: str = Header(..., description="Anonymous device identifier"),
) -> str:
    """Extract and validate device ID from header."""
    if not x_device_id or len(x_device_id) < 10 or len(x_device_id) > 128:
        raise HTTPException(status_code=400, detail="Invalid device ID")
    return x_device_id


def enforce_device_rate_limit(device_id: str = Depends(get_device_id)) -> str:
    """Apply a lightweight in-process rate limit for anonymous interactions."""
    now = monotonic()
    requests = _request_log[device_id]
    while requests and now - requests[0] > RATE_LIMIT_WINDOW_SECONDS:
        requests.popleft()
    if len(requests) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(status_code=429, detail="Too many requests")
    requests.append(now)
    return device_id


def validate_page_exists(page_id: int, db: Session) -> None:
    """Raise 404 if the page doesn't exist."""
    page = db.query(Page).filter(Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")


@router.post("/bookmarks/{page_id}", response_model=BookmarkResponse)
def add_bookmark(
    page_id: int,
    device_id: str = Depends(enforce_device_rate_limit),
    db: Session = Depends(get_db),
) -> BookmarkResponse:
    """Add a bookmark for a page."""
    validate_page_exists(page_id, db)
    repo = InteractionRepository(db)
    try:
        repo.add_bookmark(device_id, page_id)
        repo.record_feed_event(device_id, page_id, "bookmarked")
        return BookmarkResponse(page_id=page_id, bookmarked=True)
    except IntegrityError:
        db.rollback()
        repo.record_feed_event(device_id, page_id, "bookmarked")
        return BookmarkResponse(page_id=page_id, bookmarked=True)


@router.delete("/bookmarks/{page_id}", response_model=BookmarkResponse)
def remove_bookmark(
    page_id: int,
    device_id: str = Depends(enforce_device_rate_limit),
    db: Session = Depends(get_db),
) -> BookmarkResponse:
    """Remove a bookmark for a page."""
    repo = InteractionRepository(db)
    repo.remove_bookmark(device_id, page_id)
    return BookmarkResponse(page_id=page_id, bookmarked=False)


@router.get("/bookmarks", response_model=BookmarksListResponse)
def get_bookmarks(
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db),
) -> BookmarksListResponse:
    """Get all bookmarked page IDs for the device."""
    repo = InteractionRepository(db)
    bookmarks = repo.get_bookmarks(device_id)
    return BookmarksListResponse(page_ids=[b.page_id for b in bookmarks])


@router.post("/likes/{page_id}", response_model=LikeResponse)
def toggle_like(
    page_id: int,
    device_id: str = Depends(enforce_device_rate_limit),
    db: Session = Depends(get_db),
) -> LikeResponse:
    """Toggle like status for a page."""
    validate_page_exists(page_id, db)
    repo = InteractionRepository(db)
    try:
        is_liked = repo.toggle_like(device_id, page_id)
        if is_liked:
            repo.record_feed_event(device_id, page_id, "liked")
        like_count = repo.get_like_count(page_id)
        return LikeResponse(page_id=page_id, liked=is_liked, like_count=like_count)
    except IntegrityError:
        db.rollback()
        # Handle concurrent write races by returning current persisted state.
        is_liked = repo.is_liked(device_id, page_id)
        if is_liked:
            repo.record_feed_event(device_id, page_id, "liked")
        like_count = repo.get_like_count(page_id)
        return LikeResponse(page_id=page_id, liked=is_liked, like_count=like_count)


@router.get("/likes", response_model=LikesListResponse)
def get_likes(
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db),
) -> LikesListResponse:
    """Get all liked page IDs for the device."""
    repo = InteractionRepository(db)
    return LikesListResponse(page_ids=repo.get_liked_page_ids(device_id))


@router.get("/likes/{page_id}/count")
def get_like_count(
    page_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """Get like count for a page."""
    repo = InteractionRepository(db)
    return {"page_id": page_id, "like_count": repo.get_like_count(page_id)}


@router.post("/events", response_model=FeedEventResponse)
def record_feed_event(
    payload: FeedEventRequest,
    device_id: str = Depends(enforce_device_rate_limit),
    db: Session = Depends(get_db),
) -> FeedEventResponse:
    """Record a feed event for repeat suppression and lightweight analytics."""
    validate_page_exists(payload.page_id, db)
    repo = InteractionRepository(db)
    repo.record_feed_event(device_id, payload.page_id, payload.event_type)
    return FeedEventResponse(
        page_id=payload.page_id,
        event_type=payload.event_type,
        recorded=True,
    )
