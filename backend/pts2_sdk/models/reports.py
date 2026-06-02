"""Report models."""

from __future__ import annotations

from typing import Any

from pydantic import AliasChoices, Field

from .packets import JsonPTSModel


class AlertRecord(JsonPTSModel):
    id: int | str | None = Field(default=None, validation_alias=AliasChoices("Id", "RecordId"))
    type: str | None = Field(default=None, validation_alias=AliasChoices("Type", "AlertType"))
    message: str | None = Field(default=None, validation_alias=AliasChoices("Message", "Description"))
    source: str | None = Field(default=None, validation_alias=AliasChoices("Source", "Device"))
    date_time: str | None = Field(default=None, validation_alias=AliasChoices("DateTime", "Timestamp"))


class GpsRecord(JsonPTSModel):
    id: int | str | None = Field(default=None, validation_alias=AliasChoices("Id", "RecordId"))
    latitude: float | None = Field(default=None, validation_alias=AliasChoices("Latitude", "Lat"))
    longitude: float | None = Field(default=None, validation_alias=AliasChoices("Longitude", "Lon", "Lng"))
    speed: float | None = Field(default=None, validation_alias=AliasChoices("Speed", "Velocity"))
    date_time: str | None = Field(default=None, validation_alias=AliasChoices("DateTime", "Timestamp"))
    raw: dict[str, Any] | None = None
