from typing import List, Optional
from sqlalchemy import Text, ForeignKey
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

    # Relationship to Page
    pages: Mapped[List["Page"]] = relationship(back_populates="book", cascade="all, delete-orphan")

class Page(Base):
    __tablename__ = "pages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    book_id: Mapped[int] = mapped_column(ForeignKey("books.id"))
    page_number: Mapped[int]
    content_text: Mapped[str] = mapped_column(Text)
    vibe_score: Mapped[float] = mapped_column(index=True)

    # Relationship to Book
    book: Mapped["Book"] = relationship(back_populates="pages")
