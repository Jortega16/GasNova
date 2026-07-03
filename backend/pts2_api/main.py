"""FastAPI application exposing the PTS-2 SDK through REST and WebSocket."""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_redoc_html
from fastapi.middleware.cors import CORSMiddleware

from pts2_sdk.exceptions import PTS2Error

from .routers import (
    health, pumps, reports, tanks, websocket,
    users, shifts, scheduled_prices, print_receipt, settings, configuration, sync,
)
from .database import init_db, SessionLocal
from .worker import scheduled_price_worker

logger = logging.getLogger("pts2_api")


def _seed_database() -> None:
    """Run all data seeds that should execute once at startup."""
    db = SessionLocal()
    try:
        from .routers.users import seed_initial_users_if_empty
        from .routers.shifts import seed_initial_shift_if_empty
        seed_initial_users_if_empty(db)
        seed_initial_shift_if_empty(db)
    except Exception as exc:
        logger.warning("Seed error during startup: %s", exc)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    try:
        init_db()
    except Exception as exc:
        logger.warning("Could not initialize database tables: %s", exc)

    _seed_database()

    # Shared PTS-2 client singleton — stored on app.state so all requests
    # share the same connection instead of creating one per request.
    from .dependencies import build_pts2_client
    app.state.pts2_client = build_pts2_client()
    # Mapa pump_id → shift_id capturado en authorize; consumido al crear pending.
    app.state.pump_auth_shifts: dict[int, str] = {}

    worker_task = asyncio.create_task(scheduled_price_worker())

    yield

    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass

    try:
        app.state.pts2_client.close()
    except Exception:
        pass


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="GasNova PTS-2 API",
        description="REST API and optional WebSocket gateway for Technotrade PTS-2 jsonPTS.",
        version="0.1.0",
        contact={"name": "GasNova"},
        lifespan=lifespan,
        redoc_url=None,
        openapi_tags=[
            {"name": "health", "description": "Connectivity and controller health checks."},
            {"name": "pumps", "description": "Pump status, authorization and POS workflow commands."},
            {"name": "tanks", "description": "ATG probe and tank data."},
            {"name": "reports", "description": "Report queries and exports."},
            {"name": "websocket", "description": "Real-time event stream for POS dashboards."},
            {"name": "users", "description": "User profiles and quick switch authentication."},
            {"name": "shifts", "description": "Shift control and closures."},
            {"name": "scheduled-prices", "description": "Fuel price change schedules."},
            {"name": "print", "description": "Thermal receipt printing via ESC/POS (AON PR-255 / POS-80)."},
            {"name": "configuration", "description": "Mapeo de caras, mangueras y combustibles en el PTS-2 (3 pasos)."},
            {"name": "sync", "description": "Recuperación de transacciones faltantes desde la SD del PTS-2."},
        ],
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(pumps.router)
    app.include_router(tanks.router)
    app.include_router(reports.router)
    app.include_router(websocket.router)
    app.include_router(users.router)
    app.include_router(shifts.router)
    app.include_router(scheduled_prices.router)
    app.include_router(print_receipt.router)
    app.include_router(settings.router)
    app.include_router(configuration.router)
    app.include_router(sync.router)

    @app.exception_handler(PTS2Error)
    async def pts2_exception_handler(
        _request: Request, exc: PTS2Error
    ) -> JSONResponse:
        return JSONResponse(
            status_code=400,
            content={"ok": False, "type": exc.__class__.__name__, "error": str(exc)},
        )

    @app.get("/", include_in_schema=False)
    def root() -> dict[str, str]:
        return {
            "name": "GasNova PTS-2 API",
            "docs": "/docs",
            "redoc": "/redoc",
            "redocs": "/redocs",
            "openapi": "/openapi.json",
            "health": "/health",
        }

    @app.get("/redoc", include_in_schema=False)
    @app.get("/redocs", include_in_schema=False)
    def redoc() -> object:
        return get_redoc_html(
            openapi_url=app.openapi_url or "/openapi.json",
            title=f"{app.title} - ReDoc",
            redoc_favicon_url="https://fastapi.tiangolo.com/img/favicon.png",
        )

    return app


app = create_app()
