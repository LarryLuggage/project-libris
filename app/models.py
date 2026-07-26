from datetime import datetime
from typing import List, Optional

from sqlalchemy import Text, ForeignKey, UniqueConstraint, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Book(Base):
    __tablename__ = "books"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    gutenberg_id: Mapped[Optional[int]] = mapped_column(unique=True, index=True, nullable=True)
    title: Mapped[str] = mapped_column(index=True)
    author: Mapped[str]
    cover_url: Mapped[Optional[str]]
    is_user_uploaded: Mapped[bool] = mapped_column(default=False, server_default=text("0"))
    creator_device_id: Mapped[Optional[str]] = mapped_column(nullable=True, index=True)
    genre: Mapped[Optional[str]] = mapped_column(nullable=True)

    pages: Mapped[List["Page"]] = relationship(
        back_populates="book", cascade="all, delete-orphan"
    )
    reviews: Mapped[List["Review"]] = relationship(
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
    comments: Mapped[List["Comment"]] = relationship(
        back_populates="page", cascade="all, delete-orphan"
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(unique=True, index=True)
    password_hash: Mapped[str] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    bookmarks: Mapped[List["Bookmark"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    likes: Mapped[List["Like"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    comments: Mapped[List["Comment"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    reviews: Mapped[List["Review"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Bookmark(Base):
    """User bookmark for a page (device-based, no auth required)."""

    __tablename__ = "bookmarks"
    __table_args__ = (
        UniqueConstraint("device_id", "page_id", name="uix_device_page_bookmark"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    device_id: Mapped[str] = mapped_column(index=True)
    page_id: Mapped[int] = mapped_column(ForeignKey("pages.id"), index=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    page: Mapped["Page"] = relationship()
    user: Mapped[Optional["User"]] = relationship(back_populates="bookmarks")


class Like(Base):
    """User like for a page (device-based, no auth required)."""

    __tablename__ = "likes"
    __table_args__ = (
        UniqueConstraint("device_id", "page_id", name="uix_device_page_like"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    device_id: Mapped[str] = mapped_column(index=True)
    page_id: Mapped[int] = mapped_column(ForeignKey("pages.id"), index=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    page: Mapped["Page"] = relationship()
    user: Mapped[Optional["User"]] = relationship(back_populates="likes")


class FeedEvent(Base):
    """Device-scoped feed event used for repeat suppression and analytics."""

    __tablename__ = "feed_events"
    __table_args__ = (
        UniqueConstraint(
            "device_id", "page_id", "event_type", name="uix_device_page_event"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    device_id: Mapped[str] = mapped_column(index=True)
    page_id: Mapped[int] = mapped_column(ForeignKey("pages.id"), index=True)
    event_type: Mapped[str] = mapped_column(index=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    page: Mapped["Page"] = relationship()


class Comment(Base):
    """User comment on a page (device-based, no auth required)."""

    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    page_id: Mapped[int] = mapped_column(ForeignKey("pages.id", ondelete="CASCADE"), index=True)
    device_id: Mapped[str] = mapped_column(index=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    page: Mapped["Page"] = relationship(back_populates="comments")
    user: Mapped[Optional["User"]] = relationship(back_populates="comments")

    @property
    def username(self) -> str:
        return self.user.username if self.user else "Anonymous"



class Review(Base):
    """User review/rating for a book (device-based, no auth required)."""

    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), index=True)
    device_id: Mapped[str] = mapped_column(index=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    rating: Mapped[int] = mapped_column()
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    book: Mapped["Book"] = relationship(back_populates="reviews")
    user: Mapped[Optional["User"]] = relationship(back_populates="reviews")

    @property
    def username(self) -> str:
        return self.user.username if self.user else "Anonymous"


class StoryClubLead(Base):
    """Waitlist intake for the Story Club concierge pilot."""

    __tablename__ = "story_club_leads"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str]
    email: Mapped[str] = mapped_column(unique=True, index=True)
    role: Mapped[str] = mapped_column(index=True)
    genre_preferences: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    willing_to_pay_5: Mapped[bool] = mapped_column(default=False, server_default=text("0"))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )
