"""add_custom_books_comments_reviews

Revision ID: e8f75d2b2b44
Revises: c8f75d2b2b43
Create Date: 2026-06-06 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e8f75d2b2b44"
down_revision: Union[str, None] = "c8f75d2b2b43"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use batch alter table for books
    with op.batch_alter_table("books", schema=None) as batch_op:
        batch_op.add_column(sa.Column("is_user_uploaded", sa.Boolean(), server_default=sa.text("false"), nullable=False))
        batch_op.add_column(sa.Column("creator_device_id", sa.String(), nullable=True))
        batch_op.alter_column("gutenberg_id", existing_type=sa.Integer(), nullable=True)
        batch_op.create_index(batch_op.f("ix_books_creator_device_id"), ["creator_device_id"], unique=False)

    # Create comments table
    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("page_id", sa.Integer(), nullable=False),
        sa.Column("device_id", sa.String(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["page_id"], ["pages.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_comments_device_id"), "comments", ["device_id"], unique=False)
    op.create_index(op.f("ix_comments_id"), "comments", ["id"], unique=False)
    op.create_index(op.f("ix_comments_page_id"), "comments", ["page_id"], unique=False)

    # Create reviews table
    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("book_id", sa.Integer(), nullable=False),
        sa.Column("device_id", sa.String(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["book_id"], ["books.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_reviews_book_id"), "reviews", ["book_id"], unique=False)
    op.create_index(op.f("ix_reviews_device_id"), "reviews", ["device_id"], unique=False)
    op.create_index(op.f("ix_reviews_id"), "reviews", ["id"], unique=False)


def downgrade() -> None:
    # Drop reviews
    op.drop_index(op.f("ix_reviews_id"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_device_id"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_book_id"), table_name="reviews")
    op.drop_table("reviews")

    # Drop comments
    op.drop_index(op.f("ix_comments_page_id"), table_name="comments")
    op.drop_index(op.f("ix_comments_id"), table_name="comments")
    op.drop_index(op.f("ix_comments_device_id"), table_name="comments")
    op.drop_table("comments")

    # Revert books alterations
    with op.batch_alter_table("books", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_books_creator_device_id"))
        batch_op.alter_column("gutenberg_id", existing_type=sa.Integer(), nullable=False)
        batch_op.drop_column("creator_device_id")
        batch_op.drop_column("is_user_uploaded")
