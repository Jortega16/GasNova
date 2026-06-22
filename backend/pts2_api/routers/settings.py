"""System settings router."""

from __future__ import annotations

from typing import Dict
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
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
    "remote_api_url": "https://api.gasnova.site/v1"
}


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
def update_setting(key: str, update: SettingUpdate, db: Session = Depends(get_db)) -> CommandResponse:
    """Create or update a specific configuration parameter by key."""
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        # Create it if it doesn't exist
        setting = SystemSetting(key=key, value=update.value)
        db.add(setting)
    else:
        setting.value = update.value
    db.commit()
    db.refresh(setting)
    return CommandResponse(data={setting.key: setting.value})
