"""Shift management router."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Shift, PumpTransaction, SystemSetting
from ..schemas import CommandResponse, ShiftCreate, ShiftResponse

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
    seed_initial_shift_if_empty(db)
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
def close_shift(request: ShiftCreate, db: Session = Depends(get_db)) -> CommandResponse:
    """Close the currently active shift and record its final metrics."""
    seed_initial_shift_if_empty(db)
    
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

    # Update active shift details
    active_shift.status = "Closed"
    active_shift.end_time = request.end_time or "Now"
    db.commit()
    db.refresh(active_shift)

    # Automatically create a new active shift for the next operator / schedule
    next_num = int(active_shift.shift_id.split("-")[-1]) + 1
    date_part = active_shift.shift_id.split("-")[1]
    next_id = f"SH-{date_part}-{String(next_num).zfill(2) if 'String' in globals() else str(next_num).zfill(2)}"
    # Wait, python's zfill is on strings: str(next_num).zfill(2)
    next_id = f"SH-{date_part}-{str(next_num).zfill(2)}"

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
            "paymentType": t.payment_type or "Cash"
        })
        
    return CommandResponse(data=serialized)
