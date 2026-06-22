"""WebSocket event stream endpoints."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from pts2_sdk.exceptions import PTS2Error

from ..dependencies import get_pts2_client

router = APIRouter(tags=["websocket"])


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

from fastapi import Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import PumpTransaction, TankMeasurement, InTankDelivery, SystemAlert
import json
import logging

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


async def handle_packet(packet: dict[str, Any], websocket: WebSocket, db: Session):
    packet_id = packet.get("Id", 1)
    packet_type = packet.get("Type")
    data = packet.get("Data", {})

    logger.info("PTS-2 packet Type=%s Id=%s Data=%s", packet_type, packet_id, data)

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
        try:
            transaction = PumpTransaction(
                pump_id=data.get("Pump", 1),
                transaction_id=data.get("Transaction", 0),
                nozzle=data.get("Nozzle"),
                volume=data.get("Volume"),
                amount=data.get("Amount"),
                unit_price=data.get("Price"),
                start_time=parse_datetime(data.get("DateTimeStart")),
                end_time=parse_datetime(data.get("DateTimeEnd")),
                status="Completed"
            )
            db.add(transaction)
            db.commit()
        except Exception as exc:
            logger.error("Error saving PumpTransaction: %s", exc)
            db.rollback()
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
            alert = SystemAlert(
                alert_code=data.get("Code", 0),
                alert_type=data.get("Type", "warning"),
                description=data.get("Description", ""),
                alert_time=parse_datetime(data.get("DateTime")),
                resolved=False
            )
            db.add(alert)
            db.commit()
        except Exception as exc:
            logger.error("Error saving SystemAlert: %s", exc)
            db.rollback()
        await websocket.send_text(json.dumps(confirmation(packet_id)))
        return

    if packet_type in {
        "UploadGpsRecord", "UploadPayment", "UploadShift",
        "UploadConfiguration", "UploadStatus"
    }:
        logger.info("%s recibido: %s", packet_type, data)
        await websocket.send_text(json.dumps(confirmation(packet_id)))
        return

    if packet_type == "RequestTagsInformation":
        logger.info("Solicitud de TAG/RFID recibida: %s", data)
        await websocket.send_text(json.dumps(tags_information_response(packet_id)))
        return

    logger.warning("Tipo no manejado: %s", packet_type)
    await websocket.send_text(json.dumps(confirmation(packet_id)))


@router.websocket("/ptsWebSocket")
async def pts_websocket(websocket: WebSocket, db: Session = Depends(get_db)):
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

            for packet in packets:
                await handle_packet(packet, websocket, db)

    except WebSocketDisconnect:
        logger.warning("PTS-2 desconectado")
