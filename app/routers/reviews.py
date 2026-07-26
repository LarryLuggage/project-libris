from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Book, Review, User
from app.schemas.review import ReviewCreate, ReviewResponse
from app.routers.interactions import enforce_device_rate_limit
from app.routers.auth import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=ReviewResponse, status_code=201)
def create_review(
    payload: ReviewCreate,
    current_user: User = Depends(get_current_user),
    device_id: str = Depends(enforce_device_rate_limit),
    db: Session = Depends(get_db),
) -> ReviewResponse:
    """
    Create a new review/rating for a specific book.
    """
    # Verify book exists
    book = db.query(Book).filter(Book.id == payload.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    review = Review(
        book_id=payload.book_id,
        device_id=device_id,
        user_id=current_user.id,
        rating=payload.rating,
        content=payload.content,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return ReviewResponse.model_validate(review)


@router.get("", response_model=List[ReviewResponse])
def list_reviews(
    book_id: Optional[int] = Query(None, description="Filter reviews by book ID"),
    limit: int = Query(50, ge=1, le=100, description="Max reviews to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
) -> List[Review]:
    """
    List reviews, optionally filtered by book ID, sorted by newest first.
    """
    query = db.query(Review)
    if book_id is not None:
        query = query.filter(Review.book_id == book_id)
    return query.order_by(Review.created_at.desc()).offset(offset).limit(limit).all()


@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Delete a review if it belongs to the authenticated user.
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")

    db.delete(review)
    db.commit()
    return {"detail": "Review deleted successfully"}
