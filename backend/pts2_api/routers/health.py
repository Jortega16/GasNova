"""Health endpoints."""

from __future__ import annotations

import os

from fastapi import APIRouter, Depends

from pts2_sdk import PTS2Client

from ..dependencies import get_pts2_client
from ..schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Estado del servicio",
    description="Verifica la conectividad con el servicio y con el controlador PTS-2.",
)
def healthcheck(client: PTS2Client = Depends(get_pts2_client)) -> HealthResponse:
    """Comprueba que la API y el PTS-2 estén disponibles."""
    try:
        return HealthResponse(ok=True, pts2=client.healthcheck())
    finally:
        client.close()


@router.get(
    "/version",
    summary="Versión desplegada del backend",
    description=(
        "Commit de git y fecha de build de la imagen que está corriendo ahora "
        "mismo — para confirmar qué versión quedó desplegada, sin depender de "
        "recordarlo a mano. Se inyectan en build time (ver Dockerfile); sin "
        "'unknown' significa que se construyó sin pasar --build-arg."
    ),
)
def version() -> dict:
    return {
        "version": os.environ.get("APP_VERSION", "unknown"),
        "commit": os.environ.get("GIT_COMMIT", "unknown"),
        "built_at": os.environ.get("BUILD_TIME", "unknown"),
    }
