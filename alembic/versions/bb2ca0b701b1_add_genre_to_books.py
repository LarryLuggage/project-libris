"""add_genre_to_books

Revision ID: bb2ca0b701b1
Revises: e8f75d2b2b44
Create Date: 2026-06-06 18:21:53.459399

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bb2ca0b701b1'
down_revision: Union[str, None] = 'e8f75d2b2b44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add genre column to books table
    with op.batch_alter_table("books", schema=None) as batch_op:
        batch_op.add_column(sa.Column("genre", sa.String(), nullable=True))

    # Update existing books based on authors
    connection = op.get_bind()
    connection.execute(
        sa.text("UPDATE books SET genre = 'Drama' WHERE lower(author) LIKE '%shakespeare%'")
    )
    connection.execute(
        sa.text("UPDATE books SET genre = 'Fiction' WHERE lower(author) LIKE '%austen%'")
    )
    connection.execute(
        sa.text("UPDATE books SET genre = 'Philosophy' WHERE lower(author) LIKE '%plato%' OR lower(author) LIKE '%machiavelli%'")
    )
    connection.execute(
        sa.text("UPDATE books SET genre = 'Poetry' WHERE lower(author) LIKE '%poe%'")
    )
    connection.execute(
        sa.text("UPDATE books SET genre = 'Fiction/Adventurous' WHERE lower(author) LIKE '%verne%'")
    )
    # Set default genre for any other books
    connection.execute(
        sa.text("UPDATE books SET genre = 'Fiction' WHERE genre IS NULL")
    )


def downgrade() -> None:
    with op.batch_alter_table("books", schema=None) as batch_op:
        batch_op.drop_column("genre")

