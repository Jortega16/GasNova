"""Shift management router."""

from __future__ import annotations

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_pts2_client
from ..models import Shift, PumpTransaction, SystemSetting, PendingTransaction, ShiftClosure
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


@router.get("", response_model=CommandResponse, summary="Get shift logs")
def list_shifts(db: Session = Depends(get_db)) -> CommandResponse:
    """Get the history of closed and active station shifts."""
    shifts = db.query(Shift).order_by(Shift.created_at.desc()).all()
    serialized = [
        ShiftResponse(
            id=s.id,
            shift_id=s.shift_id,
            operator_name=s.operator_name,
            start_time=s.start_time,
            end_time=s.end_time,
            status=s.status
        ).model_dump()
        for s in shifts
    ]
    return CommandResponse(data=serialized)


@router.post("/close", response_model=CommandResponse, summary="Close active shift")
def close_shift(
    request: ShiftCreate,
    db: Session = Depends(get_db),
    client=Depends(get_pts2_client),
) -> CommandResponse:
    """Cierra el turno activo. Si set_closing=true envía ShiftClose con SetClosing al PTS-2 (cierre graceful)."""
    # Enviar ShiftClose al controlador PTS-2
    try:
        pts_payload: dict = {}
        if request.set_closing:
            pts_payload["SetClosing"] = True
        client.request_data("ShiftClose", pts_payload if pts_payload else None)
    except Exception:
        pass  # PTS-2 offline: continuar con cierre local
    finally:
        client.close()

    # Try to find the active shift by ID or get the latest active shift
    active_shift = db.query(Shift).filter(
        Shift.shift_id == request.shift_id,
        Shift.status == "Active"
    ).first()

    if not active_shift:
        # Fallback to the latest active shift in database
        active_shift = db.query(Shift).filter(Shift.status == "Active").order_by(Shift.created_at.desc()).first()

    if not active_shift:
        raise HTTPException(status_code=404, detail="No se encontró un turno activo para cerrar")

    pending_transactions = db.query(PendingTransaction).filter(
        or_(
            PendingTransaction.shift_id == active_shift.shift_id,
            PendingTransaction.shift_id.is_(None),
        )
    ).all()
    if pending_transactions:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "No se puede cerrar el turno con despachos pendientes por cobrar",
                "pending_transactions": [serialize_pending_transaction(p) for p in pending_transactions],
            },
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
        counter_breakdown=request.counter_breakdown or [],
    )
    db.add(shift_closure)

    # Update active shift details
    active_shift.status = "Closed"
    active_shift.end_time = request.end_time or "Now"
    db.commit()
    db.refresh(active_shift)
    db.refresh(shift_closure)

    # Automatically create a new active shift for the next operator / schedule.
    # Usa la fecha de HOY (no la del turno anterior) y reinicia el consecutivo
    # al cambiar de día; tolera shift_ids con formato inesperado.
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
    # Garantizar unicidad ante colisiones (constraint UNIQUE en shift_id)
    while db.query(Shift).filter(Shift.shift_id == next_id).first():
        next_num += 1
        next_id = f"SH-{today}-{str(next_num).zfill(2)}"

    next_shift = Shift(
        shift_id=next_id,
        operator_name=request.operator_name,
        start_time=request.end_time or "Now",
        end_time="",
        status="Active"
    )
    db.add(next_shift)
    db.commit()

    res = ShiftResponse(
        id=active_shift.id,
        shift_id=active_shift.shift_id,
        operator_name=active_shift.operator_name,
        start_time=active_shift.start_time,
        end_time=active_shift.end_time,
        status=active_shift.status
    )
    return CommandResponse(data={
        "closed_shift": res.model_dump(),
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
            "status": next_shift.status
        }
    })


@router.get("/{shift_id}/transactions", response_model=CommandResponse, summary="List transactions for a shift")
def list_shift_transactions(shift_id: str, db: Session = Depends(get_db)) -> CommandResponse:
    """Get the list of transactions associated with a specific shift, converting units conditionally."""
    transactions = db.query(PumpTransaction).filter(PumpTransaction.shift_id == shift_id).all()
    
    # Check unit_measure setting
    unit_setting = db.query(SystemSetting).filter(SystemSetting.key == "unit_measure").first()
    unit_measure = unit_setting.value if unit_setting else "Litros"
    
    fuel_grades = ['Regular Unleaded', 'Premium Unleaded', 'Diesel', 'Kerosene']
    
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
            fuel_type = fuel_grades[nozzle - 1] if 1 <= nozzle <= len(fuel_grades) else 'Regular Unleaded'
        
        # Convert volume from liters back to gallons only if unit_measure is set to Galones
        volume_val = t.volume or 0.0
        if unit_measure == "Galones":
            volume_val = volume_val / 3.78541
        
        # Format date time
        date_str = t.created_at.strftime("%Y-%m-%d %I:%M %p") if t.created_at else "N/A"
        
        serialized.append({
            "id": f"TRX-{t.transaction_id}",
            "dateTime": date_str,
            "pumpId": t.pump_id,
            "pumpName": f"Cara {t.pump_id}",
            "volume": round(volume_val, 2),
            "amount": round(t.amount or 0.0, 2),
            "fuelType": fuel_type,
            "fuel_type": fuel_type,
            "paymentType": t.payment_type or "Cash"
        })
        
    return CommandResponse(data=serialized)
