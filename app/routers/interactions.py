from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.repositories.interaction_repository import InteractionRepository
from app.schemas.interaction import BookmarkResponse, LikeResponse, BookmarksListResponse

router = APIRouter(prefix="/interactions", tags=["interactions"])


def get_device_id(
    x_device_id: str = Header(..., description="Anonymous device identifier"),
) -> str:
    """Extract and validate device ID from header."""
    if not x_device_id or len(x_device_id) < 10:
        raise HTTPException(status_code=400, detail="Invalid device ID")
    return x_device_id


@router.post("/bookmarks/{page_id}", response_model=BookmarkResponse)
def add_bookmark(
    page_id: int,
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db),
) -> BookmarkResponse:
    """Add a bookmark for a page."""
    repo = InteractionRepository(db)
    try:
        repo.add_bookmark(device_id, page_id)
        return BookmarkResponse(page_id=page_id, bookmarked=True)
    except IntegrityError:
        # Already bookmarked or page doesn't exist
        db.rollback()
        if repo.is_bookmarked(device_id, page_id):
            return BookmarkResponse(page_id=page_id, bookmarked=True)
        raise HTTPException(status_code=404, detail="Page not found")


@router.delete("/bookmarks/{page_id}", response_model=BookmarkResponse)
def remove_bookmark(
    page_id: int,
    device_id: str = Depends(get_device_id),
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
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db),
) -> LikeResponse:
    """Toggle like status for a page."""
    repo = InteractionRepository(db)
    try:
        is_liked = repo.toggle_like(device_id, page_id)
        like_count = repo.get_like_count(page_id)
        return LikeResponse(page_id=page_id, liked=is_liked, like_count=like_count)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=404, detail="Page not found")


@router.get("/likes/{page_id}/count")
def get_like_count(
    page_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """Get like count for a page."""
    repo = InteractionRepository(db)
    return {"page_id": page_id, "like_count": repo.get_like_count(page_id)}
