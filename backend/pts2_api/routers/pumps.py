"""Pump endpoints for POS integrations."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Path

from pts2_sdk import PTS2Client

from ..dependencies import get_pts2_client
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import PumpTransaction, Shift
from ..schemas import AuthorizeRequest, CommandResponse, SetPricesRequest, PostpayAuthorizeRequest, TransactionCreate

router = APIRouter(prefix="/pumps", tags=["pumps"])


def _close(client: PTS2Client) -> None:
    client.close()


@router.get(
    "/{pump_id}/status",
    response_model=CommandResponse,
    summary="Estado de bomba",
    description="Devuelve el estado actual del surtidor especificado por pump_id.",
)
def get_status(
    pump_id: int = Path(ge=1, description="ID del surtidor para consultar el estado."),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Obtiene el estado actual de la bomba del PTS-2."""
    try:
        return CommandResponse(data=client.pumps.get_status(pump_id).model_dump(by_alias=True, exclude_none=True))
    finally:
        _close(client)


@router.post(
    "/{pump_id}/authorize",
    response_model=CommandResponse,
    summary="Autorizar bomba",
    description="Autoriza una venta en el surtidor indicado usando monto, volumen o autorización libre.",
)
def authorize(
    request: AuthorizeRequest,
    pump_id: int = Path(ge=1, description="ID del surtidor que se va a autorizar."),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Envía una solicitud de autorización al surtidor seleccionado."""
    try:
        data: Any
        if request.dose is None:
            data = client.pumps.authorize_free(pump_id, nozzle=request.nozzle)
        elif request.type == "Volume":
            data = client.pumps.authorize_volume(pump_id, nozzle=request.nozzle or 1, volume=request.dose)
        else:
            data = client.pumps.authorize_amount(pump_id, nozzle=request.nozzle or 1, amount=request.dose)
        return CommandResponse(data=data)
    finally:
        _close(client)


@router.post(
    "/{pump_id}/stop",
    response_model=CommandResponse,
    summary="Detener bomba",
    description="Detiene inmediatamente la bomba indicada por pump_id.",
)
def stop(
    pump_id: int = Path(ge=1, description="ID del surtidor que se detendrá."),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Detiene la operación de la bomba especificada."""
    try:
        return CommandResponse(data=client.pumps.stop(pump_id))
    finally:
        _close(client)


@router.post(
    "/{pump_id}/emergency-stop",
    response_model=CommandResponse,
    summary="Paro de emergencia",
    description="Ejecuta el paro de emergencia del surtidor indicado.",
)
def emergency_stop(
    pump_id: int = Path(ge=1, description="ID del surtidor para paro de emergencia."),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Realiza un paro de emergencia en la bomba seleccionada."""
    try:
        return CommandResponse(data=client.pumps.emergency_stop(pump_id))
    finally:
        _close(client)


@router.post(
    "/emergency-stop-all",
    response_model=CommandResponse,
    summary="Paro de emergencia general",
    description="Detiene todas las bombas en el sistema de forma inmediata.",
)
def emergency_stop_all(client: PTS2Client = Depends(get_pts2_client)) -> CommandResponse:
    """Ejecuta el paro de emergencia en todas las bombas."""
    try:
        return CommandResponse(data=client.pumps.emergency_stop_all())
    finally:
        _close(client)


@router.post(
    "/{pump_id}/suspend",
    response_model=CommandResponse,
    summary="Suspender bomba",
    description="Suspende temporalmente la bomba especificada.",
)
def suspend(
    pump_id: int = Path(ge=1, description="ID del surtidor a suspender."),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Suspende la bomba sin cerrar la transacción actual."""
    try:
        return CommandResponse(data=client.pumps.suspend(pump_id))
    finally:
        _close(client)


@router.post(
    "/{pump_id}/resume",
    response_model=CommandResponse,
    summary="Reanudar bomba",
    description="Reanuda la bomba suspendida previamente.",
)
def resume(
    pump_id: int = Path(ge=1, description="ID del surtidor a reanudar."),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Reanuda la operación de la bomba anteriormente suspendida."""
    try:
        return CommandResponse(data=client.pumps.resume(pump_id))
    finally:
        _close(client)


@router.get(
    "/{pump_id}/transaction",
    response_model=CommandResponse,
    summary="Información de transacción",
    description="Devuelve datos de la transacción activa del surtidor especificado.",
)
def transaction(
    pump_id: int = Path(ge=1, description="ID del surtidor cuya transacción se consulta."),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Obtiene la información de la transacción actual del surtidor."""
    try:
        data = client.pumps.get_transaction_information(pump_id)
        return CommandResponse(data=data.model_dump(by_alias=True, exclude_none=True))
    finally:
        _close(client)


@router.post(
    "/{pump_id}/close-transaction",
    response_model=CommandResponse,
    summary="Cerrar transacción",
    description="Cierra la transacción actual en el surtidor indicado.",
)
def close_transaction(
    pump_id: int = Path(ge=1, description="ID del surtidor cuya transacción se cerrará."),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Cierra la transacción activa en la bomba indicada."""
    try:
        return CommandResponse(data=client.pumps.close_transaction(pump_id))
    finally:
        _close(client)


@router.get(
    "/{pump_id}/totals",
    response_model=CommandResponse,
    summary="Totales de venta",
    description="Recupera los totales de ventas del surtidor especificado.",
)
def totals(
    pump_id: int = Path(ge=1, description="ID del surtidor para el que se consultan los totales."),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Obtiene los totales acumulados del surtidor."""
    try:
        data = client.pumps.get_totals(pump_id)
        return CommandResponse(data=data.model_dump(by_alias=True, exclude_none=True))
    finally:
        _close(client)


@router.get(
    "/{pump_id}/prices",
    response_model=CommandResponse,
    summary="Precios de surtidor",
    description="Obtiene los precios configurados para el surtidor especificado.",
)
def prices(
    pump_id: int = Path(ge=1, description="ID del surtidor cuyos precios se consultan."),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Recupera los precios actuales del surtidor."""
    try:
        return CommandResponse(data=client.pumps.get_prices(pump_id))
    finally:
        _close(client)


@router.put(
    "/{pump_id}/prices",
    response_model=CommandResponse,
    summary="Actualizar precios",
    description="Actualiza los precios por boquilla del surtidor indicado.",
)
def set_prices(
    request: SetPricesRequest,
    pump_id: int = Path(ge=1, description="ID del surtidor para el que se actualizan los precios."),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Actualiza los precios del surtidor en el controlador PTS-2."""
    try:
        prices_payload = [item.model_dump(by_alias=True) for item in request.prices]
        return CommandResponse(data=client.pumps.set_prices(pump_id, prices_payload))
    finally:
        _close(client)


@router.get(
    "/{pump_id}/display",
    response_model=CommandResponse,
    summary="Datos de pantalla",
    description="Obtiene la información que se muestra en la pantalla del surtidor.",
)
def display(
    pump_id: int = Path(ge=1, description="ID del surtidor cuya pantalla se consulta."),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Devuelve los datos del display del surtidor."""
    try:
        return CommandResponse(data=client.pumps.get_display_data(pump_id))
    finally:
        _close(client)


@router.post(
    "/{pump_id}/lock",
    response_model=CommandResponse,
    summary="Bloquear bomba",
    description="Bloquea la bomba indicada para impedir nuevas dispensaciones.",
)
def lock(
    pump_id: int = Path(ge=1, description="ID del surtidor a bloquear."),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Bloquea el surtidor seleccionado."""
    try:
        return CommandResponse(data=client.pumps.lock(pump_id))
    finally:
        _close(client)


@router.post(
    "/{pump_id}/unlock",
    response_model=CommandResponse,
    summary="Desbloquear bomba",
    description="Desbloquea la bomba indicada para permitir nuevas dispensaciones.",
)
def unlock(
    pump_id: int = Path(ge=1, description="ID del surtidor a desbloquear."),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Desbloquea el surtidor seleccionado."""
    try:
        return CommandResponse(data=client.pumps.unlock(pump_id))
    finally:
        _close(client)


@router.post(
    "/{pump_id}/postpay-authorize",
    response_model=CommandResponse,
    summary="Autorizar bomba en modo postpago",
    description="Autoriza la bomba especificada sin preset (carga libre) para la modalidad de postpago.",
)
def postpay_authorize(
    request: PostpayAuthorizeRequest,
    pump_id: int = Path(ge=1, description="ID del surtidor a autorizar."),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Envía una solicitud de autorización libre (sin límite) al surtidor."""
    try:
        data = client.pumps.authorize_free(pump_id, nozzle=request.nozzle)
        return CommandResponse(data={"status": "Authorized", "mode": "Postpay", "detail": data})
    finally:
        _close(client)


@router.post(
    "/{pump_id}/start-dispensing",
    response_model=CommandResponse,
    summary="Iniciar despacho (Surtir)",
    description="Endpoint lógico que simula el inicio físico del despacho de combustible en la bomba (levantamiento de pistola).",
)
def start_dispensing(
    pump_id: int = Path(ge=1, description="ID del surtidor para iniciar el despacho."),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Simula el evento de levantamiento de pistola y comienzo del flujo de combustible."""
    try:
        return CommandResponse(data={"message": "Nozzle lift event simulated successfully", "pump_id": pump_id})
    finally:
        _close(client)


@router.post(
    "/{pump_id}/transactions",
    response_model=CommandResponse,
    summary="Registrar transacción de venta",
    description="Registra de forma persistente la transacción cobrada en la base de datos PostgreSQL de la estación.",
)
def create_transaction(
    request: TransactionCreate,
    pump_id: int = Path(ge=1, description="ID del surtidor donde se realizó la venta."),
    db: Session = Depends(get_db),
) -> CommandResponse:
    """Registra y almacena la transacción en la base de datos local."""
    unit_price = request.unit_price
    if unit_price is None and request.volume > 0:
        unit_price = request.amount / request.volume

    # Find current active shift
    active_shift = db.query(Shift).filter(Shift.status == "Active").first()
    active_shift_id = active_shift.shift_id if active_shift else None

    tx = PumpTransaction(
        pump_id=pump_id,
        transaction_id=request.transaction_id,
        nozzle=request.nozzle,
        volume=request.volume,
        amount=request.amount,
        unit_price=unit_price,
        status=f"{request.status} ({request.payment_type})",
        shift_id=active_shift_id,
        payment_type=request.payment_type
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return CommandResponse(data={"id": tx.id, "transaction_id": tx.transaction_id, "pump_id": tx.pump_id, "status": tx.status})
