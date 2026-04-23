from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.feed import FeedResponse
from app.services.feed_service import FeedService

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("", response_model=FeedResponse)
def get_feed(
    cursor: Optional[str] = Query(
        None, description="Opaque cursor for deterministic keyset pagination"
    ),
    exclude: Optional[List[int]] = Query(None, description="Page IDs to exclude"),
    x_device_id: Optional[str] = Header(
        None, description="Anonymous device identifier for repeat suppression"
    ),
    db: Session = Depends(get_db),
) -> FeedResponse:
    """
    Get paginated feed of high-vibe literary pages.

    - Use `cursor` for efficient pagination without duplicates
    - Optionally exclude specific page IDs with `exclude`
    - With `X-Device-ID`, seen/skipped events are excluded server-side
    """
    if x_device_id is not None and (len(x_device_id) < 10 or len(x_device_id) > 128):
        raise HTTPException(status_code=400, detail="Invalid device ID")

    service = FeedService(db)
    try:
        return service.get_feed(
            cursor=cursor,
            exclude_ids=exclude,
            device_id=x_device_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
