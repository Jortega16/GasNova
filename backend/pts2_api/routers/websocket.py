"""WebSocket event stream endpoints."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from pts2_sdk import PTS2Client
from pts2_sdk.exceptions import PTS2Error

from ..dependencies import get_settings

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/pumps")
async def pump_events(websocket: WebSocket, pump_id: int = 1, interval: float = 2.0) -> None:
    await websocket.accept()
    settings = get_settings()
    client = PTS2Client.from_settings(settings)
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
