"""FastAPI integration layer for the PTS-2 SDK."""

import logging

from .main import app, create_app

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

__all__ = ["app", "create_app"]
