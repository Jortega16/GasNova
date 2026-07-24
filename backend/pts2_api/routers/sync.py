"""SD card transaction sync endpoints.

The PTS-2 stores ALL transactions locally on its SD card (PumpTrn.txt).
These endpoints detect gaps between what's on the SD and what's in the
local database, then pull the missing records via ReportGetPumpTransactions
(jsonPTS cmd #188).

Ventas hechas con el software cerrado se recuperan aquí:
- IsPaid=true  → pump_transactions (ya cobradas)
- IsPaid=false/null con volumen/monto > 0 → pending_transactions (para cobro en POS)
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..dependencies import get_pts2_client
from ..models import PumpTransaction
from ..schemas import CommandResponse
from ..transaction_store import upsert_pending_transaction

router = APIRouter(prefix="/sync", tags=["sync"])

FUEL_GRADES = ["Regular Unleaded", "Premium Unleaded", "Diesel", "Kerosene"]


def _parse_dt(dt_str: str | None) -> datetime | None:
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    except ValueError:
        return None


def _map_transaction(trx: dict[str, Any]) -> dict[str, Any]:
    """Map jsonPTS ReportGetPumpTransactions record fields to model kwargs."""
    return {
        "pump_id": trx.get("Pump", 0),
        "transaction_id": trx.get("Transaction") or trx.get("Id") or 0,
        "nozzle": trx.get("Nozzle"),
        "fuel_type": trx.get("FuelGradeName") or trx.get("Product"),
        "volume": trx.get("Volume"),
        "tc_volume": trx.get("TCVolume"),
        "amount": trx.get("Amount"),
        "unit_price": trx.get("Price"),
        "total_volume": trx.get("TotalVolume"),
        "total_amount": trx.get("TotalAmount"),
        "flow_rate": trx.get("FlowRate"),
        "start_time": _parse_dt(trx.get("DateTimeStart") or trx.get("DateTime")),
        "end_time": _parse_dt(trx.get("DateTimeEnd")),
        "status": "completed",
        "is_paid": trx.get("IsPaid"),
        "is_offline": trx.get("IsOffline"),
        "shift_number": trx.get("ShiftNumber"),
        "rfid_tag": trx.get("Tag"),
        "pts_user_id": trx.get("UserId"),
        "sync_source": "sd_recovery",
        "raw_payload": trx,
    }


def _resolve_fuel_type(trx: dict[str, Any]) -> str:
    fuel = trx.get("FuelGradeName") or trx.get("Product") or trx.get("ProductName")
    if fuel:
        return str(fuel)
    nozzle = trx.get("Nozzle") or 1
    try:
        idx = int(nozzle) - 1
        if 0 <= idx < len(FUEL_GRADES):
            return FUEL_GRADES[idx]
    except (TypeError, ValueError):
        pass
    return "Regular Unleaded"


def _default_date_range() -> tuple[str, str]:
    """Últimas 48 h en UTC (ISO sin microsegundos)."""
    end = datetime.now(timezone.utc).replace(microsecond=0)
    start = end - timedelta(hours=48)
    return start.isoformat(), end.isoformat()


# ─── GET /sync/status ────────────────────────────────────────────────────────

@router.get(
    "/status",
    response_model=CommandResponse,
    summary="Estado de sincronización SD ↔ BD (GetUploadedRecordsInformation)",
    description=(
        "Llama al comando **GetUploadedRecordsInformation** del PTS-2 (cmd #102) para obtener "
        "el total de registros almacenados en la SD y los ya enviados al servidor. "
        "Compara con el COUNT de la BD local y calcula la brecha de transacciones faltantes."
    ),
)
def sync_status(
    db: Session = Depends(get_db),
    client=Depends(get_pts2_client),
) -> CommandResponse:
    try:
        pts_info = client.request_data("GetUploadedRecordsInformation", None)
    except Exception as exc:
        return CommandResponse(data={"error": str(exc), "pts_available": False})
    finally:
        client.close()

    sd_total = pts_info.get("PumpTransactionsTotal", 0)
    sd_uploaded = pts_info.get("PumpTransactionsUploaded", 0)
    sd_gap = max(0, sd_total - sd_uploaded)

    local_count = db.query(func.count(PumpTransaction.id)).scalar() or 0

    return CommandResponse(data={
        "pts_info": pts_info,
        "sd_total": sd_total,
        "sd_uploaded": sd_uploaded,
        "sd_gap": sd_gap,
        "local_db_count": local_count,
        "sync_needed": sd_gap > 0,
    })


# ─── POST /sync/pump-transactions ───────────────────────────────────────────

@router.post(
    "/pump-transactions",
    response_model=CommandResponse,
    summary="Recuperar transacciones faltantes desde la SD del PTS-2",
    description=(
        "Llama a **ReportGetPumpTransactions** (jsonPTS cmd #188) con el rango de fechas "
        "indicado (por defecto últimas 48 h), deduplica contra la BD local por "
        "`(pump_id, transaction_id)` e inserta:\n"
        "- ventas ya cobradas (`IsPaid=true`) en `pump_transactions`\n"
        "- ventas sin cobro en `pending_transactions` para que el POS las cobre"
    ),
)
def sync_pump_transactions(
    date_time_start: str | None = Query(
        default=None,
        description="Inicio del rango (ISO 8601). Por defecto: ahora − 48 h.",
    ),
    date_time_end: str | None = Query(
        default=None,
        description="Fin del rango (ISO 8601). Por defecto: ahora (UTC).",
    ),
    pump_id: int | None = Query(default=None, ge=1, description="Filtrar por cara específica (opcional)."),
    db: Session = Depends(get_db),
    client=Depends(get_pts2_client),
) -> CommandResponse:
    if not date_time_start or not date_time_end:
        default_start, default_end = _default_date_range()
        date_time_start = date_time_start or default_start
        date_time_end = date_time_end or default_end

    payload: dict[str, Any] = {
        "DateTimeStart": date_time_start,
        "DateTimeEnd": date_time_end,
    }
    if pump_id is not None:
        payload["Pump"] = pump_id

    try:
        pts_data = client.request_data("ReportGetPumpTransactions", payload)
    except Exception as exc:
        return CommandResponse(data={"error": str(exc), "pts_available": False})
    finally:
        client.close()

    transactions: list[dict[str, Any]] = (
        pts_data if isinstance(pts_data, list) else pts_data.get("Transactions", [])
    )

    inserted = 0
    pending_inserted = 0
    skipped = 0
    skipped_zero = 0

    for trx in transactions:
        p_id = trx.get("Pump", 0)
        t_id = trx.get("Transaction") or trx.get("Id") or 0
        trx_id_str = str(t_id)
        volume = float(trx.get("Volume") or 0)
        amount = float(trx.get("Amount") or 0)
        is_paid = trx.get("IsPaid")

        # Sin despacho real: no recuperar fantasma de $0
        if volume <= 0 and amount <= 0:
            skipped_zero += 1
            continue

        exists = db.query(PumpTransaction).filter(
            PumpTransaction.pump_id == p_id,
            PumpTransaction.transaction_id == t_id,
        ).first()

        if exists:
            skipped += 1
            continue

        # Cobrado en PTS → ledger completo
        if is_paid is True:
            record = PumpTransaction(**_map_transaction(trx))
            db.add(record)
            inserted += 1
            continue

        # Sin cobro (software cerrado / IsPaid false|null) → cola de cobro POS
        _, created = upsert_pending_transaction(
            db,
            pump_id=int(p_id) if p_id else 0,
            trx_id=trx_id_str,
            nozzle=trx.get("Nozzle"),
            volume=volume,
            amount=amount,
            fuel_type=_resolve_fuel_type(trx),
            pts_transaction_id=trx_id_str,
            raw_payload=trx,
            started_at=trx.get("DateTimeStart") or trx.get("DateTime"),
            completed_at=trx.get("DateTimeEnd"),
            status="Pending",
        )
        if created:
            pending_inserted += 1
        else:
            skipped += 1

    if inserted > 0:
        db.commit()

    return CommandResponse(data={
        "retrieved_from_pts": len(transactions),
        "inserted": inserted,
        "pending_inserted": pending_inserted,
        "skipped_duplicates": skipped,
        "skipped_zero": skipped_zero,
        "sync_source": "sd_recovery",
        "date_time_start": date_time_start,
        "date_time_end": date_time_end,
        "synced_at": datetime.now(timezone.utc).isoformat(),
    })
