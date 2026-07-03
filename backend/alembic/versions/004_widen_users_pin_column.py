"""Widen users.pin to fit hashed PINs (salt:hash, ~129 chars)

Revision ID: 004
Revises: 003
Create Date: 2026-07-03
"""

from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "users", "pin",
        existing_type=sa.String(10),
        type_=sa.String(200),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "users", "pin",
        existing_type=sa.String(200),
        type_=sa.String(10),
        existing_nullable=False,
    )
