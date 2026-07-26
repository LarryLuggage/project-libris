"""add_story_club_leads

Revision ID: d4d2a6b19731
Revises: aa3de312d20e
Create Date: 2026-06-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d4d2a6b19731"
down_revision: Union[str, None] = "aa3de312d20e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "story_club_leads",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("genre_preferences", sa.Text(), nullable=True),
        sa.Column(
            "willing_to_pay_5",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_story_club_leads_email"), "story_club_leads", ["email"], unique=True)
    op.create_index(op.f("ix_story_club_leads_id"), "story_club_leads", ["id"], unique=False)
    op.create_index(op.f("ix_story_club_leads_role"), "story_club_leads", ["role"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_story_club_leads_role"), table_name="story_club_leads")
    op.drop_index(op.f("ix_story_club_leads_id"), table_name="story_club_leads")
    op.drop_index(op.f("ix_story_club_leads_email"), table_name="story_club_leads")
    op.drop_table("story_club_leads")
