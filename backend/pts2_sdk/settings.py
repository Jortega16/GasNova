"""Runtime settings loaded from environment variables or .env."""

from __future__ import annotations

import logging
import os
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    pts2_host: str = "192.168.50.117"
    pts2_port: int = 80
    pts2_use_https: bool = False
    pts2_username: str = "admin"
    pts2_password: str = "admin"
    pts2_auth_type: str = "basic"
    pts2_verify_ssl: bool = False
    pts2_timeout: int = 10
    pts2_retries: int = 3

    pts2_log_level: str = "INFO"
    pts2_log_file: str = "logs/pts2_sdk.log"

    pts2_ws_enabled: bool = False
    pts2_ws_reconnect_seconds: int = 5

    pts2_reports_path: str = "reports/"
    pts2_export_format: str = "json"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    @field_validator("pts2_auth_type")
    @classmethod
    def validate_auth_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"basic", "digest", "none"}:
            raise ValueError("PTS2_AUTH_TYPE must be basic, digest, or none")
        return normalized

    @property
    def scheme(self) -> str:
        return "https" if self.pts2_use_https else "http"

    @property
    def base_url(self) -> str:
        return f"{self.scheme}://{self.pts2_host}:{self.pts2_port}"


def configure_logging(settings: Settings | None = None) -> logging.Logger:
    """Configure package logging from settings without taking over root logging."""

    settings = settings or Settings()
    logger = logging.getLogger("pts2_sdk")
    level = getattr(logging, settings.pts2_log_level.upper(), logging.INFO)
    logger.setLevel(level)
    logger.propagate = False

    for handler in list(logger.handlers):
        logger.removeHandler(handler)

    formatter = logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s")

    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(level)
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)

    log_file = settings.pts2_log_file.strip()
    if log_file:
        log_path = Path(os.path.expanduser(log_file))
        log_path.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_path)
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger
