"""Snapshot unificado del estado en vivo (bombas + tanques) para el dashboard.

Un solo endpoint que colapsa lo que hoy el frontend pide por separado
(`/pumps/status-all` y `/probes/measurements`) en una única llamada. Devuelve
exactamente la misma forma de datos que esos dos endpoints — el frontend
puede apuntar aquí sin tener que reescribir su lógica de mapeo — y de paso
deja actualizada la caché de `live_state` que usan endpoints puntuales como
`/pumps/{id}/prices`.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from pts2_sdk import PTS2Client

from ..dependencies import get_pts2_client
from ..schemas import CommandResponse
from .pumps import _DEFAULT_PUMP_COUNT, get_all_pumps_status
from .tanks import all_probe_measurements

router = APIRouter(prefix="/live", tags=["live"])


@router.get(
    "/state",
    response_model=CommandResponse,
    summary="Estado en vivo de bombas y tanques",
    description=(
        "Reúne en una sola llamada el sondeo de estado de todas las bombas "
        "(misma forma que /pumps/status-all) y las mediciones de tanques "
        "(misma forma que /probes/measurements). Pensado para reemplazar los "
        "múltiples ciclos de polling independientes del frontend por uno solo."
    ),
)
def live_state_snapshot(
    pump_count: int = _DEFAULT_PUMP_COUNT,
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Sondea bombas y tanques, y devuelve ambos snapshots en una sola respuesta."""
    status = get_all_pumps_status(pump_count=pump_count, client=client)

    try:
        tanks_response = all_probe_measurements(client=client)
        tanks_data = tanks_response.data
    except Exception:
        # Sin sondas configuradas o el PTS-2 no respondió a las sondas: no
        # debe tumbar el snapshot de bombas, que sí pudo haberse obtenido.
        tanks_data = []

    return CommandResponse(data={
        "pumps": [p.model_dump() for p in status.pumps],
        "tanks": tanks_data,
    })
