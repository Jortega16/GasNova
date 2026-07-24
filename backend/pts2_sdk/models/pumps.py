"""Pump-related models."""

from __future__ import annotations

from typing import Any

from pydantic import AliasChoices, Field

from .packets import JsonPTSModel


class PumpStatus(JsonPTSModel):
    pump: int | None = Field(default=None, validation_alias=AliasChoices("Pump", "PumpId", "PumpID"))
    status: str | None = Field(default=None, validation_alias=AliasChoices("Status", "State"))
    nozzle: int | None = Field(default=None, validation_alias=AliasChoices("Nozzle", "NozzleId"))
    transaction: int | str | None = Field(default=None, validation_alias=AliasChoices("Transaction", "TransactionId"))
    volume: float | None = Field(default=None, validation_alias=AliasChoices("Volume", "Quantity"))
    amount: float | None = Field(default=None, validation_alias=AliasChoices("Amount", "Money"))
    price: float | None = Field(default=None, validation_alias=AliasChoices("Price", "UnitPrice"))


class PumpTotals(JsonPTSModel):
    pump: int | None = Field(default=None, validation_alias=AliasChoices("Pump", "PumpId", "PumpID"))
    nozzle: int | None = Field(default=None, validation_alias=AliasChoices("Nozzle", "NozzleId"))
    volume: float | None = Field(
        default=None,
        validation_alias=AliasChoices("Volume", "TotalVolume", "Quantity"),
    )
    amount: float | None = Field(
        default=None,
        validation_alias=AliasChoices("Amount", "TotalAmount", "Money"),
    )
    totals: Any | None = Field(default=None, validation_alias=AliasChoices("Totals", "Totalizers", "Counters"))


class PumpTransaction(JsonPTSModel):
    pump: int | None = Field(default=None, validation_alias=AliasChoices("Pump", "PumpId", "PumpID"))
    transaction: int | str | None = Field(default=None, validation_alias=AliasChoices("Transaction", "TransactionId", "Id"))
    nozzle: int | None = Field(default=None, validation_alias=AliasChoices("Nozzle", "NozzleId"))
    product: int | str | None = Field(default=None, validation_alias=AliasChoices("Product", "FuelGrade", "FuelGradeId"))
    volume: float | None = Field(default=None, validation_alias=AliasChoices("Volume", "Quantity"))
    amount: float | None = Field(default=None, validation_alias=AliasChoices("Amount", "Money"))
    price: float | None = Field(default=None, validation_alias=AliasChoices("Price", "UnitPrice"))
    date_time: str | None = Field(default=None, validation_alias=AliasChoices("DateTime", "Timestamp"))
