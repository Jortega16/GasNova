"""PTS-2 hardware configuration endpoints.

Covers the three-step process to map pumps (caras) and nozzles (mangueras):
  1. SetFuelGradesConfiguration  — define fuel products and prices
  2. SetPumpsConfiguration       — register pump addresses on RS-485 ports
  3. SetPumpNozzlesConfiguration — link each nozzle to a fuel grade and tank
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, field_validator

from pts2_sdk import PTS2Client

from ..dependencies import get_pts2_client
from ..schemas import CommandResponse

router = APIRouter(prefix="/configuration", tags=["configuration"])


def _close(client: PTS2Client) -> None:
    client.close()


# ─── Schemas ────────────────────────────────────────────────────────────────

class PortConfig(BaseModel):
    id: int = Field(ge=1, le=4, serialization_alias="Id", description="Puerto RS-485 físico (1–4).")
    protocol: int = Field(ge=1, le=99, serialization_alias="Protocol", description="Código de protocolo del fabricante de la bomba.")
    baud_rate: int = Field(ge=1, le=99, serialization_alias="BaudRate", description="Código de velocidad de comunicación.")

    class Config:
        populate_by_name = True


class PumpConfig(BaseModel):
    id: int = Field(ge=1, le=100, serialization_alias="Id", description="ID lógico de la cara/bomba (1–100).")
    port: int = Field(ge=1, le=4, serialization_alias="Port", description="Puerto RS-485 al que está conectada la cara.")
    address: int = Field(ge=1, le=99, serialization_alias="Address", description="Dirección física de comunicación de la bomba.")

    class Config:
        populate_by_name = True


class SetPumpsConfigRequest(BaseModel):
    ports: list[PortConfig] = Field(description="Configuración de puertos RS-485.")
    pumps: list[PumpConfig] = Field(description="Caras/bombas y su asignación a puerto y dirección.")


class FuelGradeConfig(BaseModel):
    id: int = Field(ge=1, le=10, serialization_alias="Id", description="ID del grado de combustible (1–10).")
    name: str = Field(max_length=20, serialization_alias="Name", description="Nombre del combustible (ej. Regular Unleaded).")
    price: float = Field(gt=0, serialization_alias="Price", description="Precio por unidad.")
    expansion_coefficient: float = Field(
        default=0.0,
        serialization_alias="ExpansionCoefficient",
        description="Coeficiente de expansión térmica a 15°C (ej. 0.00110 para gasolina, 0.00082 para diesel).",
    )
    blend_tank1_id: int | None = Field(default=None, serialization_alias="BlendTank1Id", description="Tanque 1 para mezcla (opcional).")
    blend_tank1_percentage: int | None = Field(default=None, ge=1, le=99, serialization_alias="BlendTank1Percentage", description="Porcentaje del tanque 1 en la mezcla.")
    blend_tank2_id: int | None = Field(default=None, serialization_alias="BlendTank2Id", description="Tanque 2 para mezcla (opcional).")

    class Config:
        populate_by_name = True


class SetFuelGradesConfigRequest(BaseModel):
    fuel_grades: list[FuelGradeConfig] = Field(description="Lista de grados de combustible a configurar.")


class FuelGradePrice(BaseModel):
    fuel_grade_id: int = Field(ge=1, le=10, serialization_alias="FuelGradeId", description="ID del grado de combustible.")
    price: float = Field(gt=0, serialization_alias="Price", description="Precio por unidad.")

    class Config:
        populate_by_name = True


class SetFuelGradesPricesRequest(BaseModel):
    fuel_grades_prices: list[FuelGradePrice] = Field(description="Precios a actualizar por grado de combustible.")


class PriceSchedule(BaseModel):
    id: int = Field(ge=1, le=10, serialization_alias="Id", description="ID del programa de precio (1–10, máximo 10 slots en el controlador).")
    enabled: bool = Field(default=True, serialization_alias="Enabled", description="Si el programa está activo.")
    fuel_grade_id: int = Field(ge=1, le=20, serialization_alias="FuelGradeId", description="ID del grado de combustible a programar.")
    price: float = Field(gt=0, serialization_alias="Price", description="Precio a aplicar en la fecha/hora programada.")
    date_time: str = Field(
        serialization_alias="DateTime",
        description="Fecha y hora en formato YYYY-MM-DDThh:mm:ss. Si se marca algún día de 'every_*', esta hora se repite ese día cada semana.",
    )
    every_monday: bool = Field(default=False, serialization_alias="EveryMonday")
    every_tuesday: bool = Field(default=False, serialization_alias="EveryTuesday")
    every_wednesday: bool = Field(default=False, serialization_alias="EveryWednesday")
    every_thursday: bool = Field(default=False, serialization_alias="EveryThursday")
    every_friday: bool = Field(default=False, serialization_alias="EveryFriday")
    every_saturday: bool = Field(default=False, serialization_alias="EverySaturday")
    every_sunday: bool = Field(default=False, serialization_alias="EverySunday")

    class Config:
        populate_by_name = True


class SetPricesSchedulerConfigRequest(BaseModel):
    price_schedules: list[PriceSchedule] = Field(description="Programas de precio (máximo 10 slots en el controlador PTS-2).")


class PumpNozzleConfig(BaseModel):
    pump_id: int = Field(ge=1, le=100, serialization_alias="PumpId", description="ID de la cara/bomba.")
    fuel_grade_ids: list[int] = Field(
        max_length=6,
        serialization_alias="FuelGradeIds",
        description=(
            "IDs de grado de combustible por boquilla. El índice 0 = manguera 1, índice 1 = manguera 2, etc. "
            "Máximo 6 mangueras por cara. Usar 0 para boquillas sin configurar."
        ),
    )
    tank_ids: list[int] | None = Field(
        default=None,
        max_length=6,
        serialization_alias="TankIds",
        description="IDs de tanque por boquilla (mismo orden que FuelGradeIds). Opcional.",
    )

    class Config:
        populate_by_name = True


class SetPumpNozzlesConfigRequest(BaseModel):
    pump_nozzles: list[PumpNozzleConfig] = Field(description="Configuración de mangueras por cara.")


# ─── Endpoints — Leer configuración actual ──────────────────────────────────

@router.get(
    "/pumps",
    response_model=CommandResponse,
    summary="Leer configuración de caras (GetPumpsConfiguration)",
    description=(
        "Retorna la configuración de puertos RS-485 y caras/bombas registradas en el PTS-2. "
        "Equivale al comando **GetPumpsConfiguration** del protocolo jsonPTS (cmd #48)."
    ),
)
def get_pumps_configuration(client: PTS2Client = Depends(get_pts2_client)) -> CommandResponse:
    try:
        data = client.request_data("GetPumpsConfiguration", None)
        return CommandResponse(data=data)
    finally:
        _close(client)


@router.get(
    "/fuel-grades",
    response_model=CommandResponse,
    summary="Leer configuración de combustibles (GetFuelGradesConfiguration)",
    description=(
        "Retorna los grados de combustible configurados en el PTS-2 con nombre, precio y coeficiente de expansión. "
        "Equivale al comando **GetFuelGradesConfiguration** del protocolo jsonPTS (cmd #57)."
    ),
)
def get_fuel_grades_configuration(client: PTS2Client = Depends(get_pts2_client)) -> CommandResponse:
    try:
        data = client.request_data("GetFuelGradesConfiguration", None)
        return CommandResponse(data=data)
    finally:
        _close(client)


@router.get(
    "/fuel-grades/prices",
    response_model=CommandResponse,
    summary="Leer precios globales de combustibles (GetFuelGradesPrices)",
    description=(
        "Retorna la tabla de precios globales por grado de combustible del PTS-2. "
        "Equivale al comando **GetFuelGradesPrices** del protocolo jsonPTS (cmd #54)."
    ),
)
def get_fuel_grades_prices(client: PTS2Client = Depends(get_pts2_client)) -> CommandResponse:
    try:
        data = client.request_data("GetFuelGradesPrices", None)
        return CommandResponse(data=data)
    finally:
        _close(client)


@router.get(
    "/prices-scheduler",
    response_model=CommandResponse,
    summary="Leer programación de precios nativa del PTS-2 (GetPricesSchedulerConfiguration)",
    description=(
        "Retorna los programas de cambio de precio configurados directamente en el controlador PTS-2. "
        "A diferencia del programador propio de GasNova (basado en base de datos), estos programas los "
        "aplica el controlador por sí mismo, incluso si el backend está apagado. "
        "Equivale al comando **GetPricesSchedulerConfiguration** del protocolo jsonPTS (cmd #60)."
    ),
)
def get_prices_scheduler_configuration(client: PTS2Client = Depends(get_pts2_client)) -> CommandResponse:
    try:
        data = client.request_data("GetPricesSchedulerConfiguration", None)
        return CommandResponse(data=data)
    finally:
        _close(client)


@router.get(
    "/nozzles",
    response_model=CommandResponse,
    summary="Leer configuración de mangueras (GetPumpNozzlesConfiguration)",
    description=(
        "Retorna la asignación de mangueras a grados de combustible y tanques para todas las caras. "
        "Equivale al comando **GetPumpNozzlesConfiguration** del protocolo jsonPTS (cmd #66)."
    ),
)
def get_pump_nozzles_configuration(client: PTS2Client = Depends(get_pts2_client)) -> CommandResponse:
    try:
        data = client.request_data("GetPumpNozzlesConfiguration", None)
        return CommandResponse(data=data)
    finally:
        _close(client)


# ─── Endpoints — Escribir configuración ─────────────────────────────────────

@router.post(
    "/pumps",
    response_model=CommandResponse,
    summary="Configurar caras en el PTS-2 (SetPumpsConfiguration)",
    description=(
        "**Paso 2** del proceso de mapeo. Registra las caras/bombas en el controlador PTS-2 "
        "especificando su puerto RS-485 y dirección física. "
        "Equivale al comando **SetPumpsConfiguration** del protocolo jsonPTS (cmd #49). "
        "Requiere permiso **Configuration** en el PTS-2. "
        "⚠️ Las caras ausentes en el array quedan con configuración en cero."
    ),
)
def set_pumps_configuration(
    request: SetPumpsConfigRequest,
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    try:
        payload: dict[str, Any] = {
            "Ports": [
                {"Id": p.id, "Protocol": p.protocol, "BaudRate": p.baud_rate}
                for p in request.ports
            ],
            "Pumps": [
                {"Id": p.id, "Port": p.port, "Address": p.address}
                for p in request.pumps
            ],
        }
        data = client.request_data("SetPumpsConfiguration", payload)
        return CommandResponse(data=data)
    finally:
        _close(client)


@router.post(
    "/fuel-grades",
    response_model=CommandResponse,
    summary="Configurar grados de combustible (SetFuelGradesConfiguration)",
    description=(
        "**Paso 1** del proceso de mapeo. Define los combustibles disponibles en el PTS-2 "
        "(nombre, precio y coeficiente de expansión térmica). "
        "Equivale al comando **SetFuelGradesConfiguration** del protocolo jsonPTS (cmd #58). "
        "Requiere permiso **Configuration** en el PTS-2. "
        "⚠️ Los grados ausentes en el array quedan con configuración en cero."
    ),
)
def set_fuel_grades_configuration(
    request: SetFuelGradesConfigRequest,
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    try:
        grades: list[dict[str, Any]] = []
        for fg in request.fuel_grades:
            obj: dict[str, Any] = {
                "Id": fg.id,
                "Name": fg.name,
                "Price": fg.price,
                "ExpansionCoefficient": fg.expansion_coefficient,
            }
            if fg.blend_tank1_id is not None:
                obj["BlendTank1Id"] = fg.blend_tank1_id
            if fg.blend_tank1_percentage is not None:
                obj["BlendTank1Percentage"] = fg.blend_tank1_percentage
            if fg.blend_tank2_id is not None:
                obj["BlendTank2Id"] = fg.blend_tank2_id
            grades.append(obj)

        data = client.request_data("SetFuelGradesConfiguration", {"FuelGrades": grades})
        return CommandResponse(data=data)
    finally:
        _close(client)


@router.put(
    "/fuel-grades/prices",
    response_model=CommandResponse,
    summary="Actualizar precios globales de combustibles (SetFuelGradesPrices)",
    description=(
        "Actualiza solo los precios globales por grado de combustible en el PTS-2 sin tocar el resto de la configuración. "
        "Equivale al comando **SetFuelGradesPrices** del protocolo jsonPTS (cmd #55). "
        "Requiere permiso **Configuration** o **Control** en el PTS-2."
    ),
)
def set_fuel_grades_prices(
    request: SetFuelGradesPricesRequest,
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    try:
        payload = {
            "FuelGradesPrices": [
                {"FuelGradeId": fp.fuel_grade_id, "Price": fp.price}
                for fp in request.fuel_grades_prices
            ]
        }
        data = client.request_data("SetFuelGradesPrices", payload)
        return CommandResponse(data=data)
    finally:
        _close(client)


@router.put(
    "/prices-scheduler",
    response_model=CommandResponse,
    summary="Programar cambios de precio en el controlador PTS-2 (SetPricesSchedulerConfiguration)",
    description=(
        "Define hasta 10 programas de cambio de precio directamente en el controlador PTS-2 — el propio "
        "controlador aplica el cambio en la fecha/hora indicada, incluso si el backend/Docker está apagado. "
        "Soporta repetición semanal marcando los días de la semana (every_monday, etc.); sin ningún día "
        "marcado, el cambio se aplica una sola vez. "
        "Equivale al comando **SetPricesSchedulerConfiguration** del protocolo jsonPTS (cmd #61). "
        "Requiere permiso **Configuration** en el PTS-2. "
        "⚠️ Los slots (Id 1-10) ausentes en el array quedan deshabilitados/en cero."
    ),
)
def set_prices_scheduler_configuration(
    request: SetPricesSchedulerConfigRequest,
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    try:
        schedules = [
            {
                "Id": s.id,
                "Enabled": s.enabled,
                "FuelGradeId": s.fuel_grade_id,
                "Price": s.price,
                "DateTime": s.date_time,
                "EveryMonday": s.every_monday,
                "EveryTuesday": s.every_tuesday,
                "EveryWednesday": s.every_wednesday,
                "EveryThursday": s.every_thursday,
                "EveryFriday": s.every_friday,
                "EverySaturday": s.every_saturday,
                "EverySunday": s.every_sunday,
            }
            for s in request.price_schedules
        ]
        data = client.request_data("SetPricesSchedulerConfiguration", {"PriceSchedules": schedules})
        return CommandResponse(data=data)
    finally:
        _close(client)


@router.post(
    "/nozzles",
    response_model=CommandResponse,
    summary="Configurar mangueras por cara (SetPumpNozzlesConfiguration)",
    description=(
        "**Paso 3** del proceso de mapeo. Asigna cada manguera de cada cara a un grado de combustible y un tanque. "
        "El orden del array **FuelGradeIds** define la manguera: índice 0 = manguera 1, índice 1 = manguera 2, etc. "
        "Máximo 6 mangueras por cara. "
        "Equivale al comando **SetPumpNozzlesConfiguration** del protocolo jsonPTS (cmd #67). "
        "Requiere permiso **Configuration** en el PTS-2. "
        "⚠️ Las caras ausentes en el array quedan con configuración en cero."
    ),
)
def set_pump_nozzles_configuration(
    request: SetPumpNozzlesConfigRequest,
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    try:
        nozzles: list[dict[str, Any]] = []
        for pn in request.pump_nozzles:
            obj: dict[str, Any] = {
                "PumpId": pn.pump_id,
                "FuelGradeIds": pn.fuel_grade_ids,
            }
            if pn.tank_ids is not None:
                obj["TankIds"] = pn.tank_ids
            nozzles.append(obj)

        data = client.request_data("SetPumpNozzlesConfiguration", {"PumpNozzles": nozzles})
        return CommandResponse(data=data)
    finally:
        _close(client)


@router.post(
    "/setup",
    response_model=CommandResponse,
    summary="Configuración completa en un solo llamado (3 pasos)",
    description=(
        "Ejecuta los 3 pasos de mapeo en una sola operación y en el orden correcto: "
        "1) **SetFuelGradesConfiguration**, "
        "2) **SetPumpsConfiguration**, "
        "3) **SetPumpNozzlesConfiguration**. "
        "Útil para configuración inicial o reconfiguración completa de la estación. "
        "Requiere permiso **Configuration** en el PTS-2."
    ),
)
def full_setup(
    fuel_grades: SetFuelGradesConfigRequest,
    pumps: SetPumpsConfigRequest,
    nozzles: SetPumpNozzlesConfigRequest,
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    results: dict[str, Any] = {}
    try:
        grades_payload: list[dict[str, Any]] = []
        for fg in fuel_grades.fuel_grades:
            obj: dict[str, Any] = {
                "Id": fg.id, "Name": fg.name,
                "Price": fg.price, "ExpansionCoefficient": fg.expansion_coefficient,
            }
            if fg.blend_tank1_id is not None:
                obj["BlendTank1Id"] = fg.blend_tank1_id
            if fg.blend_tank1_percentage is not None:
                obj["BlendTank1Percentage"] = fg.blend_tank1_percentage
            if fg.blend_tank2_id is not None:
                obj["BlendTank2Id"] = fg.blend_tank2_id
            grades_payload.append(obj)
        results["step1_fuel_grades"] = client.request_data(
            "SetFuelGradesConfiguration", {"FuelGrades": grades_payload}
        )

        pumps_payload: dict[str, Any] = {
            "Ports": [{"Id": p.id, "Protocol": p.protocol, "BaudRate": p.baud_rate} for p in pumps.ports],
            "Pumps": [{"Id": p.id, "Port": p.port, "Address": p.address} for p in pumps.pumps],
        }
        results["step2_pumps"] = client.request_data("SetPumpsConfiguration", pumps_payload)

        nozzles_payload: list[dict[str, Any]] = []
        for pn in nozzles.pump_nozzles:
            obj2: dict[str, Any] = {"PumpId": pn.pump_id, "FuelGradeIds": pn.fuel_grade_ids}
            if pn.tank_ids is not None:
                obj2["TankIds"] = pn.tank_ids
            nozzles_payload.append(obj2)
        results["step3_nozzles"] = client.request_data(
            "SetPumpNozzlesConfiguration", {"PumpNozzles": nozzles_payload}
        )

        return CommandResponse(data=results)
    finally:
        _close(client)


# ─── Endpoints — Canal de datos en vivo (RemoteServerConfiguration) ─────────

class SetLiveRefreshRateRequest(BaseModel):
    websockets_period_seconds: int = Field(
        ge=1, le=3600,
        description=(
            "'WebsocketsUploadStatusRequestsPeriodSeconds' (jsonPTS): cada cuánto el "
            "PTS-2 empuja UploadStatus (Volume/Amount en vivo de un despacho) por "
            "WebSocket. Bajarlo refresca el monto y litraje en pantalla más rápido."
        ),
    )
    http_period_seconds: int | None = Field(
        default=None, ge=1, le=3600,
        description=(
            "'UploadStatusRequestsPeriodSeconds': mismo período pero para el canal "
            "HTTP de respaldo (no-WebSocket). Opcional — solo aplica si el "
            "controlador tiene ese canal habilitado además del WebSocket."
        ),
    )


class SetRemoteServerConnectionRequest(BaseModel):
    ip_address: str | None = Field(
        default=None,
        description=(
            "IP del servidor GasNova (backend/nginx) en formato 'a.b.c.d', alcanzable "
            "desde la red del PTS-2. Se traduce a 'IpAddress' (lista de 4 octetos). "
            "Deja vacío si usas 'domain_name' en su lugar."
        ),
    )
    domain_name: str | None = Field(
        default=None,
        description=(
            "Dominio del servidor GasNova, en vez de IP fija ('DomainName'). Si se "
            "envía, 'ip_address' se limpia a 0.0.0.0 (el protocolo usa uno u otro)."
        ),
    )
    websockets_port: int = Field(
        ge=1, le=65535,
        description=(
            "'WebsocketsPort': puerto donde el PTS-2 debe abrir el WebSocket saliente. "
            "Usar 80/443 si nginx está levantado (proxy con headers de upgrade en "
            "frontend/nginx.conf); si solo corre el backend suelto, usar su puerto "
            "expuesto por Docker (p.ej. 8002)."
        ),
    )
    websockets_uri: str = Field(
        default="ptsWebSocket",
        description="'WebsocketsUri': ruta del WebSocket. Coincide con /ptsWebSocket del backend.",
    )
    use_websockets_communication: bool = Field(
        default=True,
        description="'UseWebsocketsCommunication': habilita el canal WebSocket saliente del PTS-2.",
    )

    @field_validator("ip_address")
    @classmethod
    def _validate_ip(cls, value: str | None) -> str | None:
        if value is None:
            return value
        parts = value.split(".")
        if len(parts) != 4 or not all(p.isdigit() and 0 <= int(p) <= 255 for p in parts):
            raise ValueError("ip_address debe tener formato 'a.b.c.d' con octetos 0-255")
        return value


@router.get(
    "/remote-server",
    response_model=CommandResponse,
    summary="Leer configuración del canal de datos (GetRemoteServerConfiguration)",
    description=(
        "Retorna la configuración completa de conexión al servidor remoto, incluyendo "
        "los períodos de empuje de estado en vivo por WebSocket/HTTP. "
        "Equivale al comando **GetRemoteServerConfiguration** del protocolo jsonPTS (cmd #35)."
    ),
)
def get_remote_server_configuration(client: PTS2Client = Depends(get_pts2_client)) -> CommandResponse:
    try:
        data = client.request_data("GetRemoteServerConfiguration", None)
        return CommandResponse(data=data)
    finally:
        _close(client)


@router.put(
    "/remote-server/refresh-rate",
    response_model=CommandResponse,
    summary="Ajustar la frecuencia de refresco en vivo (monto/litraje durante un despacho)",
    description=(
        "Cambia únicamente 'WebsocketsUploadStatusRequestsPeriodSeconds' (y opcionalmente "
        "su equivalente HTTP), dejando el resto de la configuración del canal remoto "
        "intacta: primero lee la configuración vigente (**GetRemoteServerConfiguration**) "
        "y la reenvía completa con solo esos campos cambiados (**SetRemoteServerConfiguration**, "
        "cmd #36) — mandar el período suelto sin el resto de campos borraría URIs y flags "
        "de subida ya configurados en el controlador. Rango válido: 1–3600 segundos."
    ),
)
def set_live_refresh_rate(
    request: SetLiveRefreshRateRequest,
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    try:
        current = client.request_data("GetRemoteServerConfiguration", None)
        payload: dict[str, Any] = dict(current) if isinstance(current, dict) else {}
        payload["WebsocketsUploadStatusRequestsPeriodSeconds"] = request.websockets_period_seconds
        if request.http_period_seconds is not None:
            payload["UploadStatusRequestsPeriodSeconds"] = request.http_period_seconds
        data = client.request_data("SetRemoteServerConfiguration", payload)
        return CommandResponse(data={
            "applied": data,
            "websockets_period_seconds": request.websockets_period_seconds,
            "http_period_seconds": request.http_period_seconds,
        })
    finally:
        _close(client)


@router.put(
    "/remote-server/connection",
    response_model=CommandResponse,
    summary="Configurar a dónde/cómo se conecta el PTS-2 por WebSocket (push en vivo)",
    description=(
        "Cambia 'IpAddress'/'DomainName'/'WebsocketsPort'/'WebsocketsUri'/"
        "'UseWebsocketsCommunication', dejando el resto de la configuración del canal "
        "remoto intacta (read-merge-write igual que /refresh-rate). Sin un destino "
        "válido aquí, el PTS-2 nunca abre el WebSocket entrante — el sistema queda "
        "funcionando solo con el heartbeat de polling (hasta 10s de retraso en vez "
        "de push instantáneo). Responde con 'IsWebsocketsCommunicationSuccessful' / "
        "'IsConnectionSuccessful' del propio PTS-2 tras aplicar, para verificar en el momento."
    ),
)
def set_remote_server_connection(
    request: SetRemoteServerConnectionRequest,
    client: PTS2Client = Depends(get_pts2_client),
) -> CommandResponse:
    try:
        current = client.request_data("GetRemoteServerConfiguration", None)
        payload: dict[str, Any] = dict(current) if isinstance(current, dict) else {}

        if request.domain_name:
            payload["DomainName"] = request.domain_name
            payload["IpAddress"] = [0, 0, 0, 0]
        elif request.ip_address:
            payload["IpAddress"] = [int(p) for p in request.ip_address.split(".")]
            payload["DomainName"] = ""

        payload["WebsocketsPort"] = request.websockets_port
        payload["WebsocketsUri"] = request.websockets_uri
        payload["UseWebsocketsCommunication"] = request.use_websockets_communication

        client.request_data("SetRemoteServerConfiguration", payload)
        verify = client.request_data("GetRemoteServerConfiguration", None)
        return CommandResponse(data={
            "applied": {
                "ip_address": request.ip_address,
                "domain_name": request.domain_name,
                "websockets_port": request.websockets_port,
                "websockets_uri": request.websockets_uri,
            },
            "is_websockets_communication_successful": (
                verify.get("IsWebsocketsCommunicationSuccessful") if isinstance(verify, dict) else None
            ),
            "is_connection_successful": (
                verify.get("IsConnectionSuccessful") if isinstance(verify, dict) else None
            ),
        })
    finally:
        _close(client)
