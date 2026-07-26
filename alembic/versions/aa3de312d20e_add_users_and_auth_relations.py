"""add_users_and_auth_relations

Revision ID: aa3de312d20e
Revises: bb2ca0b701b1
Create Date: 2026-06-06 18:21:58.345710

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aa3de312d20e'
down_revision: Union[str, None] = 'bb2ca0b701b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username")
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    # For bookmarks
    with op.batch_alter_table("bookmarks", schema=None) as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key("fk_bookmarks_user_id", "users", ["user_id"], ["id"], ondelete="CASCADE")
        batch_op.create_index(batch_op.f("ix_bookmarks_user_id"), ["user_id"], unique=False)

    # For likes
    with op.batch_alter_table("likes", schema=None) as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key("fk_likes_user_id", "users", ["user_id"], ["id"], ondelete="CASCADE")
        batch_op.create_index(batch_op.f("ix_likes_user_id"), ["user_id"], unique=False)

    # For comments
    with op.batch_alter_table("comments", schema=None) as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key("fk_comments_user_id", "users", ["user_id"], ["id"], ondelete="CASCADE")
        batch_op.create_index(batch_op.f("ix_comments_user_id"), ["user_id"], unique=False)

    # For reviews
    with op.batch_alter_table("reviews", schema=None) as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key("fk_reviews_user_id", "users", ["user_id"], ["id"], ondelete="CASCADE")
        batch_op.create_index(batch_op.f("ix_reviews_user_id"), ["user_id"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("reviews", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_reviews_user_id"))
        batch_op.drop_constraint("fk_reviews_user_id", type_="foreignkey")
        batch_op.drop_column("user_id")

    with op.batch_alter_table("comments", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_comments_user_id"))
        batch_op.drop_constraint("fk_comments_user_id", type_="foreignkey")
        batch_op.drop_column("user_id")

    with op.batch_alter_table("likes", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_likes_user_id"))
        batch_op.drop_constraint("fk_likes_user_id", type_="foreignkey")
        batch_op.drop_column("user_id")

    with op.batch_alter_table("bookmarks", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_bookmarks_user_id"))
        batch_op.drop_constraint("fk_bookmarks_user_id", type_="foreignkey")
        batch_op.drop_column("user_id")

    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")

