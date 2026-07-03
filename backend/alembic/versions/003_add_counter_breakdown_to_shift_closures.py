"""Add counter_breakdown to shift_closures

Revision ID: 003
Revises: 002
Create Date: 2026-07-03
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "shift_closures",
        sa.Column("counter_breakdown", postgresql.JSON(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("shift_closures", "counter_breakdown")
