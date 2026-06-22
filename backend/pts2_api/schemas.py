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


class PostpayAuthorizeRequest(ApiModel):
    nozzle: int = Field(ge=1, description="Número de boquilla del surtidor para autorizar en modo postpago.")


class UserCreate(ApiModel):
    username: str
    name: str
    role: str
    avatar: str | None = None
    pin: str
    status: str = "Active"


class UserResponse(ApiModel):
    id: str
    username: str
    name: str
    role: str
    avatar: str | None = None
    status: str


class LoginRequest(ApiModel):
    username: str
    pin: str


class ShiftCreate(ApiModel):
    shift_id: str
    operator_name: str
    start_time: str | None = None
    end_time: str | None = None
    status: str = "Active"


class ShiftResponse(ApiModel):
    id: int
    shift_id: str
    operator_name: str
    start_time: str | None = None
    end_time: str | None = None
    status: str


class TransactionCreate(ApiModel):
    transaction_id: int
    nozzle: int | None = None
    volume: float
    amount: float
    unit_price: float | None = None
    payment_type: str = "Cash"
    status: str = "Completed"


class DeliveryCreate(ApiModel):
    volume: float
    product_code: str | None = None
    driver_name: str | None = None
    truck_number: str | None = None
    notes: str | None = None


class ScheduledPriceCreate(ApiModel):
    id: str = Field(description="Identificador único de la programación (ej. SP-001).")
    date_time: str = Field(description="Fecha y hora de ejecución (formato: YYYY-MM-DD HH:MM).")
    fuel_type: str = Field(description="Tipo de combustible a actualizar.")
    new_price: float = Field(gt=0, description="Nuevo precio por galón.")


class ScheduledPriceResponse(ApiModel):
    id: str
    date_time: str
    fuel_type: str
    new_price: float
    status: str


class PumpAuthorizeBody(ApiModel):
    pump: int = Field(ge=1, description="ID del surtidor a autorizar.")
    nozzle: int | None = Field(default=None, ge=1)
    type: str = Field(default="FullTank", description="FullTank, Volume, Amount")
    dose: float | None = Field(default=None, gt=0)
    price: float | None = Field(default=None, gt=0)
    tag: str | None = None


class PumpActionBody(ApiModel):
    pump: int = Field(ge=1, description="ID del surtidor.")


class PumpStatusItem(ApiModel):
    """Estado real de una bomba devuelto por el PTS-2."""
    pump: int = Field(description="ID del surtidor.")
    status_type: str = Field(description="Tipo de estado jsonPTS (PumpIdleStatus, PumpFillingStatus, etc.).")
    nozzle: int | None = Field(default=None, description="Boquilla activa.")
    fuel_grade_id: int | None = Field(default=None, description="ID del grado de combustible.")
    fuel_grade_name: str | None = Field(default=None, description="Nombre del grado de combustible.")
    volume: float | None = Field(default=None, description="Volumen despachado en la transacción activa.")
    amount: float | None = Field(default=None, description="Monto despachado en la transacción activa.")
    price: float | None = Field(default=None, description="Precio por unidad del combustible activo.")
    transaction: int | None = Field(default=None, description="ID de la transacción activa en el PTS-2.")
    nozzle_prices: list[float] | None = Field(default=None, description="Lista de precios por boquilla.")
    last_volume: float | None = Field(default=None, description="Volumen de la última transacción.")
    last_amount: float | None = Field(default=None, description="Monto de la última transacción.")
    last_transaction: int | None = Field(default=None, description="ID de la última transacción.")
    error: str | None = Field(default=None, description="Error al consultar esta bomba (si aplica).")


class PumpsStatusAllResponse(ApiModel):
    """Respuesta del endpoint /pumps/status-all."""
    pumps: list[PumpStatusItem]


class PendingTransactionCreate(ApiModel):
    trx_id: str
    nozzle: int
    volume: float
    amount: float
    fuel_type: str

