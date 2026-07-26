from datetime import datetime
from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    """Request schema for creating a comment on a page."""

    page_id: int = Field(..., description="ID of the page to comment on")
    content: str = Field(..., min_length=1, max_length=1000, description="Comment content")


class CommentResponse(BaseModel):
    """Response schema for comment data."""

    id: int = Field(..., description="Unique comment identifier")
    page_id: int = Field(..., description="ID of the page commented on")
    device_id: str = Field(..., description="Device ID of the commenter")
    username: str = Field(..., description="Username of the commenter")
    content: str = Field(..., description="Comment content")
    created_at: datetime = Field(..., description="Timestamp when the comment was created")

    class Config:
        from_attributes = True

