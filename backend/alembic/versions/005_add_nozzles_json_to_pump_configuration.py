"""Add nozzles_json to pump_configuration for persistent nozzle→fuel mapping.

Revision ID: 005
Revises: 004
Create Date: 2026-07-24
"""
from __future__ import annotations

import sqlalchemy as sa

from pts2_api.db_migration_helpers import add_column_if_missing, drop_column_if_exists

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    add_column_if_missing(
        "pump_configuration",
        sa.Column("nozzles_json", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    drop_column_if_exists("pump_configuration", "nozzles_json")
