from typing import List, Literal

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


class LikesListResponse(BaseModel):
    """Response for listing liked pages."""

    page_ids: List[int] = Field(..., description="List of liked page IDs")


FeedEventType = Literal["seen", "skipped", "liked", "bookmarked"]


class FeedEventRequest(BaseModel):
    """Request for recording a device-scoped feed event."""

    page_id: int = Field(..., ge=1, description="Page ID")
    event_type: FeedEventType = Field(..., description="Event type")


class FeedEventResponse(BaseModel):
    """Response for a recorded feed event."""

    page_id: int = Field(..., description="Page ID")
    event_type: FeedEventType = Field(..., description="Event type")
    recorded: bool = Field(..., description="Whether the event is recorded")
