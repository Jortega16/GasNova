"""Report endpoints."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query

from pts2_sdk import PTS2Client

from ..dependencies import get_pts2_client
from ..schemas import CommandResponse

router = APIRouter(prefix="/reports", tags=["reports"])

DATE_TIME_DESCRIPTION = (
    "Fecha y hora en formato ISO 8601 completo: YYYY-MM-DDTHH:MM:SS. "
    "Ejemplo: 2026-05-05T00:00:00"
)
DATE_TIME_EXAMPLES = {
    "format": {
        "value": "2026-05-05T00:00:00",
        "summary": "Ejemplo de formato de fecha y hora",
    }
}


@router.get(
    "/pump-transactions",
    response_model=CommandResponse,
    summary="Transacciones de bomba",
)
def pump_transactions(
    pump_id: int | None = Query(
        default=None,
        ge=1,
        description="ID del surtidor para filtrar las transacciones.",
    ),
    date_time_start: datetime | None = Query(
        default=None,
        description=DATE_TIME_DESCRIPTION,
        examples=DATE_TIME_EXAMPLES,
    ),
    date_time_end: datetime | None = Query(
        default=None,
        description=DATE_TIME_DESCRIPTION,
        examples=DATE_TIME_EXAMPLES,
    ),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Obtiene transacciones del surtidor dentro del intervalo de fechas indicado."""
    try:
        records = client.reports.get_pump_transactions(
            pump_id=pump_id,
            date_time_start=date_time_start,
            date_time_end=date_time_end,
        )
        return CommandResponse(data=[record.model_dump(by_alias=True, exclude_none=True) for record in records])
    finally:
        client.close()


@router.get(
    "/tank-measurements",
    response_model=CommandResponse,
    summary="Mediciones de tanque",
)
def tank_measurements(
    tank_id: int | None = Query(
        default=None,
        ge=1,
        description="ID del tanque para filtrar las mediciones.",
    ),
    date_time_start: datetime | None = Query(
        default=None,
        description=DATE_TIME_DESCRIPTION,
        examples=DATE_TIME_EXAMPLES,
    ),
    date_time_end: datetime | None = Query(
        default=None,
        description=DATE_TIME_DESCRIPTION,
        examples=DATE_TIME_EXAMPLES,
    ),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Recupera mediciones del tanque filtradas por tanque y rango de fechas."""
    try:
        records = client.reports.get_tank_measurements(
            tank_id=tank_id,
            date_time_start=date_time_start,
            date_time_end=date_time_end,
        )
        return CommandResponse(data=[record.model_dump(by_alias=True, exclude_none=True) for record in records])
    finally:
        client.close()


@router.get(
    "/in-tank-deliveries",
    response_model=CommandResponse,
    summary="Entregas internas",
)
def in_tank_deliveries(
    tank_id: int | None = Query(
        default=None,
        ge=1,
        description="ID del tanque para filtrar las entregas internas.",
    ),
    date_time_start: datetime | None = Query(
        default=None,
        description=DATE_TIME_DESCRIPTION,
        examples=DATE_TIME_EXAMPLES,
    ),
    date_time_end: datetime | None = Query(
        default=None,
        description=DATE_TIME_DESCRIPTION,
        examples=DATE_TIME_EXAMPLES,
    ),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Devuelve entregas internas en tanque dentro de un rango de fechas."""
    try:
        return CommandResponse(
            data=client.reports.get_in_tank_deliveries(
                tank_id=tank_id,
                date_time_start=date_time_start,
                date_time_end=date_time_end,
            )
        )
    finally:
        client.close()


@router.get(
    "/alerts",
    response_model=CommandResponse,
    summary="Registros de alertas",
)
def alerts(
    date_time_start: datetime | None = Query(
        default=None,
        description=DATE_TIME_DESCRIPTION,
        examples=DATE_TIME_EXAMPLES,
    ),
    date_time_end: datetime | None = Query(
        default=None,
        description=DATE_TIME_DESCRIPTION,
        examples=DATE_TIME_EXAMPLES,
    ),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Obtiene registros de alertas del controlador en el rango de fechas dado."""
    try:
        records = client.reports.get_alert_records(
            date_time_start=date_time_start,
            date_time_end=date_time_end,
        )
        return CommandResponse(data=[record.model_dump(by_alias=True, exclude_none=True) for record in records])
    finally:
        client.close()


@router.get(
    "/gps",
    response_model=CommandResponse,
    summary="Registros GPS",
)
def gps(
    date_time_start: datetime | None = Query(
        default=None,
        description=DATE_TIME_DESCRIPTION,
        examples=DATE_TIME_EXAMPLES,
    ),
    date_time_end: datetime | None = Query(
        default=None,
        description=DATE_TIME_DESCRIPTION,
        examples=DATE_TIME_EXAMPLES,
    ),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Recupera registros GPS del PTS-2 en el intervalo especificado."""
    try:
        records = client.reports.get_gps_records(
            date_time_start=date_time_start,
            date_time_end=date_time_end,
        )
        return CommandResponse(data=[record.model_dump(by_alias=True, exclude_none=True) for record in records])
    finally:
        client.close()
