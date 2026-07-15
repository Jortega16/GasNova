"""Caché en memoria del último estado conocido de bombas y tanques.

El dashboard sondea PumpGetStatus para todas las bombas y las mediciones de
sondas cada pocos segundos, y esas respuestas ya traen todo lo necesario
para pintar la pantalla (precios por boquilla, volumen/monto en curso,
nivel de tanque, alarmas). En vez de que cada endpoint puntual (por ejemplo
`/pumps/{id}/prices`) vuelva a golpear al controlador físico con su propio
round-trip bloqueante, guardamos aquí el último valor visto y lo servimos
de inmediato mientras siga "fresco".

Este módulo es intencionalmente minimalista: dos diccionarios protegidos
por un lock, sin persistencia. Se reinicia con cada arranque del proceso,
lo cual es aceptable porque los datos vuelven a llegar en el siguiente
ciclo de sondeo.
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass
from typing import Any


@dataclass
class _PumpSnapshot:
    status_type: str | None
    nozzle: int | None
    nozzle_prices: list[float] | None
    volume: float | None
    amount: float | None
    transaction: Any | None
    updated_at: float


@dataclass
class _TankSnapshot:
    data: dict[str, Any]
    updated_at: float


class LiveStateStore:
    """Caché thread-safe del último estado reportado por bombas y tanques."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._pumps: dict[int, _PumpSnapshot] = {}
        self._tanks: dict[int, _TankSnapshot] = {}

    def update_pump(
        self,
        pump_id: int,
        *,
        status_type: str | None = None,
        nozzle: int | None = None,
        nozzle_prices: list[float] | None = None,
        volume: float | None = None,
        amount: float | None = None,
        transaction: Any | None = None,
    ) -> None:
        """Registra el último estado visto para una bomba en un sondeo reciente.

        Si este sondeo no trajo "NozzlePrices" (el PTS-2 solo lo incluye
        cuando las boquillas están vinculadas a un tipo de combustible),
        se conserva el último precio conocido en vez de borrarlo — la
        ausencia en un paquete puntual no es señal de "ya no hay precio".
        """
        with self._lock:
            existing = self._pumps.get(pump_id)
            prices = nozzle_prices if nozzle_prices else (existing.nozzle_prices if existing else None)
            self._pumps[pump_id] = _PumpSnapshot(
                status_type=status_type,
                nozzle=nozzle,
                nozzle_prices=list(prices) if prices else None,
                volume=volume,
                amount=amount,
                transaction=transaction,
                updated_at=time.monotonic(),
            )

    def update_tank(self, tank_id: int, data: dict[str, Any]) -> None:
        """Registra la última medición vista para un tanque/sonda."""
        with self._lock:
            self._tanks[tank_id] = _TankSnapshot(data=dict(data), updated_at=time.monotonic())

    def clear(self) -> None:
        """Vacía la caché. Pensado para aislar pruebas entre sí."""
        with self._lock:
            self._pumps.clear()
            self._tanks.clear()

    def get_nozzle_prices(self, pump_id: int, max_age_seconds: float = 10.0) -> list[float] | None:
        """Devuelve los precios cacheados de una bomba si no superan `max_age_seconds`."""
        with self._lock:
            snapshot = self._pumps.get(pump_id)
        if snapshot is None or snapshot.nozzle_prices is None:
            return None
        if time.monotonic() - snapshot.updated_at > max_age_seconds:
            return None
        return list(snapshot.nozzle_prices)

    def get_all_pumps(self, max_age_seconds: float = 10.0) -> dict[int, dict[str, Any]]:
        """Devuelve el snapshot completo de bombas vigentes (no vencidas)."""
        now = time.monotonic()
        with self._lock:
            items = list(self._pumps.items())
        result: dict[int, dict[str, Any]] = {}
        for pump_id, snap in items:
            if now - snap.updated_at > max_age_seconds:
                continue
            result[pump_id] = {
                "status_type": snap.status_type,
                "nozzle": snap.nozzle,
                "nozzle_prices": snap.nozzle_prices,
                "volume": snap.volume,
                "amount": snap.amount,
                "transaction": snap.transaction,
            }
        return result

    def get_all_tanks(self, max_age_seconds: float = 10.0) -> dict[int, dict[str, Any]]:
        """Devuelve el snapshot completo de tanques vigentes (no vencidos)."""
        now = time.monotonic()
        with self._lock:
            items = list(self._tanks.items())
        return {
            tank_id: snap.data
            for tank_id, snap in items
            if now - snap.updated_at <= max_age_seconds
        }


live_state = LiveStateStore()
