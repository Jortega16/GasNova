"""add sd sync fields to pump_transactions

Revision ID: 002
Revises: 001
Create Date: 2026-07-02

Adds columns needed to store full jsonPTS transaction data received via
ReportGetPumpTransactions (cmd #188) and track the sync origin.

Idempotente: puede correr sobre una DB que ya tenga estas columnas (creada
por Base.metadata.create_all con el esquema actual) sin fallar.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

from pts2_api.db_migration_helpers import add_column_if_missing, create_index_if_missing

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    add_column_if_missing("pump_transactions", sa.Column("tc_volume", sa.Float(), nullable=True,
        comment="Volumen compensado por temperatura (TCVolume jsonPTS)"))
    add_column_if_missing("pump_transactions", sa.Column("unit_price", sa.Float(), nullable=True,
        comment="Precio por unidad"))
    add_column_if_missing("pump_transactions", sa.Column("total_volume", sa.Float(), nullable=True,
        comment="Contador total de volumen acumulado en la bomba (TotalVolume jsonPTS)"))
    add_column_if_missing("pump_transactions", sa.Column("total_amount", sa.Float(), nullable=True,
        comment="Contador total de monto acumulado en la bomba (TotalAmount jsonPTS)"))
    add_column_if_missing("pump_transactions", sa.Column("flow_rate", sa.Integer(), nullable=True,
        comment="Caudal de despacho en unidades/min (FlowRate jsonPTS)"))
    add_column_if_missing("pump_transactions", sa.Column("start_time", sa.DateTime(), nullable=True))
    add_column_if_missing("pump_transactions", sa.Column("end_time", sa.DateTime(), nullable=True))
    add_column_if_missing("pump_transactions", sa.Column("status", sa.String(50), nullable=True,
        comment="Estado: completed, cancelled, etc"))
    add_column_if_missing("pump_transactions", sa.Column("is_paid", sa.Boolean(), nullable=True,
        comment="Transacción cobrada (IsPaid jsonPTS)"))
    add_column_if_missing("pump_transactions", sa.Column("is_offline", sa.Boolean(), nullable=True,
        comment="Despacho en modo offline/manual (IsOffline jsonPTS)"))
    add_column_if_missing("pump_transactions", sa.Column("shift_number", sa.Integer(), nullable=True,
        comment="Número de turno del PTS-2 (ShiftNumber jsonPTS)"))
    add_column_if_missing("pump_transactions", sa.Column("rfid_tag", sa.String(64), nullable=True,
        comment="Tag RFID usado en la autorización (Tag jsonPTS)"))
    add_column_if_missing("pump_transactions", sa.Column("pts_user_id", sa.Integer(), nullable=True,
        comment="ID de usuario PTS-2 que autorizó (UserId jsonPTS)"))
    add_column_if_missing("pump_transactions", sa.Column("sync_source", sa.String(30), nullable=True,
        comment="Origen: websocket | sd_recovery | manual"))
    create_index_if_missing("idx_pump_transaction_sync_source", "pump_transactions", ["sync_source"])


def downgrade() -> None:
    with op.batch_alter_table("pump_transactions") as batch_op:
        batch_op.drop_index("idx_pump_transaction_sync_source")
        for col in [
            "tc_volume", "unit_price", "total_volume", "total_amount",
            "flow_rate", "start_time", "end_time", "status",
            "is_paid", "is_offline", "shift_number", "rfid_tag",
            "pts_user_id", "sync_source",
        ]:
            batch_op.drop_column(col)
