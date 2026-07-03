"""SD card transaction sync endpoints.

The PTS-2 stores ALL transactions locally on its SD card (PumpTrn.txt).
These endpoints detect gaps between what's on the SD and what's in the
local database, then pull the missing records via ReportGetPumpTransactions
(jsonPTS cmd #188).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..dependencies import get_pts2_client
from ..models import PumpTransaction
from ..schemas import CommandResponse

router = APIRouter(prefix="/sync", tags=["sync"])


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
        "indicado, deduplica contra la BD local por `(pump_id, transaction_id)` e inserta "
        "únicamente los registros faltantes con `sync_source='sd_recovery'`."
    ),
)
def sync_pump_transactions(
    date_time_start: str = Query(
        description="Inicio del rango (ISO 8601, ej. 2026-07-01T00:00:00)."
    ),
    date_time_end: str = Query(
        description="Fin del rango (ISO 8601, ej. 2026-07-02T23:59:59)."
    ),
    pump_id: int | None = Query(default=None, ge=1, description="Filtrar por cara específica (opcional)."),
    db: Session = Depends(get_db),
    client=Depends(get_pts2_client),
) -> CommandResponse:
    # Build jsonPTS request payload
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

    transactions: list[dict[str, Any]] = pts_data if isinstance(pts_data, list) else pts_data.get("Transactions", [])

    inserted = 0
    skipped = 0

    for trx in transactions:
        p_id = trx.get("Pump", 0)
        t_id = trx.get("Transaction") or trx.get("Id") or 0

        exists = db.query(PumpTransaction).filter(
            PumpTransaction.pump_id == p_id,
            PumpTransaction.transaction_id == t_id,
        ).first()

        if exists:
            skipped += 1
            continue

        record = PumpTransaction(**_map_transaction(trx))
        db.add(record)
        inserted += 1

    if inserted > 0:
        db.commit()

    return CommandResponse(data={
        "retrieved_from_pts": len(transactions),
        "inserted": inserted,
        "skipped_duplicates": skipped,
        "sync_source": "sd_recovery",
        "synced_at": datetime.now(timezone.utc).isoformat(),
    })
