"""Story Club pilot waitlist endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import StoryClubLead
from app.schemas.story_club import StoryClubLeadCreate, StoryClubLeadResponse

router = APIRouter(prefix="/story-club", tags=["story-club"])


def _serialize_genres(genres: list[str] | None) -> str | None:
    if not genres:
        return None
    return ",".join(genres)


def _deserialize_genres(genres: str | None) -> list[str] | None:
    if not genres:
        return None
    return [genre for genre in genres.split(",") if genre]


def _lead_response(lead: StoryClubLead) -> StoryClubLeadResponse:
    return StoryClubLeadResponse(
        id=lead.id,
        name=lead.name,
        email=lead.email,
        role=lead.role,
        genre_preferences=_deserialize_genres(lead.genre_preferences),
        willing_to_pay_5=lead.willing_to_pay_5,
        created_at=lead.created_at,
        updated_at=lead.updated_at,
    )


@router.post(
    "/waitlist",
    response_model=StoryClubLeadResponse,
    status_code=status.HTTP_201_CREATED,
)
def join_waitlist(
    payload: StoryClubLeadCreate,
    db: Session = Depends(get_db),
) -> StoryClubLeadResponse:
    """Create or update a Story Club pilot waitlist lead by email."""
    existing = (
        db.query(StoryClubLead).filter(StoryClubLead.email == payload.email).first()
    )

    if existing:
        existing.name = payload.name
        existing.role = payload.role
        existing.genre_preferences = _serialize_genres(payload.genre_preferences)
        existing.willing_to_pay_5 = payload.willing_to_pay_5
        db.commit()
        db.refresh(existing)
        return _lead_response(existing)

    lead = StoryClubLead(
        name=payload.name,
        email=payload.email,
        role=payload.role,
        genre_preferences=_serialize_genres(payload.genre_preferences),
        willing_to_pay_5=payload.willing_to_pay_5,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return _lead_response(lead)
