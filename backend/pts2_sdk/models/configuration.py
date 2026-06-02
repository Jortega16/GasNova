"""Configuration-related models."""

from __future__ import annotations

from typing import Any

from pydantic import AliasChoices, Field, field_validator

from .packets import JsonPTSModel


class NetworkSettings(JsonPTSModel):
    ip_address: str | None = Field(
        default=None,
        validation_alias=AliasChoices("IpAddress", "IPAddress", "IP", "Address"),
        serialization_alias="IpAddress",
    )
    netmask: str | None = Field(default=None, validation_alias=AliasChoices("Netmask", "NetMask", "SubnetMask"))
    gateway: str | None = Field(default=None, validation_alias=AliasChoices("Gateway", "DefaultGateway"))
    dns1: str | None = Field(default=None, validation_alias=AliasChoices("Dns1", "DNS1", "PrimaryDns"))
    dns2: str | None = Field(default=None, validation_alias=AliasChoices("Dns2", "DNS2", "SecondaryDns"))
    dhcp: bool | None = Field(default=None, validation_alias=AliasChoices("Dhcp", "DHCP"))
    mac_address: str | None = Field(default=None, validation_alias=AliasChoices("MacAddress", "MACAddress", "MAC"))

    @field_validator("ip_address", "netmask", "gateway", "dns1", "dns2", mode="before")
    @classmethod
    def normalize_ipv4(cls, value: Any) -> Any:
        if isinstance(value, list) and len(value) == 4:
            return ".".join(str(part) for part in value)
        return value

    @field_validator("mac_address", mode="before")
    @classmethod
    def normalize_mac(cls, value: Any) -> Any:
        if isinstance(value, list):
            return ":".join(f"{int(part):02x}" for part in value)
        return value


class ConfigurationIdentifier(JsonPTSModel):
    identifier: str | None = Field(
        default=None,
        validation_alias=AliasChoices("Identifier", "ConfigurationIdentifier", "Id"),
        serialization_alias="Identifier",
    )
    date_time: str | None = Field(default=None, validation_alias=AliasChoices("DateTime", "Timestamp"))


class RemoteServerConfiguration(JsonPTSModel):
    enabled: bool | None = Field(default=None, validation_alias=AliasChoices("Enabled", "IsEnabled"))
    url: str | None = Field(default=None, validation_alias=AliasChoices("Url", "URL", "ServerUrl"))
    host: str | None = Field(default=None, validation_alias=AliasChoices("Host", "ServerHost"))
    port: int | None = Field(default=None, validation_alias=AliasChoices("Port", "ServerPort"))
    protocol: str | None = Field(default=None, validation_alias=AliasChoices("Protocol", "Scheme"))
    extra: dict[str, Any] | None = None


class ParameterValue(JsonPTSModel):
    parameter: str | None = Field(default=None, validation_alias=AliasChoices("Parameter", "Name", "Path"))
    value: Any | None = Field(default=None, validation_alias=AliasChoices("Value", "Data"))
