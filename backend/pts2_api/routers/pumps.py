"""Pump endpoints for POS integrations."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Path, HTTPException, Request, status
from pydantic import BaseModel

from pts2_sdk import PTS2Client

from ..dependencies import get_pts2_client
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import PumpTransaction, Shift, PumpConfiguration, PendingTransaction
from ..schemas import (
    AuthorizeRequest,
    CommandResponse,
    SetPricesRequest,
    PostpayAuthorizeRequest,
    TransactionCreate,
    PumpAuthorizeBody,
    PumpActionBody,
    PumpStatusItem,
    PumpsStatusAllResponse,
    PendingTransactionCreate,
    PendingTransactionProcess,
)
from ..transaction_store import (
    complete_pending_transaction,
    serialize_completed_transaction,
    serialize_pending_transaction,
    upsert_pending_transaction,
)

router = APIRouter(prefix="/pumps", tags=["pumps"])

# Número de bombas a consultar (se puede configurar en settings más adelante)
_DEFAULT_PUMP_COUNT = 8


def _close(client: PTS2Client) -> None:
    client.close()


@router.get(
    "/status-all",
    response_model=PumpsStatusAllResponse,
    summary="Estado de todas las bombas",
    description="Consulta el estado real de todas las bombas configuradas al PTS-2 en una sola operación para polling del dashboard.",
)
def get_all_pumps_status(
    pump_count: int = _DEFAULT_PUMP_COUNT,
    client: PTS2Client = Depends(get_pts2_client),
) -> PumpsStatusAllResponse:
    """Consulta PumpGetStatus para todas las bombas y devuelve la lista de estados mapeados."""
    from pts2_sdk.models.packets import Packet

    # Build multi-packet request for all pumps at once
    packets = [
        Packet.command("PumpGetStatus", data={"Pump": pump_id}, packet_id=pump_id)
        for pump_id in range(1, pump_count + 1)
    ]

    results: list[PumpStatusItem] = []

    try:
        response = client.send(packets)
        packet_map = {p.id: p for p in response.packets}
    except Exception as exc:
        # If the whole request fails, return all pumps as offline
        client.close()
        return PumpsStatusAllResponse(
            pumps=[
                PumpStatusItem(
                    pump=pump_id,
                    status_type="PumpOfflineStatus",
                    error=str(exc),
                )
                for pump_id in range(1, pump_count + 1)
            ]
        )
    finally:
        client.close()

    for pump_id in range(1, pump_count + 1):
        packet = packet_map.get(pump_id)
        if packet is None:
            results.append(PumpStatusItem(pump=pump_id, status_type="PumpOfflineStatus", error="No response"))
            continue

        data = packet.data or {}
        status_type = packet.type or "PumpOfflineStatus"

        # Extract prices: NozzlePrices is a list, active nozzle price is NozzlePrices[nozzle-1]
        nozzle_prices: list[float] | None = data.get("NozzlePrices")
        active_nozzle = data.get("Nozzle") or data.get("NozzleUp")
        active_price: float | None = None
        if nozzle_prices and active_nozzle and isinstance(active_nozzle, int):
            idx = active_nozzle - 1
            if 0 <= idx < len(nozzle_prices):
                active_price = nozzle_prices[idx] or None

        results.append(PumpStatusItem(
            pump=pump_id,
            status_type=status_type,
            nozzle=active_nozzle,
            fuel_grade_id=data.get("FuelGradeId"),
            fuel_grade_name=data.get("FuelGradeName"),
            volume=data.get("Volume"),
            amount=data.get("Amount"),
            price=active_price,
            transaction=data.get("Transaction"),
            nozzle_prices=nozzle_prices,
            last_volume=data.get("LastVolume"),
            last_amount=data.get("LastAmount"),
            last_transaction=data.get("LastTransaction"),
        ))

    return PumpsStatusAllResponse(pumps=results)


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
    req: Request,
    pump_id: int = Path(ge=1, description="ID del surtidor que se va a autorizar."),
    client: PTS2Client = Depends(get_pts2_client),
    db: Session = Depends(get_db),
) -> CommandResponse:
    """Envía una solicitud PumpAuthorize al PTS-2 con todos los campos del protocolo jsonPTS."""
    # Captura el turno activo en el momento de la autorización.
    # Se almacena en app.state para que el WebSocket y el endpoint de captura
    # lo usen al crear el pending_transaction, evitando que un cambio de turno
    # durante el despacho asigne la venta al turno incorrecto.
    from ..transaction_store import get_active_shift_id
    shift_at_auth = request.shift_id or get_active_shift_id(db)
    if shift_at_auth:
        auth_shifts: dict[int, str] = getattr(req.app.state, "pump_auth_shifts", {})
        auth_shifts[pump_id] = shift_at_auth
        req.app.state.pump_auth_shifts = auth_shifts

    try:
        pts_data: dict[str, Any] = {"Pump": pump_id}
        if request.nozzle is not None:
            pts_data["Nozzle"] = request.nozzle
        if request.type is not None:
            pts_data["Type"] = request.type
        if request.dose is not None:
            pts_data["Dose"] = request.dose
        if request.price is not None:
            pts_data["Price"] = request.price
        if request.tag is not None:
            pts_data["Tag"] = request.tag
        if request.auto_close_transaction:
            pts_data["AutoCloseTransaction"] = True

        if not request.type and not request.dose:
            data = client.pumps.authorize_free(pump_id, nozzle=request.nozzle)
        else:
            data = client.request_data("PumpAuthorize", pts_data)
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
    db: Session = Depends(get_db),
) -> CommandResponse:
    """Recupera los precios actuales del surtidor."""
    try:
        try:
            return CommandResponse(data=client.pumps.get_prices(pump_id))
        except Exception:
            # Fallback local cuando el PTS-2 no está disponible.
            # Devuelve NozzlePrices en el mismo formato que PumpPrices response del protocolo jsonPTS.
            from ..models import SystemSetting
            settings_map: dict[str, float] = {}
            for s in db.query(SystemSetting).all():
                try:
                    settings_map[s.key] = float(s.value)
                except (ValueError, TypeError):
                    pass

            nozzle_prices = [
                settings_map.get("price_regular_unleaded", 4.19),
                settings_map.get("price_premium_unleaded", 4.69),
                settings_map.get("price_diesel", 4.49),
                settings_map.get("price_kerosene", 3.89),
            ]
            return CommandResponse(data={
                "Pump": pump_id,
                "NozzlePrices": nozzle_prices,
                "_source": "local_fallback",
            })
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
        try:
            prices_payload = [item.model_dump(by_alias=True) for item in request.prices]
            return CommandResponse(data=client.pumps.set_prices(pump_id, prices_payload))
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"No se pudieron enviar los precios al controlador PTS-2: {str(e)}",
            )
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
        payment_type=request.payment_type,
        document_type=request.document_type,
        document_number=request.document_number,
        payment_reference=request.payment_reference,
        cashier_name=request.cashier_name,
        station_code=request.station_code,
        pos_terminal_code=request.pos_terminal_code,
        raw_payload=request.raw_payload,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return CommandResponse(data={"id": tx.id, "transaction_id": tx.transaction_id, "pump_id": tx.pump_id, "status": tx.status})


@router.post(
    "/authorize",
    response_model=CommandResponse,
    summary="Autorizar bomba (Body)",
)
def pump_authorize(
    body: PumpAuthorizeBody,
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Autoriza un surtidor utilizando la estructura del cuerpo de la petición."""
    data: dict[str, Any] = {
        "Pump": body.pump,
        "Type": body.type
    }
    if body.nozzle is not None:
        data["Nozzle"] = body.nozzle
    if body.dose is not None:
        data["Dose"] = body.dose
    if body.price is not None:
        data["Price"] = body.price
    if body.tag is not None:
        data["Tag"] = body.tag

    try:
        res = client.request_data("PumpAuthorize", data)
        return CommandResponse(data=res)
    finally:
        _close(client)


@router.post(
    "/stop",
    response_model=CommandResponse,
    summary="Detener bomba (Body)",
)
def pump_stop(
    body: PumpActionBody,
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Detiene la bomba utilizando el cuerpo de la petición."""
    try:
        return CommandResponse(data=client.pumps.stop(body.pump))
    finally:
        _close(client)


@router.post(
    "/emergency-stop",
    response_model=CommandResponse,
    summary="Paro de emergencia (Body)",
)
def pump_emergency_stop(
    body: PumpActionBody,
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Detiene en emergencia la bomba utilizando el cuerpo de la petición."""
    try:
        return CommandResponse(data=client.pumps.emergency_stop(body.pump))
    finally:
        _close(client)


@router.post(
    "/suspend",
    response_model=CommandResponse,
    summary="Suspender bomba (Body)",
)
def pump_suspend(
    body: PumpActionBody,
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Suspende la bomba utilizando el cuerpo de la petición."""
    try:
        return CommandResponse(data=client.pumps.suspend(body.pump))
    finally:
        _close(client)


@router.post(
    "/resume",
    response_model=CommandResponse,
    summary="Reanudar bomba (Body)",
)
def pump_resume(
    body: PumpActionBody,
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Reanuda la bomba utilizando el cuerpo de la petición."""
    try:
        return CommandResponse(data=client.pumps.resume(body.pump))
    finally:
        _close(client)


@router.post(
    "/close-transaction",
    response_model=CommandResponse,
    summary="Cerrar transacción (Body)",
)
def pump_close_transaction(
    body: PumpActionBody,
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Cierra la transacción de la bomba utilizando el cuerpo de la petición."""
    try:
        return CommandResponse(data=client.pumps.close_transaction(body.pump))
    finally:
        _close(client)


def seed_pumps_if_empty(db: Session) -> None:
    """Prepopulate database with default pump configuration if empty."""
    if db.query(PumpConfiguration).count() == 0:
        initial_pumps = [
            PumpConfiguration(pump_id=1, pump_name="Cara 1", nozzles_count=3, status="active"),
            PumpConfiguration(pump_id=2, pump_name="Cara 2", nozzles_count=3, status="active"),
            PumpConfiguration(pump_id=3, pump_name="Cara 3", nozzles_count=3, status="active"),
            PumpConfiguration(pump_id=4, pump_name="Cara 4", nozzles_count=3, status="active"),
        ]
        db.add_all(initial_pumps)
        db.commit()


@router.get(
    "/configuration",
    response_model=CommandResponse,
    summary="Obtener configuración de bombas",
    description="Retorna la lista de bombas configuradas en la base de datos local y realiza la precarga inicial si está vacía.",
)
def get_pumps_configuration(db: Session = Depends(get_db)) -> CommandResponse:
    """Obtiene la configuración de los surtidores de la base de datos."""
    seed_pumps_if_empty(db)
    configs = db.query(PumpConfiguration).order_by(PumpConfiguration.pump_id).all()
    serialized = [
        {
            "id": c.pump_id,
            "name": c.pump_name,
            "nozzles_count": c.nozzles_count,
            "status": c.status,
            "location": c.location,
        }
        for c in configs
    ]
    return CommandResponse(data=serialized)


class LocalPumpConfigCreate(BaseModel):
    pumpId: int
    name: str
    nozzlesCount: int = 1


@router.post(
    "/local-configuration",
    response_model=CommandResponse,
    summary="Guardar o actualizar configuración local de bomba",
    description="Persiste nombre y cantidad de mangueras en la BD local. Complementa al endpoint /configuration/pumps que actúa sobre el PTS-2.",
)
def save_local_pump_configuration(
    request: LocalPumpConfigCreate,
    db: Session = Depends(get_db),
) -> CommandResponse:
    """Crea o actualiza el registro de PumpConfiguration en la BD local."""
    existing = db.query(PumpConfiguration).filter(PumpConfiguration.pump_id == request.pumpId).first()
    if existing:
        existing.pump_name = request.name
        existing.nozzles_count = request.nozzlesCount
    else:
        existing = PumpConfiguration(
            pump_id=request.pumpId,
            pump_name=request.name,
            nozzles_count=request.nozzlesCount,
            status="active",
        )
        db.add(existing)
    db.commit()
    db.refresh(existing)
    return CommandResponse(data={
        "id": existing.pump_id,
        "name": existing.pump_name,
        "nozzles_count": existing.nozzles_count,
        "status": existing.status,
    })


@router.get(
    "/pending-transactions",
    response_model=CommandResponse,
    summary="Listar transacciones pendientes transitorias",
)
def list_pending_transactions(db: Session = Depends(get_db)) -> CommandResponse:
    """Retorna la lista completa de despachos acumulados en pistolas (cola transitoria)."""
    pending = db.query(PendingTransaction).all()
    serialized = [serialize_pending_transaction(p) for p in pending]
    return CommandResponse(data=serialized)


@router.post(
    "/{pump_id}/pending-transactions",
    response_model=CommandResponse,
    summary="Registrar transacción pendiente transitoria",
)
def create_pending_transaction(
    request: PendingTransactionCreate,
    pump_id: int = Path(ge=1),
    db: Session = Depends(get_db),
) -> CommandResponse:
    """Almacena un despacho pendiente de forma transitoria en la base de datos."""
    pending, created = upsert_pending_transaction(
        db,
        pump_id=pump_id,
        trx_id=request.trx_id,
        nozzle=request.nozzle,
        volume=request.volume,
        amount=request.amount,
        fuel_type=request.fuel_type,
        pts_transaction_id=request.pts_transaction_id,
        raw_payload=request.raw_payload,
        shift_id=request.shift_id,
        started_at=request.started_at,
        completed_at=request.completed_at,
        status=request.status,
        station_code=request.station_code,
        pos_terminal_code=request.pos_terminal_code,
    )
    data = serialize_pending_transaction(pending)
    data["created"] = created
    data["message"] = "Creada" if created else "Ya existe"
    return CommandResponse(data=data)


@router.post(
    "/{pump_id}/pending-transactions/capture",
    response_model=CommandResponse,
    summary="Capturar transacción pendiente desde PTS-2",
    description="Lee PumpGetTransactionInformation y guarda la venta como pendiente transaccional para que el POS la procese.",
)
def capture_pending_transaction_from_pts(
    req: Request,
    pump_id: int = Path(ge=1),
    client: PTS2Client = Depends(get_pts2_client),
    db: Session = Depends(get_db),
) -> CommandResponse:
    """Captura la última transacción del PTS-2 y la deja en pending_transactions."""
    try:
        transaction = client.pumps.get_transaction_information(pump_id)
        data = transaction.model_dump(by_alias=True, exclude_none=True)
    finally:
        _close(client)

    trx_id = str(
        data.get("Transaction")
        or data.get("TransactionId")
        or data.get("LastTransaction")
        or f"{pump_id}-{data.get('DateTime') or data.get('LastDateTime') or 'pending'}"
    )
    # Recupera el shift capturado en el momento de la autorización (gap #4).
    auth_shifts: dict = getattr(req.app.state, "pump_auth_shifts", {})
    auth_shift_id: str | None = auth_shifts.pop(pump_id, None)
    req.app.state.pump_auth_shifts = auth_shifts

    pending, created = upsert_pending_transaction(
        db,
        pump_id=pump_id,
        trx_id=trx_id,
        nozzle=data.get("Nozzle") or data.get("LastNozzle"),
        volume=data.get("Volume") or data.get("LastVolume"),
        amount=data.get("Amount") or data.get("LastAmount"),
        fuel_type=data.get("FuelGradeName") or data.get("Product") or data.get("LastFuelGradeName"),
        pts_transaction_id=trx_id,
        raw_payload=data,
        started_at=data.get("DateTimeStart") or data.get("DateTime"),
        completed_at=data.get("DateTimeEnd") or data.get("LastDateTime"),
        station_code=str(data.get("Station") or data.get("StationCode") or "") or None,
        pos_terminal_code=str(data.get("Terminal") or data.get("PosTerminalCode") or "") or None,
        shift_id=auth_shift_id,
    )
    response = serialize_pending_transaction(pending)
    response["created"] = created
    response["source"] = "PTS-2"
    return CommandResponse(data=response)


@router.post(
    "/{pump_id}/pending-transactions/{trx_id}/process",
    response_model=CommandResponse,
    summary="Procesar pendiente y mover a transacción completa",
)
def process_pending_transaction(
    request: PendingTransactionProcess,
    pump_id: int = Path(ge=1),
    trx_id: str = Path(...),
    db: Session = Depends(get_db),
) -> CommandResponse:
    """Mueve una transacción pendiente a pump_transactions y elimina la pendiente."""
    try:
        transaction, created = complete_pending_transaction(
            db,
            pump_id=pump_id,
            trx_id=trx_id,
            payment_type=request.payment_type,
            status=request.status,
            document_type=request.document_type,
            document_number=request.document_number,
            payment_reference=request.payment_reference,
            cashier_name=request.cashier_name,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    data = serialize_completed_transaction(transaction)
    data["created"] = created
    data["message"] = "Movida a transacciones completas" if created else "Ya estaba completa"
    return CommandResponse(data=data)


@router.delete(
    "/{pump_id}/pending-transactions/{trx_id}",
    response_model=CommandResponse,
    summary="Bajar transacción pendiente a completadas",
)
def delete_pending_transaction(
    pump_id: int = Path(ge=1),
    trx_id: str = Path(...),
    db: Session = Depends(get_db),
) -> CommandResponse:
    """Compatibilidad: una baja de pendiente se mueve al histórico, no se elimina."""
    try:
        transaction, created = complete_pending_transaction(
            db,
            pump_id=pump_id,
            trx_id=trx_id,
            payment_type="Cash",
            status="Completed",
            document_type="Bajada",
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    data = serialize_completed_transaction(transaction)
    data["created"] = created
    data["message"] = "Movida a transacciones completas como Bajada" if created else "Ya estaba completa"
    return CommandResponse(data=data)


@router.get(
    "/{pump_id}/counters",
    response_model=CommandResponse,
    summary="Contadores mecánicos del surtidor",
    description="Intenta leer TotalVolume y TotalAmount del PTS-2. Si no están disponibles devuelve 0.",
)
def get_pump_counters(
    pump_id: int = Path(ge=1),
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    """Lee los contadores acumulados (odómetros mecánicos) del surtidor desde el PTS-2."""
    try:
        raw = client.request_data("GetPumpStatus", {"Pump": pump_id})
        total_volume = float(raw.get("TotalVolume") or 0)
        total_amount = float(raw.get("TotalAmount") or 0)
    except Exception:
        total_volume = 0.0
        total_amount = 0.0
    finally:
        _close(client)
    return CommandResponse(data={
        "pump_id": pump_id,
        "total_volume": total_volume,
        "total_amount": total_amount,
    })
