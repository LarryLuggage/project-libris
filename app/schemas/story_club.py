"""Schemas for Story Club lead intake."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator


class StoryClubLeadCreate(BaseModel):
    """Request schema for Story Club pilot waitlist signup."""

    name: str = Field(..., min_length=1, max_length=120)
    email: str = Field(..., min_length=3, max_length=255)
    role: Literal["writer", "reader", "both"] = Field(...)
    genre_preferences: Optional[list[str]] = Field(default=None, max_length=12)
    willing_to_pay_5: bool = Field(False)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or "." not in normalized.rsplit("@", maxsplit=1)[-1]:
            raise ValueError("Enter a valid email address")
        return normalized

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return value.strip()

    @field_validator("genre_preferences")
    @classmethod
    def normalize_genres(cls, value: Optional[list[str]]) -> Optional[list[str]]:
        if value is None:
            return None
        genres = [genre.strip() for genre in value if genre.strip()]
        return genres or None


class StoryClubLeadResponse(BaseModel):
    """Response schema for Story Club pilot waitlist signup."""

    id: int
    name: str
    email: str
    role: str
    genre_preferences: Optional[list[str]]
    willing_to_pay_5: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
