"""Domain exceptions raised by the PTS-2 SDK."""

from __future__ import annotations

from typing import Any


class PTS2Error(Exception):
    """Base exception for every SDK-level error."""


class PTS2ConnectionError(PTS2Error):
    """Raised when the controller cannot be reached."""


class PTS2AuthenticationError(PTS2Error):
    """Raised when HTTP authentication fails."""


class PTS2TimeoutError(PTS2ConnectionError):
    """Raised when a request times out."""


class PTS2ProtocolError(PTS2Error):
    """Raised when the HTTP response is not valid jsonPTS."""


class PTS2ResponseError(PTS2Error):
    """Raised for HTTP or controller response errors."""

    def __init__(self, message: str, *, status_code: int | None = None, response: Any = None) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.response = response


class PTS2PacketError(PTS2ResponseError):
    """Raised when a jsonPTS packet reports an error."""

    def __init__(self, message: str, *, packet: Any = None) -> None:
        super().__init__(message)
        self.packet = packet


class PTS2ValidationError(PTS2Error):
    """Raised when SDK input validation fails."""
