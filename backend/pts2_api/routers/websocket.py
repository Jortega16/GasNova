"""WebSocket event stream endpoints."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from pts2_sdk.exceptions import PTS2Error

from ..dependencies import get_pts2_client
from ..live_broadcast import live_broadcaster
from ..live_state import live_state

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/live-state")
async def live_state_stream(websocket: WebSocket) -> None:
    """Avisa al dashboard cuando /live/state tiene datos nuevos que pedir.

    No transmite el snapshot por este socket — solo una señal de "algo
    cambió" (ver live_broadcast.py). El cliente reacciona re-pidiendo
    GET /live/state. Si esta conexión se cae, el dashboard vuelve a su
    polling normal como respaldo.
    """
    await live_broadcaster.connect(websocket)
    try:
        while True:
            # No esperamos mensajes del cliente; solo detectamos la desconexión.
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        live_broadcaster.disconnect(websocket)


@router.websocket("/ws/pumps")
async def pump_events(websocket: WebSocket, pump_id: int = 1, interval: float = 2.0) -> None:
    await websocket.accept()
    client = get_pts2_client()
    try:
        while True:
            try:
                status = client.pumps.get_status(pump_id)
                payload = {
                    "type": "pump_status",
                    "pump": pump_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "data": status.model_dump(by_alias=True, exclude_none=True),
                }
            except PTS2Error as exc:
                payload = {
                    "type": "pts2_error",
                    "pump": pump_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "error": str(exc),
                    "error_type": exc.__class__.__name__,
                }
            await websocket.send_json(payload)
            await asyncio.sleep(max(interval, 0.5))
    except WebSocketDisconnect:
        return
    finally:
        client.close()


# ─── PTS-2 Event Server WebSocket ──────────────────────────────────────────

from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import TankMeasurement, InTankDelivery, SystemAlert, PumpEventLog
from ..transaction_store import upsert_pending_transaction
import json
import logging
import threading

logger = logging.getLogger("pts2-ws")


def confirmation(packet_id: int):
    return {
        "Protocol": "jsonPTS",
        "Packets": [
            {
                "Id": packet_id,
                "Type": "Confirmation",
                "Data": {
                    "DateTime": datetime.now(timezone.utc).isoformat()
                }
            }
        ]
    }


def tags_information_response(packet_id: int):
    return {
        "Protocol": "jsonPTS",
        "Packets": [
            {
                "Id": packet_id,
                "Type": "TagsInformation",
                "Data": {
                    "Tags": []
                }
            }
        ]
    }


def parse_datetime(dt_str: str | None) -> datetime:
    if not dt_str:
        return datetime.now(timezone.utc)
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except ValueError:
        return datetime.now(timezone.utc)


def _auto_close_transaction(websocket: WebSocket, pump_id: int) -> None:
    """Envía PumpCloseTransaction al PTS-2 en un hilo separado para no bloquear el WebSocket.

    Esto implementa el gap 2: cuando el PTS-2 envía UploadPumpTransaction por WebSocket,
    el backend confirma automáticamente cerrando la transacción vía HTTP, liberando la bomba
    sin necesidad de que el POS lo haga explícitamente.
    """
    def _close() -> None:
        try:
            client = websocket.app.state.pts2_client
            client.request_data("PumpCloseTransaction", {"Pump": pump_id})
            logger.info("Auto-close PumpCloseTransaction pump=%s", pump_id)
        except Exception as exc:
            logger.warning("Auto-close falló pump=%s: %s", pump_id, exc)

    threading.Thread(target=_close, daemon=True).start()


def _consume_auth_shift(websocket: WebSocket, pump_id: int) -> str | None:
    """Recupera y limpia el shift_id capturado en la autorización para este pump.

    Best-effort: si el websocket no tiene app/state (p. ej. en tests con un
    fake), simplemente no hay turno capturado y se usa el turno activo.
    """
    app = getattr(websocket, "app", None)
    if app is None:
        return None
    auth_shifts: dict = getattr(app.state, "pump_auth_shifts", {})
    return auth_shifts.pop(pump_id, None)


async def handle_packet(packet: dict[str, Any], websocket: WebSocket, db: Session):
    packet_id = packet.get("Id", 1)
    packet_type = packet.get("Type")
    data = packet.get("Data", {})

    logger.info("PTS-2 packet Type=%s Id=%s Data=%s", packet_type, packet_id, data)

    def record_pump_event() -> None:
        try:
            transaction = data.get("Transaction") or data.get("TransactionId") or data.get("Id")
            event = PumpEventLog(
                event_type=packet_type or "Unknown",
                pump_id=data.get("Pump"),
                nozzle=data.get("Nozzle"),
                pts_transaction_id=str(transaction) if transaction is not None else None,
                raw_payload=data,
            )
            db.add(event)
            db.commit()
        except Exception as exc:
            logger.error("Error saving PumpEventLog: %s", exc)
            db.rollback()

    if packet_type == "Ping":
        await websocket.send_text(json.dumps({
            "Protocol": "jsonPTS",
            "Packets": [
                {
                    "Id": packet_id,
                    "Type": "Pong"
                }
            ]
        }))
        return

    if packet_type == "UploadPumpTransaction":
        logger.info("Venta recibida: %s", data)
        record_pump_event()
        try:
            pump_id_val: int = data.get("Pump", 1)
            transaction = data.get("Transaction") or data.get("TransactionId") or data.get("Id")
            trx_id = str(transaction or f"{pump_id_val}-{data.get('DateTimeEnd') or data.get('DateTime') or datetime.now(timezone.utc).isoformat()}")
            # Recupera el shift capturado en el momento de la autorización (gap #4).
            auth_shift_id = _consume_auth_shift(websocket, pump_id_val)

            # No hubo despacho real (manguera levantada y colgada sin surtir
            # combustible): no crear una "venta" fantasma de $0.00 / 0 litros.
            upload_volume = data.get("Volume") or 0
            upload_amount = data.get("Amount") or 0
            if upload_volume <= 0 and upload_amount <= 0:
                logger.info(
                    "UploadPumpTransaction sin despacho real (volume=0, amount=0) — ignorado. pump=%s",
                    pump_id_val,
                )
            else:
                upsert_pending_transaction(
                    db,
                    pump_id=pump_id_val,
                    nozzle=data.get("Nozzle"),
                    volume=data.get("Volume"),
                    amount=data.get("Amount"),
                    fuel_type=data.get("FuelGradeName") or data.get("Product") or data.get("ProductName"),
                    trx_id=trx_id,
                    pts_transaction_id=str(transaction) if transaction is not None else trx_id,
                    raw_payload=data,
                    started_at=data.get("DateTimeStart") or data.get("DateTime"),
                    completed_at=data.get("DateTimeEnd") or data.get("DateTime"),
                    station_code=str(data.get("Station") or data.get("StationCode") or "") or None,
                    pos_terminal_code=str(data.get("Terminal") or data.get("PosTerminalCode") or "") or None,
                    shift_id=auth_shift_id,
                )
        except Exception as exc:
            logger.error("Error saving PendingTransaction: %s", exc)
            db.rollback()
        # Gap 2: cierra la transacción en el PTS-2 automáticamente al recibir UploadPumpTransaction.
        # El PTS-2 queda en PumpEndOfTransactionStatus hasta que el POS envía PumpCloseTransaction.
        _auto_close_transaction(websocket, pump_id_val)
        await live_broadcaster.notify_changed("UploadPumpTransaction", pump_id_val)
        await websocket.send_text(json.dumps(confirmation(packet_id)))
        return

    if packet_type == "UploadTankMeasurement":
        logger.info("Medición de tanque recibida: %s", data)
        try:
            measurement = TankMeasurement(
                tank_id=data.get("Tank", 1),
                probe_id=data.get("Probe", 1),
                height=data.get("Height"),
                volume=data.get("Volume"),
                temperature=data.get("Temperature"),
                product_code=str(data.get("ProductCode", "")),
                measurement_time=parse_datetime(data.get("DateTime"))
            )
            db.add(measurement)
            db.commit()
        except Exception as exc:
            logger.error("Error saving TankMeasurement: %s", exc)
            db.rollback()
        # Independiente del resultado del guardado en BD: la caché en memoria
        # que alimenta el dashboard no debe perder este dato por un problema
        # transitorio de base de datos.
        live_state.update_tank(data.get("Tank", 1), data)
        await live_broadcaster.notify_changed("UploadTankMeasurement")
        await websocket.send_text(json.dumps(confirmation(packet_id)))
        return

    if packet_type == "UploadInTankDelivery":
        logger.info("Descarga en tanque recibida: %s", data)
        try:
            delivery = InTankDelivery(
                tank_id=data.get("Tank", 1),
                delivery_date=parse_datetime(data.get("DateTime")),
                volume=data.get("Volume", 0.0),
                product_code=data.get("ProductCode"),
                notes="Recibido vía WebSocket UploadInTankDelivery"
            )
            db.add(delivery)
            db.commit()
        except Exception as exc:
            logger.error("Error saving InTankDelivery: %s", exc)
            db.rollback()
        await websocket.send_text(json.dumps(confirmation(packet_id)))
        return

    if packet_type == "UploadAlertRecord":
        logger.warning("Alerta recibida: %s", data)
        try:
            # Campos según protocolo jsonPTS cmd #208: DeviceType, DeviceNumber, State, Code, DateTime
            device_type = data.get("DeviceType", "PTS")
            device_number = data.get("DeviceNumber", 0)
            state = data.get("State", "Detected")   # Started | Finished | Detected
            code = data.get("Code", 0)
            description = f"{device_type} #{device_number} — {state} (code {code})"
            alert = SystemAlert(
                alert_code=code,
                alert_type=device_type,
                description=description,
                alert_time=parse_datetime(data.get("DateTime")),
                resolved=state == "Finished",
            )
            db.add(alert)
            db.commit()
        except Exception as exc:
            logger.error("Error saving SystemAlert: %s", exc)
            db.rollback()
        await websocket.send_text(json.dumps(confirmation(packet_id)))
        return

    if packet_type == "UploadStatus":
        # Empuje periódico de estado de bomba (equivalente a lo que devuelve
        # PumpGetStatus, pero sin tener que sondear). Solo trae LastPrices
        # (precio activo), no el arreglo completo de NozzlePrices — por eso
        # no se pasa nozzle_prices aquí y update_pump conserva el último
        # arreglo completo que sí llegó por sondeo (ver live_state.py).
        pump_id_val = data.get("Pump")
        if pump_id_val is not None:
            live_state.update_pump(
                pump_id_val,
                status_type=data.get("Status") or data.get("Type") or data.get("StatusType"),
                nozzle=data.get("Nozzle"),
                volume=data.get("Volume"),
                amount=data.get("Amount"),
                transaction=data.get("Transaction"),
            )
        await live_broadcaster.notify_changed("UploadStatus", pump_id_val)
        await websocket.send_text(json.dumps(confirmation(packet_id)))
        return

    if packet_type in {
        "UploadGpsRecord", "UploadPayment", "UploadShift", "UploadConfiguration",
    }:
        logger.info("%s recibido: %s", packet_type, data)
        await websocket.send_text(json.dumps(confirmation(packet_id)))
        return

    if packet_type == "RequestTagsInformation":
        # Protocolo jsonPTS cmd #215: TagsInformation response.
        # Cada tag solicitado debe aparecer en la respuesta con Valid=true/false.
        # Tags: [] con Valid=false deja al PTS-2 rechazar el tag (sin autorización).
        # Para producción: consultar la base de datos de tags RFID y devolver saldo/permisos.
        logger.info("Solicitud de TAG/RFID recibida: %s", data)
        requested_tags = data.get("Tags", [])
        tag_responses = [
            {
                "Tag": t.get("Tag", ""),
                "Valid": False,
            }
            for t in requested_tags
        ]
        response = {
            "Protocol": "jsonPTS",
            "Packets": [
                {
                    "Id": packet_id,
                    "Type": "TagsInformation",
                    "Data": {"Tags": tag_responses},
                }
            ],
        }
        await websocket.send_text(json.dumps(response))
        return

    logger.warning("Tipo no manejado: %s", packet_type)
    await websocket.send_text(json.dumps(confirmation(packet_id)))


@router.websocket("/ptsWebSocket")
async def pts_websocket(websocket: WebSocket):
    pts_id = websocket.headers.get("x-pts-id")
    firmware = websocket.headers.get("x-pts-firmware-version-datetime")
    config_id = websocket.headers.get("x-pts-configuration-identifier")

    logger.info("Conexión PTS-2")
    logger.info("PTS ID: %s", pts_id)
    logger.info("Firmware: %s", firmware)
    logger.info("Config ID: %s", config_id)

    protocols = websocket.headers.get("sec-websocket-protocol", "").split(",")
    subprotocol = None
    if "chat" in [p.strip() for p in protocols]:
        subprotocol = "chat"
    await websocket.accept(subprotocol=subprotocol)

    try:
        while True:
            raw = await websocket.receive_text()
            logger.info("Mensaje crudo recibido: %s", raw)

            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                logger.error("JSON inválido recibido")
                continue

            packets = message.get("Packets", [])

            # Sesión corta por lote de paquetes: la conexión del PTS-2 vive
            # días, y una sesión de BD retenida todo ese tiempo queda inservible
            # si PostgreSQL se reinicia (pool_pre_ping solo valida al prestar
            # la conexión, no las ya prestadas).
            for packet in packets:
                db = SessionLocal()
                try:
                    await handle_packet(packet, websocket, db)
                finally:
                    db.close()

    except WebSocketDisconnect:
        logger.warning("PTS-2 desconectado")
