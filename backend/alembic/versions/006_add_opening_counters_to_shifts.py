"""Add opening_counters JSON to shifts for PTS totalizer snapshots at shift open.

Revision ID: 006
Revises: 005
Create Date: 2026-08-11
"""
from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from pts2_api.db_migration_helpers import add_column_if_missing, drop_column_if_exists

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    add_column_if_missing(
        "shifts",
        sa.Column(
            "opening_counters",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=True,
            comment="Snapshot PumpGetTotals por cara al abrir el turno",
        ),
    )


def downgrade() -> None:
    drop_column_if_exists("shifts", "opening_counters")
