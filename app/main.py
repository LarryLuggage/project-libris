from typing import List
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from app.database import engine, get_db
from app.models import Base, Page, Book

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Project LIBRIS")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FeedItem(BaseModel):
    title: str
    author: str
    page_number: int
    content_text: str
    cover_url: str | None = None

    class Config:
        from_attributes = True

@app.get("/feed", response_model=List[FeedItem])
def get_feed(db: Session = Depends(get_db)):
    """
    Returns 10 random pages with a vibe_score > 0.7.
    """
    # Query for pages with vibe_score > 0.7
    # Join with Book to ensure we can access book details
    pages = (
        db.query(
            Page.content_text,
            Page.page_number,
            Book.title,
            Book.author,
            Book.cover_url
        )
        .join(Book)
        .filter(Page.vibe_score > 0.7)
        .order_by(func.random())
        .limit(10)
        .all()
    )

    # Convert to Pydantic models (or just return the dicts if the shape matches)
    # Since we selected specific fields, 'pages' will be a list of Row objects (named tuples-like)
    # We can map them to the Pydantic model.
    return [
        FeedItem(
            title=row.title,
            author=row.author,
            page_number=row.page_number,
            content_text=row.content_text,
            cover_url=row.cover_url
        )
        for row in pages
    ]
