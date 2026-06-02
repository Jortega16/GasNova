"""Tank-related models."""

from __future__ import annotations

from typing import Any

from pydantic import AliasChoices, Field

from .packets import JsonPTSModel


class TankMeasurement(JsonPTSModel):
    tank: int | None = Field(default=None, validation_alias=AliasChoices("Tank", "TankId", "TankID"))
    probe: int | None = Field(default=None, validation_alias=AliasChoices("Probe", "ProbeId", "ProbeID"))
    product_level: float | None = Field(default=None, validation_alias=AliasChoices("ProductLevel", "Level", "Height"))
    water_level: float | None = Field(default=None, validation_alias=AliasChoices("WaterLevel"))
    temperature: float | None = Field(default=None, validation_alias=AliasChoices("Temperature", "ProductTemperature"))
    product_volume: float | None = Field(default=None, validation_alias=AliasChoices("ProductVolume", "Volume"))
    water_volume: float | None = Field(default=None, validation_alias=AliasChoices("WaterVolume"))
    tc_volume: float | None = Field(default=None, validation_alias=AliasChoices("TCVolume", "TemperatureCompensatedVolume"))
    ullage: float | None = Field(default=None, validation_alias=AliasChoices("Ullage", "FreeVolume"))
    density: float | None = Field(default=None, validation_alias=AliasChoices("Density", "ProductDensity"))
    mass: float | None = Field(default=None, validation_alias=AliasChoices("Mass", "ProductMass"))
    date_time: str | None = Field(default=None, validation_alias=AliasChoices("DateTime", "Timestamp"))


class TankConfiguration(JsonPTSModel):
    tank: int | None = Field(default=None, validation_alias=AliasChoices("Tank", "TankId", "TankID"))
    name: str | None = Field(default=None, validation_alias=AliasChoices("Name", "TankName"))
    product: int | str | None = Field(default=None, validation_alias=AliasChoices("Product", "FuelGrade", "FuelGradeId"))
    capacity: float | None = Field(default=None, validation_alias=AliasChoices("Capacity", "Volume"))
    probe: int | None = Field(default=None, validation_alias=AliasChoices("Probe", "ProbeId", "ProbeID"))
    calibration_chart: Any | None = Field(
        default=None,
        validation_alias=AliasChoices("CalibrationChart", "Chart", "Calibration"),
    )
