from datetime import datetime
from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    """Request schema for creating a review/rating for a book."""

    book_id: int = Field(..., description="ID of the book to review")
    rating: int = Field(..., ge=1, le=5, description="Book rating (1-5 stars)")
    content: str = Field(..., min_length=1, max_length=5000, description="Review content")


class ReviewResponse(BaseModel):
    """Response schema for review data."""

    id: int = Field(..., description="Unique review identifier")
    book_id: int = Field(..., description="ID of the reviewed book")
    device_id: str = Field(..., description="Device ID of the reviewer")
    username: str = Field(..., description="Username of the reviewer")
    rating: int = Field(..., description="Book rating (1-5 stars)")
    content: str = Field(..., description="Review content")
    created_at: datetime = Field(..., description="Timestamp when the review was created")

    class Config:
        from_attributes = True

