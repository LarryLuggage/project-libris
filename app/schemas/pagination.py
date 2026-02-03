from typing import Optional

from pydantic import BaseModel, Field


class CursorParams(BaseModel):
    """Cursor-based pagination parameters."""

    cursor: Optional[str] = Field(None, description="Cursor for pagination")
    limit: int = Field(10, ge=1, le=50, description="Number of items per page")
