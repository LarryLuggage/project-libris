"""Book detail and pages endpoints."""

from typing import Optional
from urllib.parse import quote_plus

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import Book, Page
from app.schemas.book import (
    BookDetail,
    BookPagesResponse,
    BookSummary,
    PageDetail,
    PageSummary,
)

router = APIRouter(prefix="/books", tags=["books"])


def _get_book_or_404(db: Session, book_id: int) -> Book:
    """Get book by ID or raise 404."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book


def _build_external_links(book: Book) -> dict:
    """Build external links for a book."""
    search_query = quote_plus(f"{book.title} {book.author}")
    return {
        "gutenberg_url": f"https://www.gutenberg.org/ebooks/{book.gutenberg_id}",
        "amazon_search_url": f"https://www.amazon.com/s?k={search_query}",
        "goodreads_search_url": f"https://www.goodreads.com/search?q={search_query}",
    }


@router.get("/{book_id}", response_model=BookDetail)
def get_book_detail(
    book_id: int,
    db: Session = Depends(get_db),
) -> BookDetail:
    """
    Get detailed information about a book.

    Includes metadata, statistics, external links, and top excerpts.
    """
    settings = get_settings()
    book = _get_book_or_404(db, book_id)

    # Calculate statistics
    page_stats = (
        db.query(
            func.count(Page.id).label("total"),
            func.avg(Page.vibe_score).label("avg_score"),
            func.count(Page.id)
            .filter(Page.vibe_score > settings.vibe_threshold)
            .label("high_vibe"),
        )
        .filter(Page.book_id == book_id)
        .first()
    )

    # Get top 5 excerpts by vibe score
    top_pages = (
        db.query(Page)
        .filter(Page.book_id == book_id)
        .order_by(Page.vibe_score.desc())
        .limit(5)
        .all()
    )

    top_excerpts = [
        PageSummary(
            id=p.id,
            page_number=p.page_number,
            content_preview=p.content_text[:150] + "..."
            if len(p.content_text) > 150
            else p.content_text,
            vibe_score=p.vibe_score,
        )
        for p in top_pages
    ]

    links = _build_external_links(book)

    return BookDetail(
        id=book.id,
        gutenberg_id=book.gutenberg_id,
        title=book.title,
        author=book.author,
        cover_url=book.cover_url,
        page_count=page_stats.total or 0,
        high_vibe_count=page_stats.high_vibe or 0,
        avg_vibe_score=round(page_stats.avg_score or 0, 3),
        gutenberg_url=links["gutenberg_url"],
        amazon_search_url=links["amazon_search_url"],
        goodreads_search_url=links["goodreads_search_url"],
        top_excerpts=top_excerpts,
    )


@router.get("/{book_id}/pages", response_model=BookPagesResponse)
def get_book_pages(
    book_id: int,
    high_vibe_only: bool = Query(
        False, description="Filter to high-vibe pages only"
    ),
    limit: int = Query(50, ge=1, le=200, description="Max pages to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
) -> BookPagesResponse:
    """
    Get pages for a specific book.

    Optionally filter to only high-vibe pages.
    """
    settings = get_settings()
    book = _get_book_or_404(db, book_id)

    query = db.query(Page).filter(Page.book_id == book_id)

    if high_vibe_only:
        query = query.filter(Page.vibe_score > settings.vibe_threshold)

    total = query.count()
    pages = query.order_by(Page.page_number).offset(offset).limit(limit).all()

    return BookPagesResponse(
        book_id=book.id,
        book_title=book.title,
        pages=[
            PageDetail(
                id=p.id,
                page_number=p.page_number,
                content_text=p.content_text,
                vibe_score=p.vibe_score,
            )
            for p in pages
        ],
        total=total,
        high_vibe_only=high_vibe_only,
    )


@router.get("", response_model=list[BookSummary])
def list_books(
    limit: int = Query(20, ge=1, le=100, description="Max books to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
) -> list[BookSummary]:
    """
    List all books with summary statistics.
    """
    # Subquery for page statistics
    page_stats = (
        db.query(
            Page.book_id,
            func.count(Page.id).label("page_count"),
            func.avg(Page.vibe_score).label("avg_score"),
        )
        .group_by(Page.book_id)
        .subquery()
    )

    # Join with books
    results = (
        db.query(Book, page_stats.c.page_count, page_stats.c.avg_score)
        .outerjoin(page_stats, Book.id == page_stats.c.book_id)
        .order_by(Book.title)
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        BookSummary(
            id=book.id,
            gutenberg_id=book.gutenberg_id,
            title=book.title,
            author=book.author,
            cover_url=book.cover_url,
            page_count=page_count or 0,
            avg_vibe_score=round(avg_score or 0, 3),
        )
        for book, page_count, avg_score in results
    ]
