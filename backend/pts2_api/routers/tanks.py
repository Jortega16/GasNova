"""Tank and probe endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Path, Query

from pts2_sdk import PTS2Client

from ..dependencies import get_pts2_client
from sqlalchemy.orm import Session
from ..database import get_db
from ..live_state import live_state
from ..models import InTankDelivery, TankConfiguration
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
        for item in data:
            tank_id = item.get("Probe") or item.get("Tank")
            if tank_id is not None:
                live_state.update_tank(tank_id, item)
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


def seed_tanks_if_empty(db: Session) -> None:
    """Prepopulate database with default tank configuration if empty."""
    if db.query(TankConfiguration).count() == 0:
        initial_tanks = [
            TankConfiguration(tank_id=1, tank_name="Tanque 1", product_code="Regular Unleaded", capacity=100000.0, status="active"),
            TankConfiguration(tank_id=2, tank_name="Tanque 2", product_code="Diesel", capacity=100000.0, status="active"),
            TankConfiguration(tank_id=3, tank_name="Tanque 3", product_code="LPG", capacity=100000.0, status="active"),
        ]
        db.add_all(initial_tanks)
        db.commit()


@router.get(
    "/tanks/db-configuration",
    response_model=CommandResponse,
    summary="Obtener configuración de tanques desde BD",
    description="Retorna la lista de tanques configurados en la base de datos local y realiza la precarga inicial si está vacía.",
)
def get_tanks_db_configuration(db: Session = Depends(get_db)) -> CommandResponse:
    """Obtiene la configuración de los tanques de la base de datos."""
    seed_tanks_if_empty(db)
    configs = db.query(TankConfiguration).order_by(TankConfiguration.tank_id).all()
    serialized = [
        {
            "id": f"T-{str(c.tank_id).zfill(2)}",
            "db_id": c.tank_id,
            "name": c.tank_name,
            "fuelType": c.product_code,
            "maxCapacity": c.capacity,
            "status": c.status,
            "location": c.location,
        }
        for c in configs
    ]
    return CommandResponse(data=serialized)

