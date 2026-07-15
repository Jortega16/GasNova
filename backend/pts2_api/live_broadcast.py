"""Difusión de "algo cambió" a los clientes del dashboard conectados por WebSocket.

Cuando el PTS-2 físico empuja un paquete real por /ptsWebSocket (una venta,
una medición de tanque, un cambio de estado de bomba), avisamos a los
navegadores conectados a /ws/live-state para que vuelvan a pedir
GET /live/state de inmediato en vez de esperar al siguiente ciclo de
polling. No mandamos el dato en sí por el socket — el payload de
/live/state ya trae toda la lógica de enriquecimiento (fuel_grade_name,
precios cacheados, etc.) y no queremos duplicarla aquí ni arriesgarnos a
que el push y el polling se desincronicen en la forma de los datos.

Todo corre en el mismo event loop de asyncio (un solo worker de uvicorn),
así que no hace falta ningún lock: FastAPI/Starlette no cede el control
entre los `await` que tocan `self._connections`.
"""

from __future__ import annotations

from fastapi import WebSocket


class LiveBroadcaster:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self._connections.discard(websocket)

    async def notify_changed(self, reason: str, pump_id: int | None = None) -> None:
        """Avisa a todos los clientes conectados que /live/state tiene datos nuevos."""
        if not self._connections:
            return
        payload = {"type": "live_state_changed", "reason": reason, "pump": pump_id}
        dead: list[WebSocket] = []
        for ws in self._connections:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._connections.discard(ws)


live_broadcaster = LiveBroadcaster()
