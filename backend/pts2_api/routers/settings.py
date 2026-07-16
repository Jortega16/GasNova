"""System settings router."""

from __future__ import annotations

from typing import Dict
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import refresh_pts2_client
from ..models import SystemSetting
from ..schemas import CommandResponse

router = APIRouter(prefix="/settings", tags=["settings"])


class SettingUpdate(BaseModel):
    value: str


DEFAULT_SETTINGS = {
    "unit_measure": "Litros",
    "currency_symbol": "$",
    "station_country": "Guatemala",
    "station_city": "Ciudad de Guatemala",
    "station_canton": "",
    "station_department": "Guatemala",
    "pts2_host": "192.168.50.117",
    "pts2_auth_type": "basic",
    "pts2_username": "admin",
    "pts2_password": "admin",
    "remote_api_url": "https://api.gasnova.site/v1",
    "auto_authorize_on_nozzle_up": "false",
    "auto_consolidate_enabled": "true",
    "auto_consolidate_minutes": "5",
}

# Cambiar cualquiera de estas claves reconecta el cliente PTS-2 de inmediato,
# sin necesidad de reiniciar el contenedor.
PTS2_CONNECTION_KEYS = {"pts2_host", "pts2_auth_type", "pts2_username", "pts2_password"}


def seed_settings_if_empty(db: Session) -> None:
    """Ensure basic system settings are seeded in PostgreSQL."""
    for key, val in DEFAULT_SETTINGS.items():
        exists = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if not exists:
            setting = SystemSetting(key=key, value=val)
            db.add(setting)
    db.commit()


@router.get("", response_model=CommandResponse, summary="Get all system settings")
def get_settings(db: Session = Depends(get_db)) -> CommandResponse:
    """Retrieve all configuration settings from the database."""
    seed_settings_if_empty(db)
    settings = db.query(SystemSetting).all()
    data = {s.key: s.value for s in settings}
    return CommandResponse(data=data)


@router.put("/{key}", response_model=CommandResponse, summary="Update system setting")
def update_setting(key: str, update: SettingUpdate, request: Request, db: Session = Depends(get_db)) -> CommandResponse:
    """Create or update a specific configuration parameter by key."""
    if key == "pts2_auth_type" and update.value.strip().lower() not in {"basic", "digest", "none"}:
        raise HTTPException(status_code=400, detail="pts2_auth_type debe ser 'basic', 'digest' o 'none'.")

    if key == "auto_consolidate_minutes":
        try:
            minutes = float(update.value)
        except ValueError:
            raise HTTPException(status_code=400, detail="auto_consolidate_minutes debe ser un número.")
        if minutes <= 0:
            raise HTTPException(status_code=400, detail="auto_consolidate_minutes debe ser mayor que 0.")

    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        setting = SystemSetting(key=key, value=update.value)
        db.add(setting)
    else:
        setting.value = update.value
    db.commit()
    db.refresh(setting)

    # Reconnect PTS-2 client immediately when connection settings change
    if key in PTS2_CONNECTION_KEYS:
        refresh_pts2_client(request)

    return CommandResponse(data={setting.key: setting.value})
