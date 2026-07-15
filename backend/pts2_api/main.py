"""FastAPI application exposing the PTS-2 SDK through REST and WebSocket."""

from __future__ import annotations

import asyncio
import logging
import os
import secrets as _secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_redoc_html
from fastapi.middleware.cors import CORSMiddleware

from pts2_sdk.exceptions import PTS2Error

from .routers import (
    health, pumps, reports, tanks, websocket, live,
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


def _load_or_create_token_secret() -> str:
    """Secreto HMAC para firmar tokens de sesión, persistido en system_settings.

    Se genera una sola vez por instalación y sobrevive reinicios del
    contenedor, así los tokens emitidos siguen siendo válidos tras un
    redeploy. Si la BD no está disponible se usa un secreto efímero
    (los tokens se invalidan al reiniciar, pero la API sigue operativa).
    """
    from .models import SystemSetting
    db = SessionLocal()
    try:
        row = db.query(SystemSetting).filter(SystemSetting.key == "api_token_secret").first()
        if row and row.value:
            return row.value
        secret = _secrets.token_hex(32)
        db.add(SystemSetting(key="api_token_secret", value=secret))
        db.commit()
        return secret
    except Exception as exc:
        logger.warning("No se pudo persistir el secreto de tokens (se usa efímero): %s", exc)
        return _secrets.token_hex(32)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    testing = os.getenv("GASNOVA_TESTING") == "1"

    if not testing:
        try:
            init_db()
        except Exception as exc:
            logger.warning("Could not initialize database tables: %s", exc)

        _seed_database()
        app.state.api_token_secret = _load_or_create_token_secret()
    else:
        # En tests la BD real no se toca: cada suite inyecta su propio engine.
        app.state.api_token_secret = _secrets.token_hex(32)

    # Shared PTS-2 client singleton — stored on app.state so all requests
    # share the same connection instead of creating one per request.
    from .dependencies import build_pts2_client
    app.state.pts2_client = build_pts2_client()
    # Mapa pump_id → shift_id capturado en authorize; consumido al crear pending.
    app.state.pump_auth_shifts: dict[int, str] = {}

    worker_task = asyncio.create_task(scheduled_price_worker()) if not testing else None

    yield

    if worker_task is not None:
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
            {"name": "live", "description": "Unified live-state snapshot (pumps + tanks) for dashboard polling."},
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

    app.state.auth_enabled = os.getenv("GASNOVA_DISABLE_AUTH", "0") != "1"

    # ── Autenticación por token de sesión ────────────────────────────────────
    # Todos los endpoints requieren `Authorization: Bearer <token>` salvo la
    # lista mínima necesaria para llegar a la pantalla de login y monitoreo
    # básico. El WebSocket del PTS-2 (/ptsWebSocket) no pasa por este
    # middleware (solo intercepta scope HTTP), así el controlador físico
    # sigue conectándose sin cambios.
    #
    # ORDEN: este middleware se registra ANTES de agregar CORSMiddleware para
    # que CORS quede por FUERA y agregue sus headers también a las respuestas
    # 401 — de lo contrario el navegador las bloquea como error de red y el
    # frontend nunca ve el 401 (no puede redirigir al login).
    _PUBLIC_EXACT = {
        ("GET", "/"),
        ("GET", "/health"),
        ("GET", "/docs"),
        ("GET", "/openapi.json"),
        ("GET", "/redoc"),
        ("GET", "/redocs"),
        ("GET", "/users"),          # perfiles para la pantalla de login (sin PINs)
        ("POST", "/users/login"),   # emite el token
        ("GET", "/print/download-bat"),  # descarga por <a href>, no lleva headers
    }

    @app.middleware("http")
    async def require_session_token(request: Request, call_next):
        if not getattr(request.app.state, "auth_enabled", False):
            return await call_next(request)
        if request.method == "OPTIONS":
            return await call_next(request)
        if (request.method, request.url.path) in _PUBLIC_EXACT:
            return await call_next(request)

        from .security import verify_session_token
        secret = getattr(request.app.state, "api_token_secret", None)
        auth_header = request.headers.get("authorization", "")
        token = auth_header[7:] if auth_header.lower().startswith("bearer ") else ""
        claims = verify_session_token(token, secret) if (secret and token) else None
        if claims is None:
            return JSONResponse(
                status_code=401,
                content={"ok": False, "error": "No autorizado: inicia sesión con tu PIN."},
            )
        request.state.user = claims
        return await call_next(request)

    # CORS al final = capa más externa (ver nota de orden arriba)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(pumps.router)
    app.include_router(tanks.router)
    app.include_router(live.router)
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
