"""Pump control commands."""

from __future__ import annotations

import time
from collections.abc import Mapping
from typing import Any, TYPE_CHECKING

from .exceptions import PTS2TimeoutError, PTS2ValidationError
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
        packet = self._client.request("PumpGetStatus", {"Pump": pump_id})
        data = packet.data or {"Pump": pump_id}
        if isinstance(data, dict):
            data["Status"] = packet.type
        return PumpStatus.model_validate(data)

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
        if "Type" not in extra:
            extra["Type"] = "FullTank"
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

    def get_totals(
        self,
        pump_id: int,
        nozzle: int | None = None,
        fuel_grade_id: int | None = None,
        timeout: float = 3.0,
        poll_interval: float = 0.3,
    ) -> PumpTotals:
        """Requests total counters for a pump nozzle.

        Per the jsonPTS protocol, PumpGetTotals requires either "Nozzle" or
        "FuelGradeId" to identify which nozzle's totals are being requested,
        and only confirms that the controller accepted the request — the
        actual totals arrive asynchronously as a PumpTotals packet the next
        time PumpGetStatus is polled.
        """
        if nozzle is None and fuel_grade_id is None:
            nozzle = 1
        data: dict[str, Any] = {"Pump": pump_id}
        if nozzle is not None:
            data["Nozzle"] = nozzle
        if fuel_grade_id is not None:
            data["FuelGradeId"] = fuel_grade_id
        self._client.request("PumpGetTotals", data)
        deadline = time.monotonic() + timeout
        while True:
            packet = self._client.request("PumpGetStatus", {"Pump": pump_id})
            if packet.type == "PumpTotals":
                return PumpTotals.model_validate(packet.data or {"Pump": pump_id})
            if time.monotonic() >= deadline:
                raise PTS2TimeoutError(
                    f"Timed out waiting for pump {pump_id} to report totals"
                )
            time.sleep(poll_interval)

    def get_prices(self, pump_id: int, timeout: float = 3.0, poll_interval: float = 0.3) -> Any:
        """Requests pump nozzle prices.

        Per the jsonPTS protocol, PumpGetPrices only confirms that the
        controller accepted the request ("OK") — it does not carry the
        prices themselves. The controller reports the actual values
        asynchronously as a PumpPrices packet the next time PumpGetStatus
        is polled, so we send the request and then poll for it.
        """
        self._client.request("PumpGetPrices", {"Pump": pump_id})
        deadline = time.monotonic() + timeout
        while True:
            packet = self._client.request("PumpGetStatus", {"Pump": pump_id})
            if packet.type == "PumpPrices":
                data = packet.data if isinstance(packet.data, dict) else {}
                return {"Pump": pump_id, "NozzlePrices": data.get("Prices")}
            if time.monotonic() >= deadline:
                raise PTS2TimeoutError(
                    f"Timed out waiting for pump {pump_id} to report prices"
                )
            time.sleep(poll_interval)

    def set_prices(self, pump_id: int, prices: Mapping[str, Any] | list[Any]) -> Any:
        return self._client.request_data("PumpSetPrices", {"Pump": pump_id, "Prices": prices})

    def get_transaction_information(self, pump_id: int) -> PumpTransaction:
        data = self._client.request_data("PumpGetTransactionInformation", {"Pump": pump_id})
        return PumpTransaction.model_validate(data or {"Pump": pump_id})

    def close_transaction(self, pump_id: int) -> Any:
        return self._client.request_data("PumpCloseTransaction", {"Pump": pump_id})

    def get_display_data(
        self, pump_id: int, timeout: float = 3.0, poll_interval: float = 0.3
    ) -> Any:
        """Requests pump display data (dispensed volume/amount).

        Per the jsonPTS protocol, PumpGetDisplayData only confirms that the
        controller accepted the request; the actual data arrives
        asynchronously as a PumpDisplayData packet the next time
        PumpGetStatus is polled.
        """
        self._client.request("PumpGetDisplayData", {"Pump": pump_id})
        deadline = time.monotonic() + timeout
        while True:
            packet = self._client.request("PumpGetStatus", {"Pump": pump_id})
            if packet.type == "PumpDisplayData":
                return packet.data
            if time.monotonic() >= deadline:
                raise PTS2TimeoutError(
                    f"Timed out waiting for pump {pump_id} to report display data"
                )
            time.sleep(poll_interval)

    def lock(self, pump_id: int) -> Any:
        return self._client.request_data("PumpLock", {"Pump": pump_id})

    def unlock(self, pump_id: int) -> Any:
        return self._client.request_data("PumpUnlock", {"Pump": pump_id})
