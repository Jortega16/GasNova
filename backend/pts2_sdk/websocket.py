"""Optional WebSocket client for remote monitoring integrations."""

from __future__ import annotations

import base64
import json
import logging
import time
from collections.abc import Callable, Mapping
from typing import Any

from .exceptions import PTS2ConnectionError, PTS2ValidationError


class PTS2WebSocketClient:
    """Small wrapper around websocket-client for jsonPTS WebSocket payloads."""

    def __init__(
        self,
        *,
        host: str,
        port: int | None = None,
        https: bool = False,
        path: str = "/jsonPTS",
        username: str | None = None,
        password: str | None = None,
        reconnect_seconds: int = 5,
        headers: dict[str, str] | None = None,
        on_message: Callable[[Any], None] | None = None,
    ) -> None:
        self.host = host
        self.port = port or (443 if https else 80)
        self.https = https
        self.path = path if path.startswith("/") else f"/{path}"
        self.reconnect_seconds = reconnect_seconds
        self.headers = headers or {}
        self.on_message = on_message
        self.logger = logging.getLogger("pts2_sdk.websocket")
        self.ws: Any | None = None

        if username is not None and password is not None:
            token = base64.b64encode(f"{username}:{password}".encode("utf-8")).decode("ascii")
            self.headers.setdefault("Authorization", f"Basic {token}")

    @property
    def url(self) -> str:
        scheme = "wss" if self.https else "ws"
        return f"{scheme}://{self.host}:{self.port}{self.path}"

    def connect(self) -> None:
        try:
            import websocket
        except ImportError as exc:
            raise PTS2ValidationError("Install websocket-client or pts2-sdk[websocket] to use WebSocket") from exc

        self.ws = websocket.WebSocket()
        header_lines = [f"{key}: {value}" for key, value in self.headers.items()]
        try:
            self.ws.connect(self.url, header=header_lines)
        except Exception as exc:
            raise PTS2ConnectionError(f"Unable to connect WebSocket {self.url}: {exc}") from exc

    def send(self, payload: Mapping[str, Any]) -> None:
        if self.ws is None:
            self.connect()
        self.ws.send(json.dumps(dict(payload)))

    def receive(self) -> Any:
        if self.ws is None:
            self.connect()
        message = self.ws.recv()
        try:
            return json.loads(message)
        except ValueError:
            return message

    def run_forever(self) -> None:
        while True:
            try:
                if self.ws is None:
                    self.connect()
                message = self.receive()
                if self.on_message:
                    self.on_message(message)
            except KeyboardInterrupt:
                raise
            except Exception as exc:
                self.logger.error("WebSocket error: %s", exc)
                self.close()
                time.sleep(self.reconnect_seconds)

    def close(self) -> None:
        if self.ws is not None:
            self.ws.close()
            self.ws = None
