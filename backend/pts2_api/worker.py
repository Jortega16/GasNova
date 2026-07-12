"""Background worker for applying scheduled price changes."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime

from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import DbScheduledPrice
from .dependencies import build_pts2_client

logger = logging.getLogger("pts2_api.worker")


def get_pump_count() -> int:
    """Return the number of pumps configured for this station."""
    from .database import SessionLocal as _SessionLocal
    from .models import SystemSetting
    db = _SessionLocal()
    try:
        setting = db.query(SystemSetting).filter(
            SystemSetting.key == "pump_count"
        ).first()
        if setting and setting.value:
            return max(1, int(setting.value))
    except Exception:
        pass
    finally:
        db.close()
    return 4


def get_fuel_grades() -> list[str]:
    """Return the list of fuel grades configured for this station."""
    from .database import SessionLocal as _SessionLocal
    from .models import SystemSetting
    db = _SessionLocal()
    try:
        setting = db.query(SystemSetting).filter(
            SystemSetting.key == "fuel_grades"
        ).first()
        if setting and setting.value:
            grades = [g.strip() for g in setting.value.split(",")]
            if grades:
                return grades
    except Exception:
        pass
    finally:
        db.close()
    return ["Regular Unleaded", "Premium Unleaded", "Diesel", "Kerosene"]


def apply_scheduled_prices_cycle(db: Session | None = None) -> None:
    """Execute a single cycle of checking and applying scheduled price changes."""
    fuel_grades = get_fuel_grades()
    own_db = False
    if db is None:
        db = SessionLocal()
        own_db = True

    try:
        now = datetime.now()
        pending_schedules = db.query(DbScheduledPrice).filter(
            DbScheduledPrice.status == "Pending"
        ).all()

        for schedule in pending_schedules:
            sched_dt: datetime | None = None
            for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d %I:%M %p", "%Y-%m-%d %H:%M:%S"):
                try:
                    sched_dt = datetime.strptime(schedule.date_time, fmt)
                    break
                except ValueError:
                    continue

            if sched_dt is None:
                logger.warning("Could not parse date_time string: %s", schedule.date_time)
                continue

            if sched_dt <= now:
                nozzle_index = -1
                for idx, grade in enumerate(fuel_grades):
                    if grade.lower() == schedule.fuel_type.lower():
                        nozzle_index = idx
                        break

                nozzle_number = nozzle_index + 1 if nozzle_index >= 0 else 1
                pump_count = get_pump_count()

                try:
                    client = build_pts2_client(db)
                    try:
                        for pump_id in range(1, pump_count + 1):
                            client.pumps.set_prices(
                                pump_id,
                                [{"Nozzle": nozzle_number, "Price": schedule.new_price}]
                            )
                    finally:
                        client.close()
                    logger.info(
                        "Applied scheduled price change %s: %s -> %s",
                        schedule.id, schedule.fuel_type, schedule.new_price
                    )
                except Exception as client_err:
                    # PTS-2 inalcanzable: dejar el programa en Pending para
                    # reintentarlo en el próximo ciclo, en vez de marcarlo
                    # aplicado sin haber cambiado ningún precio.
                    logger.warning(
                        "Could not apply price %s to PTS-2 (se reintentará): %s",
                        schedule.id, client_err
                    )
                    continue

                schedule.status = "Applied"
                db.commit()
    finally:
        if own_db:
            db.close()


async def scheduled_price_worker() -> None:
    """Background worker that periodically checks for pending price changes."""
    await asyncio.sleep(5)
    while True:
        try:
            apply_scheduled_prices_cycle()
        except Exception as exc:
            logger.exception("Error in scheduled price worker cycle: %s", exc)
        await asyncio.sleep(10)
