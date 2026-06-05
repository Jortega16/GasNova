"""Scheduled prices router."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import DbScheduledPrice
from ..schemas import CommandResponse, ScheduledPriceCreate, ScheduledPriceResponse

router = APIRouter(prefix="/scheduled-prices", tags=["scheduled-prices"])


def seed_initial_scheduled_prices_if_empty(db: Session) -> None:
    """Prepopulate database with default scheduled prices if empty."""
    if db.query(DbScheduledPrice).count() == 0:
        initial_schedules = [
            DbScheduledPrice(
                id="SP-001",
                date_time="2024-05-28 06:00 AM",
                fuel_type="Regular Unleaded",
                new_price=4.25,
                status="Pending",
            ),
            DbScheduledPrice(
                id="SP-002",
                date_time="2024-05-28 06:00 AM",
                fuel_type="Premium Unleaded",
                new_price=4.75,
                status="Pending",
            ),
            DbScheduledPrice(
                id="SP-003",
                date_time="2024-05-29 06:00 AM",
                fuel_type="Diesel",
                new_price=4.55,
                status="Pending",
            ),
        ]
        db.add_all(initial_schedules)
        db.commit()


@router.get("", response_model=CommandResponse, summary="List all scheduled prices")
def list_scheduled_prices(db: Session = Depends(get_db)) -> CommandResponse:
    """Get the list of all scheduled price changes."""
    seed_initial_scheduled_prices_if_empty(db)
    schedules = db.query(DbScheduledPrice).order_by(DbScheduledPrice.created_at.desc()).all()
    serialized = [
        ScheduledPriceResponse(
            id=s.id,
            date_time=s.date_time,
            fuel_type=s.fuel_type,
            new_price=s.new_price,
            status=s.status,
        ).model_dump()
        for s in schedules
    ]
    return CommandResponse(data=serialized)


@router.post("", response_model=CommandResponse, summary="Schedule a new price change")
def create_scheduled_price(
    request: ScheduledPriceCreate, db: Session = Depends(get_db)
) -> CommandResponse:
    """Schedule a new price update for a future date and time."""
    # Check if id already exists
    existing = db.query(DbScheduledPrice).filter(DbScheduledPrice.id == request.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El ID del precio programado ya existe",
        )

    schedule = DbScheduledPrice(
        id=request.id,
        date_time=request.date_time,
        fuel_type=request.fuel_type,
        new_price=request.new_price,
        status="Pending",
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    return CommandResponse(
        data=ScheduledPriceResponse(
            id=schedule.id,
            date_time=schedule.date_time,
            fuel_type=schedule.fuel_type,
            new_price=schedule.new_price,
            status=schedule.status,
        ).model_dump()
    )


@router.put("/{price_id}/cancel", response_model=CommandResponse, summary="Cancel a scheduled price change")
def cancel_scheduled_price(
    price_id: str, db: Session = Depends(get_db)
) -> CommandResponse:
    """Cancel a pending price schedule."""
    schedule = db.query(DbScheduledPrice).filter(DbScheduledPrice.id == price_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el cambio de precio programado",
        )

    if schedule.status != "Pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede cancelar un cambio de precio con estado: {schedule.status}",
        )

    schedule.status = "Cancelled"
    db.commit()
    db.refresh(schedule)

    return CommandResponse(
        data=ScheduledPriceResponse(
            id=schedule.id,
            date_time=schedule.date_time,
            fuel_type=schedule.fuel_type,
            new_price=schedule.new_price,
            status=schedule.status,
        ).model_dump()
    )
