"""Pump control commands."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TYPE_CHECKING

from .exceptions import PTS2ValidationError
from .models.pumps import PumpStatus, PumpTotals, PumpTransaction

if TYPE_CHECKING:
    from .client import PTS2Client

PUMP_IDLE_STATUS = "PumpIdleStatus"
PUMP_FILLING_STATUS = "PumpFillingStatus"
PUMP_END_OF_TRANSACTION_STATUS = "PumpEndOfTransactionStatus"
PUMP_OFFLINE_STATUS = "PumpOfflineStatus"


class PumpsAPI:
    def __init__(self, client: "PTS2Client") -> None:
        self._client = client

    def get_status(self, pump_id: int) -> PumpStatus:
        data = self._client.request_data("PumpGetStatus", {"Pump": pump_id})
        return PumpStatus.model_validate(data or {"Pump": pump_id})

    def authorize(
        self,
        pump_id: int,
        nozzle: int | None = None,
        volume: float | None = None,
        amount: float | None = None,
        dose_type: str | None = None,
        dose: float | None = None,
        **extra: Any,
    ) -> Any:
        requested_presets = sum(value is not None for value in (volume, amount, dose))
        if requested_presets > 1:
            raise PTS2ValidationError("authorize accepts only one preset: volume, amount, or dose")
        data: dict[str, Any] = {"Pump": pump_id}
        if nozzle is not None:
            data["Nozzle"] = nozzle
        if volume is not None:
            data["Type"] = "Volume"
            data["Dose"] = volume
        if amount is not None:
            data["Type"] = "Amount"
            data["Dose"] = amount
        if dose is not None:
            if dose_type is None:
                raise PTS2ValidationError("dose_type is required when dose is provided")
            data["Type"] = dose_type
            data["Dose"] = dose
        data.update(extra)
        return self._client.request_data("PumpAuthorize", data)

    def authorize_volume(self, pump_id: int, nozzle: int, volume: float, **extra: Any) -> Any:
        return self.authorize(pump_id, nozzle=nozzle, volume=volume, **extra)

    def authorize_amount(self, pump_id: int, nozzle: int, amount: float, **extra: Any) -> Any:
        return self.authorize(pump_id, nozzle=nozzle, amount=amount, **extra)

    def authorize_free(self, pump_id: int, nozzle: int | None = None, **extra: Any) -> Any:
        return self.authorize(pump_id, nozzle=nozzle, **extra)

    def stop(self, pump_id: int) -> Any:
        return self._client.request_data("PumpStop", {"Pump": pump_id})

    def emergency_stop(self, pump_id: int) -> Any:
        return self._client.request_data("PumpEmergencyStop", {"Pump": pump_id})

    def emergency_stop_all(self) -> Any:
        return self.emergency_stop(0)

    def suspend(self, pump_id: int) -> Any:
        return self._client.request_data("PumpSuspend", {"Pump": pump_id})

    def resume(self, pump_id: int) -> Any:
        return self._client.request_data("PumpResume", {"Pump": pump_id})

    def get_totals(self, pump_id: int) -> PumpTotals:
        data = self._client.request_data("PumpGetTotals", {"Pump": pump_id})
        return PumpTotals.model_validate(data or {"Pump": pump_id})

    def get_prices(self, pump_id: int) -> Any:
        return self._client.request_data("PumpGetPrices", {"Pump": pump_id})

    def set_prices(self, pump_id: int, prices: Mapping[str, Any] | list[Any]) -> Any:
        return self._client.request_data("PumpSetPrices", {"Pump": pump_id, "Prices": prices})

    def get_transaction_information(self, pump_id: int) -> PumpTransaction:
        data = self._client.request_data("PumpGetTransactionInformation", {"Pump": pump_id})
        return PumpTransaction.model_validate(data or {"Pump": pump_id})

    def close_transaction(self, pump_id: int) -> Any:
        return self._client.request_data("PumpCloseTransaction", {"Pump": pump_id})

    def get_display_data(self, pump_id: int) -> Any:
        return self._client.request_data("PumpGetDisplayData", {"Pump": pump_id})

    def lock(self, pump_id: int) -> Any:
        return self._client.request_data("PumpLock", {"Pump": pump_id})

    def unlock(self, pump_id: int) -> Any:
        return self._client.request_data("PumpUnlock", {"Pump": pump_id})
