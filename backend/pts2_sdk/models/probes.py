"""Probe-related models."""

from __future__ import annotations

from pydantic import AliasChoices, Field

from .packets import JsonPTSModel


class ProbeMeasurement(JsonPTSModel):
    probe: int | None = Field(default=None, validation_alias=AliasChoices("Probe", "ProbeId", "ProbeID"))
    tank: int | None = Field(default=None, validation_alias=AliasChoices("Tank", "TankId", "TankID"))
    product_level: float | None = Field(default=None, validation_alias=AliasChoices("ProductLevel", "Level", "Height"))
    water_level: float | None = Field(default=None, validation_alias=AliasChoices("WaterLevel"))
    temperature: float | None = Field(default=None, validation_alias=AliasChoices("Temperature", "ProductTemperature"))
    product_volume: float | None = Field(default=None, validation_alias=AliasChoices("ProductVolume", "Volume"))
    water_volume: float | None = Field(default=None, validation_alias=AliasChoices("WaterVolume"))
    ullage: float | None = Field(default=None, validation_alias=AliasChoices("Ullage", "FreeVolume"))
    density: float | None = Field(default=None, validation_alias=AliasChoices("Density", "ProductDensity"))
    mass: float | None = Field(default=None, validation_alias=AliasChoices("Mass", "ProductMass"))
    date_time: str | None = Field(default=None, validation_alias=AliasChoices("DateTime", "Timestamp"))
