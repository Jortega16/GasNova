"""Add counter_breakdown to shift_closures

Revision ID: 003
Revises: 002
Create Date: 2026-07-03

Idempotente: puede correr sobre una DB que ya tenga esta columna (creada por
Base.metadata.create_all con el esquema actual) sin fallar.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from pts2_api.db_migration_helpers import add_column_if_missing, drop_column_if_exists

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    add_column_if_missing(
        "shift_closures",
        sa.Column("counter_breakdown", postgresql.JSON(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    drop_column_if_exists("shift_closures", "counter_breakdown")
