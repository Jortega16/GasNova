"""FastAPI application exposing the PTS-2 SDK through REST and WebSocket."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_redoc_html

from pts2_sdk.exceptions import PTS2Error

from .routers import health, pumps, reports, tanks, websocket


def create_app() -> FastAPI:
    app = FastAPI(
        title="GasNova PTS-2 API",
        description="REST API and optional WebSocket gateway for Technotrade PTS-2 jsonPTS.",
        version="0.1.0",
        contact={"name": "GasNova"},
        openapi_tags=[
            {"name": "health", "description": "Connectivity and controller health checks."},
            {"name": "pumps", "description": "Pump status, authorization and POS workflow commands."},
            {"name": "tanks", "description": "ATG probe and tank data."},
            {"name": "reports", "description": "Report queries and exports."},
            {"name": "websocket", "description": "Real-time event stream for POS dashboards."},
        ],
    )

    app.include_router(health.router)
    app.include_router(pumps.router)
    app.include_router(tanks.router)
    app.include_router(reports.router)
    app.include_router(websocket.router)

    @app.exception_handler(PTS2Error)
    async def pts2_exception_handler(_request: Request, exc: PTS2Error) -> JSONResponse:
        return JSONResponse(
            status_code=502,
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

    @app.get("/redocs", include_in_schema=False)
    def redocs_alias() -> object:
        return get_redoc_html(openapi_url=app.openapi_url or "/openapi.json", title=f"{app.title} - ReDoc")

    return app


app = create_app()
