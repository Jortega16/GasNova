"""Persistence helpers for pending and completed fuel transactions."""

from __future__ import annotations

import re
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import or_
from sqlalchemy.orm import Session

from .models import PendingTransaction, PumpTransaction, Shift


def parse_optional_datetime(value: Any) -> datetime | None:
    if value is None or isinstance(value, datetime):
        return value
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def serialize_pending_transaction(pending: PendingTransaction) -> dict[str, Any]:
    return {
        "id": pending.trx_id,
        "trx_id": pending.trx_id,
        "pumpId": pending.pump_id,
        "pump_id": pending.pump_id,
        "nozzle": pending.nozzle,
        "volume": pending.volume,
        "amount": pending.amount,
        "fuelType": pending.fuel_type,
        "fuel_type": pending.fuel_type,
        "pts_transaction_id": pending.pts_transaction_id,
        "shift_id": pending.shift_id,
        "status": pending.status,
        "station_code": pending.station_code,
        "pos_terminal_code": pending.pos_terminal_code,
        "started_at": pending.started_at.isoformat() if pending.started_at else None,
        "completed_at": pending.completed_at.isoformat() if pending.completed_at else None,
        "dateTime": pending.created_at.strftime("%Y-%m-%d %I:%M %p") if pending.created_at else "N/A",
    }


def serialize_completed_transaction(transaction: PumpTransaction) -> dict[str, Any]:
    return {
        "id": transaction.id,
        "transaction_id": transaction.transaction_id,
        "pump_id": transaction.pump_id,
        "nozzle": transaction.nozzle,
        "volume": transaction.volume,
        "amount": transaction.amount,
        "unit_price": transaction.unit_price,
        "status": transaction.status,
        "shift_id": transaction.shift_id,
        "payment_type": transaction.payment_type,
        "document_type": transaction.document_type,
        "document_number": transaction.document_number,
        "payment_reference": transaction.payment_reference,
        "cashier_name": transaction.cashier_name,
        "source_pending_trx_id": transaction.source_pending_trx_id,
        "station_code": transaction.station_code,
        "pos_terminal_code": transaction.pos_terminal_code,
    }


def normalize_transaction_id(value: str | int | None, fallback: int | None = None) -> int:
    if isinstance(value, int):
        return value
    if value:
        digits = re.findall(r"\d+", str(value))
        if digits:
            return int(digits[-1])
    return int(fallback or 0)


def get_active_shift_id(db: Session) -> str | None:
    active_shift = db.query(Shift).filter(Shift.status == "Active").first()
    return active_shift.shift_id if active_shift else None


def upsert_pending_transaction(
    db: Session,
    *,
    pump_id: int,
    trx_id: str,
    nozzle: int | None,
    volume: float | None,
    amount: float | None,
    fuel_type: str | None,
    pts_transaction_id: str | None = None,
    raw_payload: dict[str, Any] | None = None,
    shift_id: str | None = None,
    started_at: datetime | str | None = None,
    completed_at: datetime | str | None = None,
    status: str = "Pending",
    station_code: str | None = None,
    pos_terminal_code: str | None = None,
) -> tuple[PendingTransaction, bool]:
    existing = db.query(PendingTransaction).filter(PendingTransaction.trx_id == trx_id).first()
    if existing:
        if raw_payload and not existing.raw_payload:
            existing.raw_payload = raw_payload
        if pts_transaction_id and not existing.pts_transaction_id:
            existing.pts_transaction_id = pts_transaction_id
        if shift_id and not existing.shift_id:
            existing.shift_id = shift_id
        db.commit()
        db.refresh(existing)
        return existing, False

    transaction_id = normalize_transaction_id(trx_id)
    completed = db.query(PumpTransaction).filter(
        or_(
            PumpTransaction.source_pending_trx_id == trx_id,
            (PumpTransaction.pump_id == pump_id) & (PumpTransaction.transaction_id == transaction_id),
        )
    ).first()
    if completed:
        already_completed = PendingTransaction(
            trx_id=trx_id,
            pump_id=pump_id,
            nozzle=nozzle or completed.nozzle or 1,
            volume=volume or completed.volume or 0.0,
            amount=amount or completed.amount or 0.0,
            fuel_type=fuel_type or "Unknown",
            pts_transaction_id=pts_transaction_id,
            raw_payload=raw_payload or completed.raw_payload,
            shift_id=shift_id or completed.shift_id,
            started_at=parse_optional_datetime(started_at) or completed.start_time,
            completed_at=parse_optional_datetime(completed_at) or completed.end_time,
            status="Completed",
            station_code=station_code or completed.station_code,
            pos_terminal_code=pos_terminal_code or completed.pos_terminal_code,
        )
        return already_completed, False

    pending = PendingTransaction(
        trx_id=trx_id,
        pump_id=pump_id,
        nozzle=nozzle or 1,
        volume=volume or 0.0,
        amount=amount or 0.0,
        fuel_type=fuel_type or "Unknown",
        pts_transaction_id=pts_transaction_id,
        raw_payload=raw_payload,
        shift_id=shift_id or get_active_shift_id(db),
        started_at=parse_optional_datetime(started_at),
        completed_at=parse_optional_datetime(completed_at) or datetime.now(timezone.utc),
        status=status,
        station_code=station_code,
        pos_terminal_code=pos_terminal_code,
    )
    db.add(pending)
    db.commit()
    db.refresh(pending)
    return pending, True


def complete_pending_transaction(
    db: Session,
    *,
    pump_id: int,
    trx_id: str,
    payment_type: str = "Cash",
    status: str = "Completed",
    document_type: str | None = None,
    document_number: str | None = None,
    payment_reference: str | None = None,
    cashier_name: str | None = None,
) -> tuple[PumpTransaction, bool]:
    pending = db.query(PendingTransaction).filter(
        PendingTransaction.pump_id == pump_id,
        PendingTransaction.trx_id == trx_id,
    ).first()
    if pending is None:
        raise LookupError("No se encontró la transacción pendiente")

    transaction_id = normalize_transaction_id(pending.trx_id, fallback=pending.id)
    existing_completed = db.query(PumpTransaction).filter(
        PumpTransaction.pump_id == pump_id,
        PumpTransaction.transaction_id == transaction_id,
    ).first()
    if existing_completed:
        db.delete(pending)
        db.commit()
        return existing_completed, False

    _FUEL_GRADES = ["Regular Unleaded", "Premium Unleaded", "Diesel", "Kerosene"]

    def _resolve_fuel_type(fuel_type: str | None, nozzle: int | None, raw: dict | None) -> str | None:
        if fuel_type and fuel_type != "Unknown":
            return fuel_type
        if raw:
            candidate = (
                raw.get("FuelGradeName") or raw.get("Product")
                or raw.get("ProductName") or raw.get("fuelType")
                or raw.get("fuel_type")
            )
            if candidate:
                return candidate
        if nozzle and 1 <= nozzle <= len(_FUEL_GRADES):
            return _FUEL_GRADES[nozzle - 1]
        return None

    resolved_fuel = _resolve_fuel_type(pending.fuel_type, pending.nozzle, pending.raw_payload)
    unit_price = pending.amount / pending.volume if pending.volume else None
    transaction = PumpTransaction(
        pump_id=pump_id,
        transaction_id=transaction_id,
        nozzle=pending.nozzle,
        fuel_type=resolved_fuel,
        volume=pending.volume,
        amount=pending.amount,
        unit_price=unit_price,
        start_time=pending.started_at,
        end_time=pending.completed_at,
        status=f"{status} ({payment_type})",
        shift_id=pending.shift_id or get_active_shift_id(db),
        payment_type=payment_type,
        document_type=document_type,
        document_number=document_number,
        payment_reference=payment_reference,
        cashier_name=cashier_name,
        source_pending_trx_id=pending.trx_id,
        station_code=pending.station_code,
        pos_terminal_code=pending.pos_terminal_code,
        raw_payload=pending.raw_payload,
    )
    db.add(transaction)
    db.delete(pending)
    db.commit()
    db.refresh(transaction)
    return transaction, True


def build_shift_closure_totals(transactions: list[PumpTransaction]) -> dict[str, Any]:
    fuel_grades = ["Regular Unleaded", "Premium Unleaded", "Diesel", "Kerosene"]
    total_sales = sum(t.amount or 0.0 for t in transactions)
    total_volume = sum(t.volume or 0.0 for t in transactions)
    fuel_totals: dict[str, dict[str, Any]] = defaultdict(lambda: {"fuel_type": "Unknown", "volume": 0.0, "sales": 0.0, "count": 0})
    payment_totals: dict[str, dict[str, Any]] = defaultdict(lambda: {"payment_type": "Unknown", "sales": 0.0, "count": 0})

    for transaction in transactions:
        # Prefer the stored fuel_type column; fall back to raw_payload then nozzle index.
        fuel_type: str = transaction.fuel_type or "Unknown"
        if fuel_type == "Unknown":
            if transaction.raw_payload:
                fuel_type = (
                    transaction.raw_payload.get("FuelGradeName")
                    or transaction.raw_payload.get("Product")
                    or transaction.raw_payload.get("ProductName")
                    or "Unknown"
                )
            if fuel_type == "Unknown" and transaction.nozzle:
                nozzle_idx = transaction.nozzle - 1
                if 0 <= nozzle_idx < len(fuel_grades):
                    fuel_type = fuel_grades[nozzle_idx]

        fuel_item = fuel_totals[fuel_type]
        fuel_item["fuel_type"] = fuel_type
        fuel_item["volume"] += transaction.volume or 0.0
        fuel_item["sales"] += transaction.amount or 0.0
        fuel_item["count"] += 1

        payment_type = transaction.payment_type or "Unknown"
        payment_item = payment_totals[payment_type]
        payment_item["payment_type"] = payment_type
        payment_item["sales"] += transaction.amount or 0.0
        payment_item["count"] += 1

    return {
        "total_sales": round(total_sales, 2),
        "total_volume": round(total_volume, 3),
        "transaction_count": len(transactions),
        "fuel_breakdown": list(fuel_totals.values()),
        "payment_breakdown": list(payment_totals.values()),
    }
