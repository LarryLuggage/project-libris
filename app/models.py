from datetime import datetime
from typing import List, Optional

from sqlalchemy import Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    gutenberg_id: Mapped[int] = mapped_column(unique=True, index=True)
    title: Mapped[str] = mapped_column(index=True)
    author: Mapped[str]
    cover_url: Mapped[Optional[str]]

    pages: Mapped[List["Page"]] = relationship(
        back_populates="book", cascade="all, delete-orphan"
    )


class Page(Base):
    __tablename__ = "pages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"))
    page_number: Mapped[int]
    content_text: Mapped[str] = mapped_column(Text)
    vibe_score: Mapped[float] = mapped_column(index=True)

    book: Mapped["Book"] = relationship(back_populates="pages")


class Bookmark(Base):
    """User bookmark for a page (device-based, no auth required)."""

    __tablename__ = "bookmarks"
    __table_args__ = (
        UniqueConstraint("device_id", "page_id", name="uix_device_page_bookmark"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    device_id: Mapped[str] = mapped_column(index=True)
    page_id: Mapped[int] = mapped_column(ForeignKey("pages.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    page: Mapped["Page"] = relationship()


class Like(Base):
    """User like for a page (device-based, no auth required)."""

    __tablename__ = "likes"
    __table_args__ = (
        UniqueConstraint("device_id", "page_id", name="uix_device_page_like"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    device_id: Mapped[str] = mapped_column(index=True)
    page_id: Mapped[int] = mapped_column(ForeignKey("pages.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    page: Mapped["Page"] = relationship()
