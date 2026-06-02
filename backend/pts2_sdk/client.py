"""High-level PTS-2 client."""

from __future__ import annotations

import itertools
import logging
from collections.abc import Mapping, Sequence
from datetime import datetime
from typing import Any

from .configuration import ConfigurationAPI
from .exceptions import PTS2PacketError, PTS2ProtocolError, PTS2ValidationError
from .models.configuration import NetworkSettings
from .models.packets import PTS2Response, Packet
from .probes import ProbesAPI
from .pumps import PumpsAPI
from .reports import ReportsAPI
from .settings import Settings, configure_logging
from .tanks import TanksAPI
from .transport import PTS2Transport


class PTS2Client:
    """Client for Technotrade PTS-2 jsonPTS API."""

    def __init__(
        self,
        *,
        host: str,
        username: str = "admin",
        password: str = "admin",
        port: int | None = None,
        https: bool = False,
        auth_type: str = "basic",
        verify_ssl: bool = False,
        timeout: int | float = 10,
        retries: int = 3,
        endpoint: str = "/jsonPTS",
        transport: Any | None = None,
        reports_path: str = "reports/",
        export_format: str = "json",
    ) -> None:
        self.host = host
        self.port = int(port or (443 if https else 80))
        self.https = https
        self.username = username
        self.password = password
        self.auth_type = auth_type
        self.verify_ssl = verify_ssl
        self.reports_path = reports_path
        self.export_format = export_format
        self.logger = logging.getLogger("pts2_sdk.client")
        self._ids = itertools.count(1)
        self.transport = transport or PTS2Transport(
            host=host,
            port=self.port,
            https=https,
            username=username,
            password=password,
            auth_type=auth_type,
            verify_ssl=verify_ssl,
            timeout=timeout,
            retries=retries,
            endpoint=endpoint,
        )

        self.configuration = ConfigurationAPI(self)
        self.pumps = PumpsAPI(self)
        self.probes = ProbesAPI(self)
        self.tanks = TanksAPI(self)
        self.reports = ReportsAPI(self)

    @classmethod
    def from_env(cls) -> "PTS2Client":
        settings = Settings()
        configure_logging(settings)
        return cls.from_settings(settings)

    @classmethod
    def from_settings(cls, settings: Settings) -> "PTS2Client":
        return cls(
            host=settings.pts2_host,
            port=settings.pts2_port,
            username=settings.pts2_username,
            password=settings.pts2_password,
            https=settings.pts2_use_https,
            auth_type=settings.pts2_auth_type,
            verify_ssl=settings.pts2_verify_ssl,
            timeout=settings.pts2_timeout,
            retries=settings.pts2_retries,
            reports_path=settings.pts2_reports_path,
            export_format=settings.pts2_export_format,
        )

    def __enter__(self) -> "PTS2Client":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    def close(self) -> None:
        close = getattr(self.transport, "close", None)
        if callable(close):
            close()

    def next_packet_id(self) -> int:
        return next(self._ids)

    def packet(self, packet_type: str, data: Any | None = None, packet_id: int | str | None = None) -> Packet:
        return Packet.command(packet_type, data=data, packet_id=packet_id or self.next_packet_id())

    def send(self, packets: Packet | Mapping[str, Any] | Sequence[Packet | Mapping[str, Any]]) -> PTS2Response:
        packet_list = self._normalize_packets(packets)
        payload = {
            "Protocol": "jsonPTS",
            "Packets": packet_list,
        }
        raw_response = self.transport.post(payload)
        response = PTS2Response.from_payload(raw_response)
        self._raise_packet_errors(response)
        return response

    def request(self, packet_type: str, data: Any | None = None, packet_id: int | str | None = None) -> Packet:
        response = self.send(self.packet(packet_type, data=data, packet_id=packet_id))
        if not response.packets:
            raise PTS2ProtocolError("jsonPTS response contains no packets")
        return response.packets[0]

    def request_data(self, packet_type: str, data: Any | None = None, packet_id: int | str | None = None) -> Any:
        return self.request(packet_type, data=data, packet_id=packet_id).data

    def get_datetime(self) -> Any:
        return self.request_data("GetDateTime")

    def set_datetime(self, value: datetime | str | None = None) -> Any:
        if value is None:
            value = datetime.now()
        date_time = value.isoformat(timespec="seconds") if isinstance(value, datetime) else value
        return self.request_data("SetDateTime", {"DateTime": date_time})

    def get_network_settings(self) -> NetworkSettings:
        data = self.request_data("GetPtsNetworkSettings")
        return NetworkSettings.model_validate(data or {})

    def set_network_settings(self, settings: NetworkSettings | Mapping[str, Any]) -> Any:
        data = settings.to_dict() if isinstance(settings, NetworkSettings) else dict(settings)
        return self.request_data("SetPtsNetworkSettings", data)

    def restart(self) -> Any:
        return self.request_data("Restart")

    def healthcheck(self) -> dict[str, Any]:
        try:
            result = self.get_datetime()
        except Exception as exc:  # Intentionally broad: healthcheck should not raise.
            self.logger.warning("PTS-2 healthcheck failed: %s", exc)
            return {"ok": False, "error": str(exc)}
        return {"ok": True, "datetime": result}

    def websocket_client(self, *, path: str = "/jsonPTS", reconnect_seconds: int = 5) -> Any:
        from .websocket import PTS2WebSocketClient

        basic_auth = self.auth_type.strip().lower() == "basic"
        return PTS2WebSocketClient(
            host=self.host,
            port=self.port,
            https=self.https,
            path=path,
            username=self.username if basic_auth else None,
            password=self.password if basic_auth else None,
            reconnect_seconds=reconnect_seconds,
        )

    def _normalize_packets(
        self,
        packets: Packet | Mapping[str, Any] | Sequence[Packet | Mapping[str, Any]],
    ) -> list[dict[str, Any]]:
        if isinstance(packets, Packet) or isinstance(packets, Mapping):
            packets = [packets]

        normalized: list[dict[str, Any]] = []
        for packet in packets:
            if isinstance(packet, Packet):
                payload = packet.to_dict()
            elif isinstance(packet, Mapping):
                payload = dict(packet)
            else:
                raise PTS2ValidationError("packets must contain Packet instances or dictionaries")

            if "Type" not in payload:
                raise PTS2ValidationError("each packet must contain Type")
            payload.setdefault("Id", self.next_packet_id())
            normalized.append(payload)
        return normalized

    def _raise_packet_errors(self, response: PTS2Response) -> None:
        for packet in response.packets:
            if self._packet_is_error(packet):
                message = self._packet_error_message(packet)
                raise PTS2PacketError(message, packet=packet.to_dict())

    @staticmethod
    def _packet_is_error(packet: Packet) -> bool:
        if packet.error is not None:
            return True
        if packet.message and packet.message.strip().lower() == "error":
            return True
        if packet.type.strip().lower() in {"error", "packeterror", "responseerror"}:
            return True
        if isinstance(packet.data, Mapping):
            message = packet.data.get("Message")
            if isinstance(message, str) and message.strip().lower() == "error":
                return True
            return packet.data.get("Error") is not None
        return False

    @staticmethod
    def _packet_error_message(packet: Packet) -> str:
        parts = [f"jsonPTS packet {packet.id} ({packet.type}) returned an error"]
        data = packet.data if isinstance(packet.data, Mapping) else {}
        for key in ("Code", "Error", "Message", "Description"):
            value = getattr(packet, key.lower(), None) or data.get(key)
            if value not in (None, ""):
                parts.append(f"{key}: {value}")
        return " | ".join(parts)
