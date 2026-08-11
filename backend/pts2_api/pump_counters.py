"""Lectura de totalizadores electrónicos PTS-2 (PumpGetTotals → PumpTotals)."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from .models import PumpConfiguration


def nozzle_numbers_for_pump(db: Session, pump_id: int) -> list[int]:
    config = (
        db.query(PumpConfiguration)
        .filter(PumpConfiguration.pump_id == pump_id)
        .first()
    )
    if config and config.nozzles_json and isinstance(config.nozzles_json, list) and config.nozzles_json:
        numbers = sorted({
            int(n.get("nozzle") or n.get("Nozzle") or (i + 1))
            for i, n in enumerate(config.nozzles_json)
            if isinstance(n, dict)
        })
        if numbers:
            return numbers
        return list(range(1, (config.nozzles_count or 1) + 1))
    nozzle_count = int(config.nozzles_count) if config and config.nozzles_count else 6
    return list(range(1, max(1, nozzle_count) + 1))


def configured_pump_ids(db: Session) -> list[int]:
    rows = (
        db.query(PumpConfiguration)
        .filter(PumpConfiguration.status == "active")
        .order_by(PumpConfiguration.pump_id)
        .all()
    )
    if rows:
        return [int(r.pump_id) for r in rows]
    return [1, 2, 3, 4]


def read_pump_counters(client: Any, db: Session, pump_id: int) -> dict[str, Any]:
    """Lee y suma Volume/Amount de cada manguera configurada."""
    nozzle_numbers = nozzle_numbers_for_pump(db, pump_id)
    nozzles_out: list[dict[str, Any]] = []
    total_volume = 0.0
    total_amount = 0.0
    errors: list[str] = []

    for nozzle in nozzle_numbers:
        try:
            totals = client.pumps.get_totals(pump_id, nozzle=nozzle)
            raw = totals.to_dict() if hasattr(totals, "to_dict") else (
                totals.model_dump(by_alias=True, exclude_none=True)
                if hasattr(totals, "model_dump") else dict(totals or {})
            )
            vol = float(
                raw.get("Volume")
                or raw.get("TotalVolume")
                or getattr(totals, "volume", None)
                or 0
            )
            amt = float(
                raw.get("Amount")
                or raw.get("TotalAmount")
                or getattr(totals, "amount", None)
                or 0
            )
            nozzles_out.append({"nozzle": nozzle, "volume": vol, "amount": amt})
            total_volume += vol
            total_amount += amt
        except Exception as exc:
            errors.append(f"nozzle {nozzle}: {exc}")
            continue

    config = (
        db.query(PumpConfiguration)
        .filter(PumpConfiguration.pump_id == pump_id)
        .first()
    )
    return {
        "pump_id": pump_id,
        "pump_name": (config.pump_name if config and config.pump_name else f"Cara {pump_id}"),
        "volume": round(total_volume, 3),
        "amount": round(total_amount, 3),
        "nozzles": nozzles_out,
        "errors": errors or None,
        "source": "PumpGetTotals",
    }


def read_all_pump_counters(
    client: Any,
    db: Session,
    pump_ids: list[int] | None = None,
) -> list[dict[str, Any]]:
    ids = pump_ids or configured_pump_ids(db)
    return [read_pump_counters(client, db, pid) for pid in ids]


def _index_by_pump(rows: list[dict[str, Any]] | None) -> dict[int, dict[str, Any]]:
    out: dict[int, dict[str, Any]] = {}
    if not rows:
        return out
    for row in rows:
        try:
            pid = int(row.get("pump_id") or row.get("id") or 0)
        except (TypeError, ValueError):
            continue
        if pid:
            out[pid] = row
    return out


def build_shift_counter_breakdown(
    *,
    opening: list[dict[str, Any]] | None,
    closing: list[dict[str, Any]],
    system_by_pump: dict[int, dict[str, float]] | None = None,
) -> list[dict[str, Any]]:
    """Arma el desglose de cierre: delta PTS (cierre−apertura) vs ventas POS."""
    open_map = _index_by_pump(opening)
    close_map = _index_by_pump(closing)
    system_by_pump = system_by_pump or {}
    pump_ids = sorted(set(open_map) | set(close_map) | set(system_by_pump))

    rows: list[dict[str, Any]] = []
    for pid in pump_ids:
        open_row = open_map.get(pid) or {}
        close_row = close_map.get(pid) or {}
        sys_row = system_by_pump.get(pid) or {}

        opening_volume = open_row.get("volume")
        closing_volume = close_row.get("volume")
        opening_amount = open_row.get("amount")
        closing_amount = close_row.get("amount")

        has_opening = opening_volume is not None
        has_closing = closing_volume is not None

        mech_delta_vol = None
        mech_delta_amt = None
        if has_opening and has_closing:
            mech_delta_vol = round(float(closing_volume) - float(opening_volume), 3)
            mech_delta_amt = round(
                float(closing_amount or 0) - float(opening_amount or 0), 3
            )

        system_volume = round(float(sys_row.get("volume") or 0), 3)
        system_amount = round(float(sys_row.get("amount") or 0), 3)
        dispatch_count = int(sys_row.get("dispatch_count") or 0)

        diff_volume = None
        if mech_delta_vol is not None:
            diff_volume = round(mech_delta_vol - system_volume, 3)

        name = (
            close_row.get("pump_name")
            or open_row.get("pump_name")
            or f"Cara {pid}"
        )
        rows.append({
            "pump_id": pid,
            "pump_name": name,
            "opening_volume": round(float(opening_volume), 3) if has_opening else None,
            "closing_volume": round(float(closing_volume), 3) if has_closing else None,
            "opening_amount": round(float(opening_amount or 0), 3) if has_opening else None,
            "closing_amount": round(float(closing_amount or 0), 3) if has_closing else None,
            # "mecánico del turno" = delta; sin apertura no inventar lifetime
            "mech_volume": mech_delta_vol if mech_delta_vol is not None else None,
            "mech_amount": mech_delta_amt if mech_delta_amt is not None else None,
            "system_volume": system_volume,
            "system_amount": system_amount,
            "diff_volume": diff_volume,
            "dispatch_count": dispatch_count,
            "has_opening_snapshot": has_opening,
        })
    return rows
