"""Tank configuration and calculation commands."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TYPE_CHECKING

from .models.tanks import TankConfiguration

if TYPE_CHECKING:
    from .client import PTS2Client


class TanksAPI:
    def __init__(self, client: "PTS2Client") -> None:
        self._client = client

    def get_tanks_configuration(self) -> list[TankConfiguration]:
        data = self._client.request_data("GetTanksConfiguration")
        records = self._extract_records(data, ("Tanks", "Configuration", "Records"))
        return [TankConfiguration.model_validate(record) for record in records]

    def set_tanks_configuration(self, configuration: Mapping[str, Any] | list[Mapping[str, Any]]) -> Any:
        if isinstance(configuration, list):
            data: Any = {"Tanks": configuration}
        else:
            data = dict(configuration)
        return self._client.request_data("SetTanksConfiguration", data)

    def get_tank_volume_for_height(self, tank_id: int, height: float) -> Any:
        return self._client.request_data("ProbeGetTankVolumeForHeight", {"Tank": tank_id, "Height": height})

    def get_calibration_chart(self, tank_id: int) -> Any:
        data = self._client.request_data("GetTanksConfiguration", {"Tank": tank_id})
        records = self._extract_records(data, ("Tanks", "Configuration", "Records"))
        for record in records:
            tank_value = record.get("Tank") or record.get("TankId") or record.get("TankID")
            if tank_value is None or int(tank_value) == int(tank_id):
                return record.get("CalibrationChart") or record.get("Chart") or record.get("Calibration")
        return None

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
