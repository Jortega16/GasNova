"""Report commands and export helpers."""

from __future__ import annotations

import csv
import json
from collections.abc import Iterable, Mapping
from datetime import datetime
from pathlib import Path
from typing import Any, TYPE_CHECKING

from pydantic import BaseModel

from .exceptions import PTS2ValidationError
from .models.pumps import PumpTransaction
from .models.reports import AlertRecord, GpsRecord
from .models.tanks import TankMeasurement

if TYPE_CHECKING:
    from .client import PTS2Client


class ReportsAPI:
    def __init__(self, client: "PTS2Client") -> None:
        self._client = client

    def get_pump_transactions(
        self,
        pump_id: int | None = None,
        date_time_start: str | None = None,
        date_time_end: str | None = None,
        **filters: Any,
    ) -> list[PumpTransaction]:
        data = self._client.request_data(
            "ReportGetPumpTransactions",
            self._report_filter(pump=pump_id, start=date_time_start, end=date_time_end, **filters),
        )
        return [PumpTransaction.model_validate(record) for record in self._extract_records(data, ("Transactions", "Records"))]

    def get_tank_measurements(
        self,
        tank_id: int | None = None,
        date_time_start: str | None = None,
        date_time_end: str | None = None,
        **filters: Any,
    ) -> list[TankMeasurement]:
        data = self._client.request_data(
            "ReportGetTankMeasurements",
            self._report_filter(tank=tank_id, start=date_time_start, end=date_time_end, **filters),
        )
        return [TankMeasurement.model_validate(record) for record in self._extract_records(data, ("Measurements", "Records"))]

    def get_in_tank_deliveries(
        self,
        tank_id: int | None = None,
        date_time_start: str | None = None,
        date_time_end: str | None = None,
        **filters: Any,
    ) -> list[dict[str, Any]]:
        data = self._client.request_data(
            "ReportGetInTankDeliveries",
            self._report_filter(tank=tank_id, start=date_time_start, end=date_time_end, **filters),
        )
        return [dict(record) for record in self._extract_records(data, ("Deliveries", "Records"))]

    def get_alert_records(
        self,
        date_time_start: str | None = None,
        date_time_end: str | None = None,
        **filters: Any,
    ) -> list[AlertRecord]:
        data = self._client.request_data(
            "ReportGetAlertRecords",
            self._report_filter(start=date_time_start, end=date_time_end, **filters),
        )
        return [AlertRecord.model_validate(record) for record in self._extract_records(data, ("Alerts", "Records"))]

    def get_gps_records(
        self,
        date_time_start: str | None = None,
        date_time_end: str | None = None,
        **filters: Any,
    ) -> list[GpsRecord]:
        data = self._client.request_data(
            "ReportGetGpsRecords",
            self._report_filter(start=date_time_start, end=date_time_end, **filters),
        )
        return [GpsRecord.model_validate(record) for record in self._extract_records(data, ("Gps", "GPS", "Records"))]

    def export_json(self, records: Iterable[Any], path: str | Path | None = None) -> Path:
        output = Path(path) if path else self._default_report_path("report", "json")
        output.parent.mkdir(parents=True, exist_ok=True)
        with output.open("w", encoding="utf-8") as file:
            json.dump(self._serialise_records(records), file, indent=2, ensure_ascii=False)
        return output

    def export_csv(self, records: Iterable[Any], path: str | Path | None = None) -> Path:
        rows = self._serialise_records(records)
        output = Path(path) if path else self._default_report_path("report", "csv")
        output.parent.mkdir(parents=True, exist_ok=True)
        fieldnames = sorted({key for row in rows for key in row.keys()})
        with output.open("w", encoding="utf-8", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        return output

    def to_dataframe(self, records: Iterable[Any]) -> Any:
        try:
            import pandas as pd
        except ImportError as exc:
            raise PTS2ValidationError("Install pandas or pts2-sdk[pandas] to use to_dataframe") from exc
        return pd.DataFrame(self._serialise_records(records))

    def _default_report_path(self, stem: str, suffix: str) -> Path:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return Path(self._client.reports_path) / f"{stem}_{timestamp}.{suffix}"

    def _report_filter(
        self,
        pump: int | None = None,
        tank: int | None = None,
        start: str | datetime | None = None,
        end: str | datetime | None = None,
        **filters: Any,
    ) -> dict[str, Any] | None:
        data: dict[str, Any] = {}
        if pump is not None:
            data["Pump"] = pump
        if tank is not None:
            data["Tank"] = tank
        if start is not None:
            data["DateTimeStart"] = (
                start.isoformat(sep="T", timespec="seconds") if isinstance(start, datetime) else start
            )
        if end is not None:
            data["DateTimeEnd"] = (
                end.isoformat(sep="T", timespec="seconds") if isinstance(end, datetime) else end
            )
        data.update({key: value for key, value in filters.items() if value is not None})
        return data or None

    @staticmethod
    def _extract_records(data: Any, keys: tuple[str, ...]) -> list[Mapping[str, Any]]:
        if data is None:
            return []
        if isinstance(data, list):
            return [record if isinstance(record, Mapping) else {"Value": record} for record in data]
        if isinstance(data, Mapping):
            for key in keys:
                value = data.get(key)
                if isinstance(value, list):
                    return [record if isinstance(record, Mapping) else {"Value": record} for record in value]
            return [data]
        return [{"Value": data}]

    @staticmethod
    def _serialise_records(records: Iterable[Any]) -> list[dict[str, Any]]:
        rows: list[dict[str, Any]] = []
        for record in records:
            if isinstance(record, BaseModel):
                rows.append(record.model_dump(by_alias=True, exclude_none=True))
            elif isinstance(record, Mapping):
                rows.append(dict(record))
            else:
                rows.append({"Value": record})
        return rows
