"""Widen users.pin to fit hashed PINs (salt:hash, ~129 chars)

Revision ID: 004
Revises: 003
Create Date: 2026-07-03

Idempotente: solo altera la columna si su longitud actual es menor a la
requerida (evita fallar si ya fue ampliada, o si la tabla fue creada
directamente con el esquema actual por Base.metadata.create_all).
"""
from __future__ import annotations

import sqlalchemy as sa

from pts2_api.db_migration_helpers import alter_column_type_if_needed

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    alter_column_type_if_needed("users", "pin", sa.String(200))


def downgrade() -> None:
    alter_column_type_if_needed("users", "pin", sa.String(10))
