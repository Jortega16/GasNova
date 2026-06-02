"""FastAPI dependencies for PTS-2 clients."""

from __future__ import annotations

from functools import lru_cache

from pts2_sdk import PTS2Client
from pts2_sdk.settings import Settings, configure_logging


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    configure_logging(settings)
    return settings


def get_pts2_client() -> PTS2Client:
    return PTS2Client.from_settings(get_settings())
