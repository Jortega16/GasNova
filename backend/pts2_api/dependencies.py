import logging
from functools import lru_cache

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from pts2_sdk import PTS2Client
from pts2_sdk.settings import Settings, configure_logging

from .database import get_db, SessionLocal
from .models import SystemSetting

logger = logging.getLogger("pts2_api.dependencies")


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    configure_logging(settings)
    return settings


def build_pts2_client(db: Session | None = None) -> PTS2Client:
    """Build a PTS2Client reading host override from DB if available."""
    settings = get_settings()

    from pts2_sdk.settings import Settings as SDKSettings
    client_settings = SDKSettings()
    for k, v in settings.model_dump().items():
        setattr(client_settings, k, v)

    own_db = db is None
    local_db: Session = db or SessionLocal()

    try:
        overrides = local_db.query(SystemSetting).filter(
            SystemSetting.key.in_(["pts2_host", "pts2_auth_type", "pts2_username", "pts2_password"])
        ).all()
        values = {s.key: s.value for s in overrides if s.value}
        if "pts2_host" in values:
            client_settings.pts2_host = values["pts2_host"]
        if "pts2_auth_type" in values:
            client_settings.pts2_auth_type = values["pts2_auth_type"]
        if "pts2_username" in values:
            client_settings.pts2_username = values["pts2_username"]
        if "pts2_password" in values:
            client_settings.pts2_password = values["pts2_password"]
    except Exception as exc:
        logger.error("Error loading pts2_* settings from database: %s", exc)
    finally:
        if own_db:
            local_db.close()

    return PTS2Client.from_settings(client_settings)


def get_pts2_client(request: Request) -> PTS2Client:
    """FastAPI dependency — returns the shared singleton from app.state.

    If app.state has no client yet (e.g. tests that skip lifespan), a new
    client is created on the fly.
    """
    client: PTS2Client | None = getattr(request.app.state, "pts2_client", None)
    if client is None:
        client = build_pts2_client()
        request.app.state.pts2_client = client
    return client


def refresh_pts2_client(request: Request) -> PTS2Client:
    """Re-create the singleton after a settings change (e.g. new pts2_host)."""
    try:
        old = getattr(request.app.state, "pts2_client", None)
        if old is not None:
            old.close()
    except Exception:
        pass

    client = build_pts2_client()
    request.app.state.pts2_client = client
    return client
