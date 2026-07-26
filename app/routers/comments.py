from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Comment, Page, User
from app.schemas.comment import CommentCreate, CommentResponse
from app.routers.interactions import enforce_device_rate_limit
from app.routers.auth import get_current_user

router = APIRouter(prefix="/comments", tags=["comments"])


@router.post("", response_model=CommentResponse, status_code=201)
def create_comment(
    payload: CommentCreate,
    current_user: User = Depends(get_current_user),
    device_id: str = Depends(enforce_device_rate_limit),
    db: Session = Depends(get_db),
) -> CommentResponse:
    """
    Create a new comment on a specific page.
    """
    # Verify page exists
    page = db.query(Page).filter(Page.id == payload.page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    comment = Comment(
        page_id=payload.page_id,
        device_id=device_id,
        user_id=current_user.id,
        content=payload.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return CommentResponse.model_validate(comment)


@router.get("", response_model=List[CommentResponse])
def list_comments(
    page_id: Optional[int] = Query(None, description="Filter comments by page ID"),
    limit: int = Query(50, ge=1, le=100, description="Max comments to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
) -> List[Comment]:
    """
    List comments, optionally filtered by page ID, sorted by newest first.
    """
    query = db.query(Comment)
    if page_id is not None:
        query = query.filter(Comment.page_id == page_id)
    return query.order_by(Comment.created_at.desc()).offset(offset).limit(limit).all()


@router.delete("/{comment_id}")
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Delete a comment if it belongs to the authenticated user.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    db.delete(comment)
    db.commit()
    return {"detail": "Comment deleted successfully"}
