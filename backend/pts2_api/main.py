"""FastAPI application exposing the PTS-2 SDK through REST and WebSocket."""

from __future__ import annotations

from contextlib import asynccontextmanager
import asyncio
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_redoc_html

from fastapi.middleware.cors import CORSMiddleware
from pts2_sdk.exceptions import PTS2Error

from .routers import health, pumps, reports, tanks, websocket, users, shifts, scheduled_prices, print_receipt, settings
from .database import init_db, SessionLocal
from .models import DbScheduledPrice
from .dependencies import get_pts2_client, get_settings
from . import models  # noqa: F401 - Import models to register them with Base


async def apply_scheduled_prices_cycle(db: SessionLocal = None) -> None:
    """Ejecuta un único ciclo de verificación y aplicación de precios programados."""
    fuel_grades = ['Regular Unleaded', 'Premium Unleaded', 'Diesel', 'Kerosene']
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
            sched_dt = None
            for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d %I:%M %p", "%Y-%m-%d %H:%M:%S"):
                try:
                    sched_dt = datetime.strptime(schedule.date_time, fmt)
                    break
                except ValueError:
                    continue
            
            if sched_dt is None:
                print(f"Warning: Could not parse date_time string: {schedule.date_time}")
                continue
            
            if sched_dt <= now:
                nozzle_index = -1
                for idx, grade in enumerate(fuel_grades):
                    if grade.lower() == schedule.fuel_type.lower():
                        nozzle_index = idx
                        break
                
                nozzle_number = nozzle_index + 1 if nozzle_index >= 0 else 1
                
                # Actualizar en el PTS-2 para los surtidores 1 a 4
                try:
                    client = get_pts2_client()
                    for pump_id in range(1, 5):
                        client.pumps.set_prices(pump_id, [{"Nozzle": nozzle_number, "Price": schedule.new_price}])
                    client.close()
                    print(f"Applied scheduled price change {schedule.id}: {schedule.fuel_type} -> {schedule.new_price}")
                except PTS2Error as pts_err:
                    print(f"PTS-2 offline. Simulating price update for {schedule.fuel_type} (Nozzle {nozzle_number}): {pts_err}")
                except Exception as client_err:
                    print(f"Error communicating with PTS-2: {client_err}")
                
                # Cambiar estado a Applied
                schedule.status = "Applied"
                db.commit()
    finally:
        if own_db:
            db.close()


async def scheduled_price_worker():
    """Worker asíncrono que verifica periódicamente cambios de precios programados."""
    # Esperar unos segundos iniciales
    await asyncio.sleep(5)
    
    while True:
        try:
            await apply_scheduled_prices_cycle()
        except Exception as exc:
            print(f"Error in scheduled price worker cycle: {exc}")
        
        await asyncio.sleep(10)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup
    try:
        init_db()
    except Exception as exc:
        print(f"Warning: Could not initialize database tables: {exc}")
    
    # Iniciar la tarea en segundo plano
    worker_task = asyncio.create_task(scheduled_price_worker())
    
    yield
    
    # Shutdown
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass



def create_app() -> FastAPI:
    app = FastAPI(
        title="GasNova PTS-2 API",
        description="REST API and optional WebSocket gateway for Technotrade PTS-2 jsonPTS.",
        version="0.1.0",
        contact={"name": "GasNova"},
        lifespan=lifespan,
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
        ],
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
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
