"""Add feed events

Revision ID: c8f75d2b2b43
Revises: a24c2e3a21bd
Create Date: 2026-04-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c8f75d2b2b43"
down_revision: Union[str, None] = "a24c2e3a21bd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "feed_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("device_id", sa.String(), nullable=False),
        sa.Column("page_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["page_id"], ["pages.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("device_id", "page_id", "event_type", name="uix_device_page_event"),
    )
    op.create_index(op.f("ix_feed_events_device_id"), "feed_events", ["device_id"])
    op.create_index(op.f("ix_feed_events_event_type"), "feed_events", ["event_type"])
    op.create_index(op.f("ix_feed_events_id"), "feed_events", ["id"])
    op.create_index(op.f("ix_feed_events_page_id"), "feed_events", ["page_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_feed_events_page_id"), table_name="feed_events")
    op.drop_index(op.f("ix_feed_events_id"), table_name="feed_events")
    op.drop_index(op.f("ix_feed_events_event_type"), table_name="feed_events")
    op.drop_index(op.f("ix_feed_events_device_id"), table_name="feed_events")
    op.drop_table("feed_events")
