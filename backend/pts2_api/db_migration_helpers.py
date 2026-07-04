"""Helpers para migraciones idempotentes.

Estas migraciones pueden aplicarse sobre bases de datos en estados distintos
(instalación nueva creada por Base.metadata.create_all con el esquema ya
completo, o una instalación existente que solo tiene el esquema previo a esta
migración) — por eso cada operación se protege con una verificación explícita
en vez de asumir el estado de la tabla.
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


def _inspector():
    return sa.inspect(op.get_bind())


def add_column_if_missing(table: str, column: sa.Column) -> None:
    existing = {c["name"] for c in _inspector().get_columns(table)}
    if column.name not in existing:
        op.add_column(table, column)


def drop_column_if_exists(table: str, column_name: str) -> None:
    existing = {c["name"] for c in _inspector().get_columns(table)}
    if column_name in existing:
        op.drop_column(table, column_name)


def create_index_if_missing(index_name: str, table: str, columns: list[str]) -> None:
    existing = {i["name"] for i in _inspector().get_indexes(table)}
    if index_name not in existing:
        op.create_index(index_name, table, columns)


def drop_index_if_exists(index_name: str, table: str) -> None:
    existing = {i["name"] for i in _inspector().get_indexes(table)}
    if index_name in existing:
        op.drop_index(index_name, table_name=table)


def alter_column_type_if_needed(table: str, column_name: str, new_type: sa.types.TypeEngine) -> None:
    """Amplía/cambia el tipo de una columna solo si su tipo actual difiere."""
    columns = {c["name"]: c for c in _inspector().get_columns(table)}
    if column_name not in columns:
        return
    current_type = columns[column_name]["type"]
    # Comparación simple por longitud para tipos String/VARCHAR
    current_len = getattr(current_type, "length", None)
    new_len = getattr(new_type, "length", None)
    if current_len is not None and new_len is not None and current_len >= new_len:
        return
    op.alter_column(table, column_name, existing_type=current_type, type_=new_type)
