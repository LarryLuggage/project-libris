"""Schemas for book-related API responses."""

from typing import List, Optional

from pydantic import BaseModel, Field


class PageSummary(BaseModel):
    """Summary of a page for listings."""

    id: int = Field(..., description="Unique page identifier")
    page_number: int = Field(..., ge=1, description="Page number in book")
    content_preview: str = Field(..., description="First ~100 chars of content")
    vibe_score: float = Field(..., ge=0.0, le=1.0, description="Sentiment score")

    class Config:
        from_attributes = True


class PageDetail(BaseModel):
    """Full page detail."""

    id: int = Field(..., description="Unique page identifier")
    page_number: int = Field(..., ge=1, description="Page number in book")
    content_text: str = Field(..., description="Full page content")
    vibe_score: float = Field(..., ge=0.0, le=1.0, description="Sentiment score")

    class Config:
        from_attributes = True


class BookSummary(BaseModel):
    """Summary of a book for listings."""

    id: int = Field(..., description="Unique book identifier")
    gutenberg_id: Optional[int] = Field(None, description="Project Gutenberg ID")
    title: str = Field(..., description="Book title")
    author: str = Field(..., description="Book author")
    cover_url: Optional[str] = Field(None, description="Book cover image URL")
    page_count: int = Field(..., description="Total number of pages")
    avg_vibe_score: float = Field(..., description="Average vibe score across pages")
    is_user_uploaded: bool = Field(False, description="Whether the book was uploaded by a user")
    creator_device_id: Optional[str] = Field(None, description="Device ID of the creator")

    class Config:
        from_attributes = True


class BookDetail(BaseModel):
    """Full book detail with metadata and external links."""

    id: int = Field(..., description="Unique book identifier")
    gutenberg_id: Optional[int] = Field(None, description="Project Gutenberg ID")
    title: str = Field(..., description="Book title")
    author: str = Field(..., description="Book author")
    cover_url: Optional[str] = Field(None, description="Book cover image URL")
    page_count: int = Field(..., description="Total number of pages")
    high_vibe_count: int = Field(..., description="Number of high-vibe pages")
    avg_vibe_score: float = Field(..., description="Average vibe score")
    is_user_uploaded: bool = Field(False, description="Whether the book was uploaded by a user")
    creator_device_id: Optional[str] = Field(None, description="Device ID of the creator")

    # External links
    gutenberg_url: Optional[str] = Field(None, description="Link to read on Project Gutenberg")
    amazon_search_url: str = Field(..., description="Amazon search link for this book")
    goodreads_search_url: str = Field(..., description="Goodreads search link")

    # Top excerpts preview
    top_excerpts: List[PageSummary] = Field(
        ..., description="Top 5 highest-vibe excerpts"
    )

    class Config:
        from_attributes = True


class BookPagesResponse(BaseModel):
    """Paginated list of pages for a book."""

    book_id: int = Field(..., description="Book ID")
    book_title: str = Field(..., description="Book title")
    pages: List[PageDetail] = Field(..., description="Pages")
    total: int = Field(..., description="Total page count")
    high_vibe_only: bool = Field(..., description="Whether filtered to high-vibe only")


class CustomBookCreate(BaseModel):
    """Request schema for custom book upload."""

    title: str = Field(..., min_length=1, max_length=255, description="Book title")
    author: str = Field(..., min_length=1, max_length=255, description="Book author")
    cover_url: Optional[str] = Field(None, max_length=1000, description="Optional book cover image URL")
    content_text: str = Field(..., min_length=50, description="Full text content of the book")


class CustomBookResponse(BaseModel):
    """Response schema for custom book upload."""

    id: int = Field(..., description="Unique book identifier")
    title: str = Field(..., description="Book title")
    author: str = Field(..., description="Book author")
    cover_url: Optional[str] = Field(None, description="Book cover image URL")
    is_user_uploaded: bool = Field(..., description="Whether the book was uploaded by a user")
    creator_device_id: Optional[str] = Field(None, description="Device ID of the creator")
    pages_count: int = Field(..., description="Number of pages successfully chunked and created")

    class Config:
        from_attributes = True
