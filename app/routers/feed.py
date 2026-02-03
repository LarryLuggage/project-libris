from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.feed import FeedResponse
from app.services.feed_service import FeedService

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("", response_model=FeedResponse)
def get_feed(
    cursor: Optional[str] = Query(None, description="Cursor for pagination"),
    exclude: Optional[List[int]] = Query(None, description="Page IDs to exclude"),
    db: Session = Depends(get_db),
) -> FeedResponse:
    """
    Get paginated feed of high-vibe literary pages.

    - Use `cursor` for efficient pagination without duplicates
    - Optionally exclude specific page IDs with `exclude`
    """
    service = FeedService(db)
    return service.get_feed(cursor=cursor, exclude_ids=exclude)
