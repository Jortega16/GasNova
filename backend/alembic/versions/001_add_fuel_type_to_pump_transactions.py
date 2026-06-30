"""add fuel_type to pump_transactions

Revision ID: 001
Revises:
Create Date: 2026-06-30

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("pump_transactions") as batch_op:
        batch_op.add_column(
            sa.Column("fuel_type", sa.String(50), nullable=True, comment="Tipo de combustible: Regular Unleaded, Diesel, etc.")
        )
        batch_op.create_index("idx_pump_transaction_fuel_type", ["fuel_type"])

    # Back-fill fuel_type from raw_payload or nozzle number for existing rows
    op.execute("""
        UPDATE pump_transactions
        SET fuel_type = CASE
            WHEN nozzle = 1 THEN 'Regular Unleaded'
            WHEN nozzle = 2 THEN 'Premium Unleaded'
            WHEN nozzle = 3 THEN 'Diesel'
            WHEN nozzle = 4 THEN 'Kerosene'
            ELSE NULL
        END
        WHERE fuel_type IS NULL
    """)


def downgrade() -> None:
    with op.batch_alter_table("pump_transactions") as batch_op:
        batch_op.drop_index("idx_pump_transaction_fuel_type")
        batch_op.drop_column("fuel_type")
