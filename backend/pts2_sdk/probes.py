"""Probe and ATG measurement commands."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TYPE_CHECKING

from .models.probes import ProbeMeasurement

if TYPE_CHECKING:
    from .client import PTS2Client


class ProbesAPI:
    def __init__(self, client: "PTS2Client") -> None:
        self._client = client

    def get_measurements(self, probe_id: int) -> ProbeMeasurement:
        data = self._client.request_data("ProbeGetMeasurements", {"Probe": probe_id})
        return ProbeMeasurement.model_validate(data or {"Probe": probe_id})

    def get_all_measurements(self) -> list[ProbeMeasurement]:
        measurements = []
        for probe_id in range(1, 5):
            try:
                meas = self.get_measurements(probe_id)
                if meas and meas.product_volume is not None:
                    measurements.append(meas)
            except Exception:
                continue
        return measurements

    def get_tank_volume_for_height(self, tank_id: int, height: float) -> Any:
        return self._client.request_data("ProbeGetTankVolumeForHeight", {"Tank": tank_id, "Height": height})

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
