"""Tank and probe endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Path, Query

from pts2_sdk import PTS2Client

from ..dependencies import get_pts2_client
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import InTankDelivery
from ..schemas import CommandResponse, DeliveryCreate

router = APIRouter(tags=["tanks"])


@router.get(
    "/probes/{probe_id}/measurements",
    response_model=CommandResponse,
    summary="Mediciones de sonda",
    description="Recupera las mediciones actuales de la sonda indicada por probe_id.",
)
def probe_measurements(
    probe_id: int = Path(ge=1, description="ID de la sonda para la que se solicitan mediciones."),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Retorna las lecturas de la sonda especificada."""
    try:
        data = client.probes.get_measurements(probe_id)
        return CommandResponse(data=data.model_dump(by_alias=True, exclude_none=True))
    finally:
        client.close()


@router.get(
    "/probes/measurements",
    response_model=CommandResponse,
    summary="Todas las mediciones de sondas",
    description="Devuelve las mediciones de todas las sondas disponibles en el controlador.",
)
def all_probe_measurements(client: PTS2Client = Depends(get_pts2_client)) -> CommandResponse:
    """Obtiene todas las mediciones de las sondas conectadas."""
    try:
        data = [item.model_dump(by_alias=True, exclude_none=True) for item in client.probes.get_all_measurements()]
        return CommandResponse(data=data)
    finally:
        client.close()


@router.get(
    "/tanks/configuration",
    response_model=CommandResponse,
    summary="Configuración de tanques",
    description="Devuelve la configuración de todos los tanques registrados en el PTS-2.",
)
def tanks_configuration(client: PTS2Client = Depends(get_pts2_client)) -> CommandResponse:
    """Recupera la configuración de los tanques del controlador."""
    try:
        data = [item.model_dump(by_alias=True, exclude_none=True) for item in client.tanks.get_tanks_configuration()]
        return CommandResponse(data=data)
    finally:
        client.close()


@router.get(
    "/tanks/{tank_id}/volume-for-height",
    response_model=CommandResponse,
    summary="Volumen para altura",
    description="Calcula el volumen del tanque a partir de la altura proporcionada.",
)
def tank_volume_for_height(
    tank_id: int = Path(ge=1, description="ID del tanque para el cual se calcula el volumen."),
    height: float = Query(gt=0, description="Altura en milímetros utilizada para calcular el volumen."),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Retorna el volumen estimado del tanque para la altura solicitada."""
    try:
        return CommandResponse(data=client.tanks.get_tank_volume_for_height(tank_id, height))
    finally:
        client.close()


@router.post(
    "/tanks/{tank_id}/deliveries",
    response_model=CommandResponse,
    summary="Registrar recepción de combustible",
    description="Registra la descarga de cisterna para un tanque en la base de datos PostgreSQL.",
)
def create_delivery(
    request: DeliveryCreate,
    tank_id: int = Path(ge=1, description="ID del tanque receptor."),
    db: Session = Depends(get_db),
) -> CommandResponse:
    """Registra y almacena el ingreso de combustible en la base de datos local."""
    import datetime
    delivery = InTankDelivery(
        tank_id=tank_id,
        delivery_date=datetime.datetime.now(),
        volume=request.volume,
        product_code=request.product_code,
        driver_name=request.driver_name,
        truck_number=request.truck_number,
        notes=request.notes,
    )
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    return CommandResponse(data={
        "id": delivery.id,
        "tank_id": delivery.tank_id,
        "volume": delivery.volume,
        "delivery_date": delivery.delivery_date.isoformat(),
    })
