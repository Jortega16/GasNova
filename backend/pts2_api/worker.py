"""Background worker for applying scheduled price changes."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime

from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import DbScheduledPrice, SystemSetting
from .dependencies import build_pts2_client

logger = logging.getLogger("pts2_api.worker")

PRICE_SETTING_KEYS = {
    "regular unleaded": "price_regular_unleaded",
    "premium unleaded": "price_premium_unleaded",
    "diesel": "price_diesel",
    "kerosene": "price_kerosene",
    "lpg": "price_lpg",
    "glp": "price_lpg",
}


def get_pump_count(db: Session) -> int:
    """Return the number of pumps configured for this station."""
    try:
        setting = db.query(SystemSetting).filter(SystemSetting.key == "pump_count").first()
        if setting and setting.value:
            return max(1, int(setting.value))
    except Exception:
        pass
    return 4


def get_fuel_grades() -> list[str]:
    """Return the list of fuel grades configured for this station."""
    db = SessionLocal()
    try:
        setting = db.query(SystemSetting).filter(SystemSetting.key == "fuel_grades").first()
        if setting and setting.value:
            grades = [g.strip() for g in setting.value.split(",")]
            if grades:
                return grades
    except Exception:
        pass
    finally:
        db.close()
    return ["Regular Unleaded", "Premium Unleaded", "Diesel", "Kerosene", "LPG"]


def _match_fuel_grade_id(grades: list[dict], fuel_type: str) -> int | None:
    """Resolve FuelGradeId from PTS FuelGrades using Name / Id heuristics."""
    needle = (fuel_type or "").lower().strip()
    synonyms = {
        "regular unleaded": ("regular", "gasolina"),
        "premium unleaded": ("premium", "super"),
        "diesel": ("diesel",),
        "kerosene": ("kerosene", "queroseno"),
        "lpg": ("lpg", "glp"),
    }
    keys = synonyms.get(needle, (needle,))

    for g in grades:
        gid = int(g.get("Id") or g.get("id") or 0)
        name = str(g.get("Name") or g.get("name") or "").lower()
        if gid <= 0 or not name:
            continue
        if any(k in name for k in keys if k):
            return gid

    # Fallback: orden típico Id 1..N
    order = ["regular unleaded", "premium unleaded", "diesel", "kerosene", "lpg"]
    try:
        idx = order.index(needle)
        for g in grades:
            if int(g.get("Id") or g.get("id") or 0) == idx + 1:
                return idx + 1
    except ValueError:
        pass
    return None


def _upsert_setting(db: Session, key: str, value: str) -> None:
    row = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if row is None:
        db.add(SystemSetting(key=key, value=value))
    else:
        row.value = value


def apply_price_to_pts2(client, db: Session, fuel_type: str, new_price: float) -> None:
    """Push a fuel price to PTS-2 via SetFuelGradesPrices + PumpSetPrices."""
    cfg = client.request_data("GetFuelGradesConfiguration", None) or {}
    grades = cfg.get("FuelGrades") or cfg.get("fuel_grades") or []
    grade_id = _match_fuel_grade_id(grades, fuel_type)
    if grade_id is None:
        raise RuntimeError(f"No FuelGradeId en PTS-2 para '{fuel_type}'")

    # cmd #55 — precio global por grado
    client.request_data(
        "SetFuelGradesPrices",
        {"FuelGradesPrices": [{"FuelGradeId": grade_id, "Price": float(new_price)}]},
    )

    # También por bomba/manguera (PumpSetPrices) usando el mapeo de nozzles
    nozzles_cfg = client.request_data("GetPumpNozzlesConfiguration", None) or {}
    pump_nozzles = nozzles_cfg.get("PumpNozzles") or nozzles_cfg.get("pump_nozzles") or []
    if pump_nozzles:
        for pn in pump_nozzles:
            pump_id = int(pn.get("PumpId") or pn.get("pump_id") or 0)
            ids = pn.get("FuelGradeIds") or pn.get("fuel_grade_ids") or []
            if pump_id <= 0:
                continue
            for nozzle_idx, fg_id in enumerate(ids):
                if int(fg_id or 0) == grade_id:
                    client.pumps.set_prices(
                        pump_id,
                        [{"Nozzle": nozzle_idx + 1, "Price": float(new_price)}],
                    )
    else:
        # Fallback: nozzle = FuelGradeId en cada bomba
        for pump_id in range(1, get_pump_count(db) + 1):
            client.pumps.set_prices(
                pump_id,
                [{"Nozzle": grade_id, "Price": float(new_price)}],
            )

    setting_key = PRICE_SETTING_KEYS.get(fuel_type.lower().strip())
    if setting_key:
        _upsert_setting(db, setting_key, str(new_price))


def apply_scheduled_prices_cycle(db: Session | None = None) -> None:
    """Execute a single cycle of checking and applying scheduled price changes."""
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

            if sched_dt > now:
                continue

            try:
                client = build_pts2_client(db)
                try:
                    apply_price_to_pts2(client, db, schedule.fuel_type, float(schedule.new_price))
                finally:
                    client.close()
                logger.info(
                    "Applied scheduled price change %s: %s -> %s",
                    schedule.id, schedule.fuel_type, schedule.new_price
                )
            except Exception as client_err:
                # PTS-2 inalcanzable: dejar Pending para reintento.
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
    while True:
        try:
            apply_scheduled_prices_cycle()
        except Exception as exc:
            logger.exception("Error in scheduled price worker cycle: %s", exc)
        await asyncio.sleep(30)
