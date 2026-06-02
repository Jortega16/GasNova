"""Request and response schemas for the REST API."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ApiModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class HealthResponse(ApiModel):
    ok: bool
    pts2: dict[str, Any] | None = None
    error: str | None = None


class AuthorizeRequest(ApiModel):
    nozzle: int | None = Field(
        default=None,
        ge=1,
        examples=[1],
        description="Número de boquilla del surtidor para autorizar la venta.",
    )
    type: Literal["Volume", "Amount"] | None = Field(
        default=None,
        examples=["Volume"],
        description="Tipo de autorizacion: por volumen (Volume) o por monto (Amount).",
    )
    dose: float | None = Field(
        default=None,
        gt=0,
        examples=[20],
        description="Cantidad a autorizar: volumen en litros o monto en moneda local.",
    )

    @field_validator("dose")
    @classmethod
    def dose_requires_type(cls, value: float | None, info: Any) -> float | None:
        if value is not None and info.data.get("type") is None:
            raise ValueError("type is required when dose is provided")
        return value


class PriceItem(ApiModel):
    nozzle: int = Field(
        ge=1,
        serialization_alias="Nozzle",
        validation_alias="Nozzle",
        description="Boquilla para la que se ajusta el precio.",
    )
    price: float = Field(
        gt=0,
        serialization_alias="Price",
        validation_alias="Price",
        description="Precio por unidad que se enviará al PTS-2.",
    )


class SetPricesRequest(ApiModel):
    prices: list[PriceItem]


class ReportFilter(ApiModel):
    pump_id: int | None = Field(default=None, ge=1)
    tank_id: int | None = Field(default=None, ge=1)
    date_time_start: str | None = None
    date_time_end: str | None = None


class CommandResponse(ApiModel):
    ok: bool = True
    data: Any = None


class ErrorResponse(ApiModel):
    ok: bool = False
    error: str
    type: str
