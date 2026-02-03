from typing import List, Optional

from pydantic import BaseModel, Field


class FeedItem(BaseModel):
    """A single page item in the feed."""

    id: int = Field(..., description="Unique page identifier")
    book_id: int = Field(..., description="Book identifier for navigation")
    title: str = Field(..., description="Book title")
    author: str = Field(..., description="Book author")
    page_number: int = Field(..., ge=1, description="Page number in book")
    content_text: str = Field(..., description="Page content")
    cover_url: Optional[str] = Field(None, description="Book cover image URL")
    vibe_score: float = Field(..., ge=0.0, le=1.0, description="Sentiment score")

    class Config:
        from_attributes = True


class FeedResponse(BaseModel):
    """Paginated feed response."""

    items: List[FeedItem] = Field(..., description="Feed items")
    next_cursor: Optional[str] = Field(None, description="Cursor for next page")
    has_more: bool = Field(..., description="Whether more items exist")
