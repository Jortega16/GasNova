"""Shift management router."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_pts2_client
from ..models import Shift, PumpTransaction, PendingTransaction, ShiftClosure
from ..pump_counters import (
    build_shift_counter_breakdown,
    read_all_pump_counters,
)
from ..schemas import CommandResponse, ShiftCreate, ShiftResponse
from ..transaction_store import build_shift_closure_totals, serialize_pending_transaction

router = APIRouter(prefix="/shifts", tags=["shifts"])


def seed_initial_shift_if_empty(db: Session) -> None:
    """Seed initial active shift if database is empty."""
    if db.query(Shift).count() == 0:
        initial_shift = Shift(
            shift_id="SH-20240527-01",
            operator_name="John Doe",
            start_time="2024-05-27 06:00 AM",
            end_time="",
            status="Active",
        )
        db.add(initial_shift)
        db.commit()


def _serialize_shift(s: Shift) -> dict[str, Any]:
    return ShiftResponse(
        id=s.id,
        shift_id=s.shift_id,
        operator_name=s.operator_name,
        start_time=s.start_time,
        end_time=s.end_time,
        status=s.status,
        opening_counters=s.opening_counters,
    ).model_dump()


def _ensure_opening_counters(db: Session, shift: Shift, client) -> list[dict[str, Any]]:
    """Captura snapshot de apertura si aún no existe."""
    if shift.opening_counters:
        return list(shift.opening_counters)
    try:
        snapshot = read_all_pump_counters(client, db)
    except Exception:
        snapshot = []
    if snapshot:
        shift.opening_counters = snapshot
        db.commit()
        db.refresh(shift)
    return snapshot


@router.get("", response_model=CommandResponse, summary="Get shift logs")
def list_shifts(
    db: Session = Depends(get_db),
    client=Depends(get_pts2_client),
) -> CommandResponse:
    """Get the history of closed and active station shifts."""
    seed_initial_shift_if_empty(db)
    try:
        active = db.query(Shift).filter(Shift.status == "Active").order_by(Shift.created_at.desc()).first()
        if active and not active.opening_counters:
            _ensure_opening_counters(db, active, client)
    except Exception:
        pass
    finally:
        try:
            client.close()
        except Exception:
            pass

    shifts = db.query(Shift).order_by(Shift.created_at.desc()).all()
    return CommandResponse(data=[_serialize_shift(s) for s in shifts])


@router.post(
    "/{shift_id}/opening-counters",
    response_model=CommandResponse,
    summary="Capturar contadores de apertura del turno",
)
def capture_opening_counters(
    shift_id: str = Path(...),
    force: bool = False,
    db: Session = Depends(get_db),
    client=Depends(get_pts2_client),
) -> CommandResponse:
    """Guarda PumpGetTotals actuales como baseline del turno activo."""
    shift = db.query(Shift).filter(Shift.shift_id == shift_id, Shift.status == "Active").first()
    if not shift:
        raise HTTPException(status_code=404, detail="Turno activo no encontrado")
    if shift.opening_counters and not force:
        return CommandResponse(data={
            "shift_id": shift.shift_id,
            "opening_counters": shift.opening_counters,
            "captured": False,
            "message": "Ya existía snapshot de apertura",
        })
    try:
        snapshot = read_all_pump_counters(client, db)
    finally:
        client.close()
    shift.opening_counters = snapshot
    db.commit()
    db.refresh(shift)
    return CommandResponse(data={
        "shift_id": shift.shift_id,
        "opening_counters": shift.opening_counters,
        "captured": True,
    })


@router.post("/close", response_model=CommandResponse, summary="Close active shift")
def close_shift(
    request: ShiftCreate,
    db: Session = Depends(get_db),
    client=Depends(get_pts2_client),
) -> CommandResponse:
    """Cierra el turno activo con auditoría de contadores (apertura → cierre)."""
    active_shift = db.query(Shift).filter(
        Shift.shift_id == request.shift_id,
        Shift.status == "Active",
    ).first()

    if not active_shift:
        active_shift = (
            db.query(Shift)
            .filter(Shift.status == "Active")
            .order_by(Shift.created_at.desc())
            .first()
        )

    if not active_shift:
        try:
            client.close()
        except Exception:
            pass
        raise HTTPException(status_code=404, detail="No se encontró un turno activo para cerrar")

    # 1) Pendientes primero — no tocar PTS/BD si hay cobros pendientes
    pending_transactions = db.query(PendingTransaction).filter(
        or_(
            PendingTransaction.shift_id == active_shift.shift_id,
            PendingTransaction.shift_id.is_(None),
        )
    ).all()
    if pending_transactions:
        try:
            client.close()
        except Exception:
            pass
        raise HTTPException(
            status_code=409,
            detail={
                "message": "No se puede cerrar el turno con despachos pendientes por cobrar",
                "pending_transactions": [serialize_pending_transaction(p) for p in pending_transactions],
            },
        )

    # 2) SetClosing graceful (bloquea nuevas autorizaciones en PTS)
    if request.set_closing:
        try:
            client.request_data("ShiftClose", {"SetClosing": True})
        except Exception:
            pass

    # 3) Contadores de cierre + enriquecer con apertura
    opening = list(active_shift.opening_counters or [])
    if not opening:
        opening = _ensure_opening_counters(db, active_shift, client)

    try:
        closing = read_all_pump_counters(client, db)
    except Exception:
        # Fallback: confiar en lo que mandó el POS
        closing = []
        for row in (request.counter_breakdown or []):
            if isinstance(row, dict) and row.get("pump_id") is not None:
                closing.append({
                    "pump_id": row["pump_id"],
                    "pump_name": row.get("pump_name"),
                    "volume": row.get("closing_volume", row.get("mech_volume", 0)),
                    "amount": row.get("closing_amount", row.get("mech_amount", 0)),
                })

    system_by_pump: dict[int, dict[str, float]] = {}
    for row in (request.counter_breakdown or []):
        if not isinstance(row, dict):
            continue
        try:
            pid = int(row.get("pump_id") or 0)
        except (TypeError, ValueError):
            continue
        if not pid:
            continue
        system_by_pump[pid] = {
            "volume": float(row.get("system_volume") or 0),
            "amount": float(row.get("system_amount") or 0),
            "dispatch_count": float(row.get("dispatch_count") or 0),
        }

    counter_breakdown = build_shift_counter_breakdown(
        opening=opening,
        closing=closing,
        system_by_pump=system_by_pump,
    )

    shift_transactions = db.query(PumpTransaction).filter(
        PumpTransaction.shift_id == active_shift.shift_id
    ).all()
    totals = build_shift_closure_totals(shift_transactions)

    shift_closure = ShiftClosure(
        shift_id=active_shift.shift_id,
        operator_name=active_shift.operator_name,
        opened_at=active_shift.start_time,
        closed_at=request.end_time or "Now",
        total_sales=totals["total_sales"],
        total_volume=totals["total_volume"],
        transaction_count=totals["transaction_count"],
        fuel_breakdown=totals["fuel_breakdown"],
        payment_breakdown=totals["payment_breakdown"],
        pending_count=0,
        closure_status="Closed",
        counter_breakdown=counter_breakdown,
    )
    db.add(shift_closure)

    active_shift.status = "Closed"
    active_shift.end_time = request.end_time or "Now"
    db.commit()
    db.refresh(active_shift)
    db.refresh(shift_closure)

    # 4) Siguiente turno — hereda contadores de cierre como apertura
    today = datetime.now().strftime("%Y%m%d")
    parts = active_shift.shift_id.split("-")
    prev_date = parts[1] if len(parts) >= 3 else ""
    if prev_date == today:
        try:
            next_num = int(parts[-1]) + 1
        except ValueError:
            next_num = 1
    else:
        next_num = 1
    next_id = f"SH-{today}-{str(next_num).zfill(2)}"
    while db.query(Shift).filter(Shift.shift_id == next_id).first():
        next_num += 1
        next_id = f"SH-{today}-{str(next_num).zfill(2)}"

    next_shift = Shift(
        shift_id=next_id,
        operator_name=request.operator_name,
        start_time=request.end_time or "Now",
        end_time="",
        status="Active",
        opening_counters=closing or None,
    )
    db.add(next_shift)
    db.commit()
    db.refresh(next_shift)

    # 5) Cierre definitivo en PTS (después de persistir)
    try:
        client.request_data("ShiftClose", None)
    except Exception:
        pass
    finally:
        try:
            client.close()
        except Exception:
            pass

    return CommandResponse(data={
        "closed_shift": _serialize_shift(active_shift),
        "closure": {
            "id": shift_closure.id,
            "shift_id": shift_closure.shift_id,
            "operator_name": shift_closure.operator_name,
            "opened_at": shift_closure.opened_at,
            "closed_at": shift_closure.closed_at,
            "total_sales": shift_closure.total_sales,
            "total_volume": shift_closure.total_volume,
            "transaction_count": shift_closure.transaction_count,
            "fuel_breakdown": shift_closure.fuel_breakdown or [],
            "payment_breakdown": shift_closure.payment_breakdown or [],
            "pending_count": shift_closure.pending_count,
            "closure_status": shift_closure.closure_status,
            "counter_breakdown": shift_closure.counter_breakdown or [],
        },
        "totals": totals,
        "new_shift": {
            "shift_id": next_shift.shift_id,
            "operator_name": next_shift.operator_name,
            "start_time": next_shift.start_time,
            "status": next_shift.status,
            "opening_counters": next_shift.opening_counters,
        },
    })


@router.get("/{shift_id}/transactions", response_model=CommandResponse, summary="List transactions for a shift")
def list_shift_transactions(shift_id: str, db: Session = Depends(get_db)) -> CommandResponse:
    """Lista transacciones del turno (volumen tal cual; sin conversión Gal↔L)."""
    transactions = db.query(PumpTransaction).filter(PumpTransaction.shift_id == shift_id).all()

    fuel_grades = ["Regular Unleaded", "Premium Unleaded", "Diesel", "Kerosene"]

    serialized = []
    for t in transactions:
        nozzle = t.nozzle or 1
        fuel_type = None
        if t.raw_payload:
            fuel_type = (
                t.raw_payload.get("FuelGradeName")
                or t.raw_payload.get("Product")
                or t.raw_payload.get("ProductName")
                or t.raw_payload.get("fuelType")
                or t.raw_payload.get("fuel_type")
            )
        if not fuel_type:
            fuel_type = fuel_grades[nozzle - 1] if 1 <= nozzle <= len(fuel_grades) else "Regular Unleaded"

        volume_val = t.volume or 0.0
        amount_val = t.amount or 0.0
        # Reparar ventas históricas guardadas solo con monto (Volume=0 en el PTS)
        if volume_val <= 0 and amount_val > 0 and t.unit_price and t.unit_price > 0:
            volume_val = amount_val / float(t.unit_price)

        # No listar ventas en $0.00 / 0 litros
        if volume_val <= 0 or amount_val <= 0:
            continue

        date_str = t.created_at.strftime("%Y-%m-%d %I:%M %p") if t.created_at else "N/A"

        serialized.append({
            "id": t.source_pending_trx_id or f"TRX-{t.transaction_id}",
            "dateTime": date_str,
            "pumpId": t.pump_id,
            "pumpName": f"Cara {t.pump_id}",
            "volume": round(volume_val, 3),
            "amount": round(amount_val, 2),
            "unit_price": t.unit_price,
            "fuelType": fuel_type,
            "fuel_type": fuel_type,
            "paymentType": t.payment_type or "Cash",
        })

    return CommandResponse(data=serialized)
