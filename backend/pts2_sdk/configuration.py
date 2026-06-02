"""Configuration commands for PTS-2."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TYPE_CHECKING

from .models.configuration import ConfigurationIdentifier, ParameterValue, RemoteServerConfiguration

if TYPE_CHECKING:
    from .client import PTS2Client


class ConfigurationAPI:
    def __init__(self, client: "PTS2Client") -> None:
        self._client = client

    def get_datetime(self) -> Any:
        return self._client.get_datetime()

    def set_datetime(self, value: Any = None) -> Any:
        return self._client.set_datetime(value)

    def get_network_settings(self) -> Any:
        return self._client.get_network_settings()

    def set_network_settings(self, settings: Mapping[str, Any]) -> Any:
        return self._client.set_network_settings(settings)

    def get_configuration_identifier(self) -> ConfigurationIdentifier:
        data = self._client.request_data("GetConfigurationIdentifier")
        return ConfigurationIdentifier.model_validate(data or {})

    def backup_configuration(self) -> Any:
        return self._client.request_data("BackupConfiguration")

    def restore_configuration(self, configuration: Mapping[str, Any] | str) -> Any:
        data: Any
        if isinstance(configuration, Mapping):
            data = dict(configuration)
        else:
            data = {"Configuration": configuration}
        return self._client.request_data("RestoreConfiguration", data)

    def get_remote_server_configuration(self) -> RemoteServerConfiguration:
        data = self._client.request_data("GetRemoteServerConfiguration")
        return RemoteServerConfiguration.model_validate(data or {})

    def set_remote_server_configuration(self, configuration: Mapping[str, Any] | RemoteServerConfiguration) -> Any:
        data = configuration.to_dict() if isinstance(configuration, RemoteServerConfiguration) else dict(configuration)
        return self._client.request_data("SetRemoteServerConfiguration", data)

    def get_parameter(self, parameter: str) -> ParameterValue:
        data = self._client.request_data("GetParameter", {"Parameter": parameter})
        if isinstance(data, Mapping):
            return ParameterValue.model_validate(data)
        return ParameterValue(parameter=parameter, value=data)

    def set_parameter(self, parameter: str, value: Any) -> Any:
        return self._client.request_data("SetParameter", {"Parameter": parameter, "Value": value})
