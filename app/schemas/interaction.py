from typing import List

from pydantic import BaseModel, Field


class BookmarkResponse(BaseModel):
    """Response for bookmark operations."""

    page_id: int = Field(..., description="Page ID")
    bookmarked: bool = Field(..., description="Whether page is now bookmarked")


class LikeResponse(BaseModel):
    """Response for like operations."""

    page_id: int = Field(..., description="Page ID")
    liked: bool = Field(..., description="Whether page is now liked")
    like_count: int = Field(..., description="Total likes for this page")


class BookmarksListResponse(BaseModel):
    """Response for listing bookmarks."""

    page_ids: List[int] = Field(..., description="List of bookmarked page IDs")
