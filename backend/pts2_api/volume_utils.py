"""Helpers para volumen de despacho cuando el PTS solo reporta monto."""

from __future__ import annotations

from typing import Any


def coerce_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def derive_volume(
    volume: Any,
    amount: Any,
    price: Any = None,
) -> float:
    """Usa Volume del PTS si > 0; si no, Amount / Price cuando ambos son válidos."""
    vol = coerce_float(volume)
    if vol > 0:
        return vol
    amt = coerce_float(amount)
    unit = coerce_float(price)
    if amt > 0 and unit > 0:
        return amt / unit
    return 0.0


def resolve_unit_price(data: dict[str, Any] | None, fallback: float | None = None) -> float | None:
    """Extrae precio unitario de un payload jsonPTS / captura."""
    if not data:
        return fallback if fallback and fallback > 0 else None
    for key in (
        "Price",
        "price",
        "FuelGradePrice",
        "UnitPrice",
        "unit_price",
        "PricePerUnit",
    ):
        p = coerce_float(data.get(key))
        if p > 0:
            return p
    return fallback if fallback and fallback > 0 else None


def is_zero_sale(volume: Any, amount: Any) -> bool:
    """True si no hay venta real — requiere monto y volumen > 0 (nunca $0.00)."""
    return coerce_float(volume) <= 0 or coerce_float(amount) <= 0
