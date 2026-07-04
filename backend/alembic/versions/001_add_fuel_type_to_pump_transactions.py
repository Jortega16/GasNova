"""add fuel_type to pump_transactions

Revision ID: 001
Revises:
Create Date: 2026-06-30

Idempotente: puede correr sobre una DB que ya tenga esta columna (creada por
Base.metadata.create_all con el esquema actual) sin fallar.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

from pts2_api.db_migration_helpers import add_column_if_missing, create_index_if_missing

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    add_column_if_missing(
        "pump_transactions",
        sa.Column("fuel_type", sa.String(50), nullable=True, comment="Tipo de combustible: Regular Unleaded, Diesel, etc."),
    )
    create_index_if_missing("idx_pump_transaction_fuel_type", "pump_transactions", ["fuel_type"])

    # Back-fill fuel_type from raw_payload o número de manguera para filas existentes
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
