"""jsonPTS packet models."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from ..exceptions import PTS2ProtocolError


def _to_pascal(value: str) -> str:
    return "".join(part.capitalize() for part in value.split("_"))


class JsonPTSModel(BaseModel):
    """Base model that keeps unknown jsonPTS fields for forward compatibility."""

    model_config = ConfigDict(
        alias_generator=_to_pascal,
        extra="allow",
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

    def to_dict(self) -> dict[str, Any]:
        return self.model_dump(by_alias=True, exclude_none=True)


class Packet(JsonPTSModel):
    id: int | str = Field(alias="Id")
    type: str = Field(alias="Type")
    data: Any | None = Field(default=None, alias="Data")
    message: str | None = Field(default=None, alias="Message")
    error: Any | None = Field(default=None, alias="Error")
    code: Any | None = Field(default=None, alias="Code")
    description: str | None = Field(default=None, alias="Description")

    @classmethod
    def command(cls, packet_type: str, data: Any | None = None, packet_id: int | str = 1) -> "Packet":
        payload: dict[str, Any] = {"Id": packet_id, "Type": packet_type}
        if data is not None:
            payload["Data"] = data
        return cls.model_validate(payload)


class PTS2Response(JsonPTSModel):
    protocol: str = Field(default="jsonPTS", alias="Protocol")
    packets: list[Packet] = Field(default_factory=list, alias="Packets")

    @classmethod
    def from_payload(cls, payload: Mapping[str, Any]) -> "PTS2Response":
        if not isinstance(payload, Mapping):
            raise PTS2ProtocolError("jsonPTS response must be a JSON object")
        if "Packets" not in payload:
            raise PTS2ProtocolError("jsonPTS response does not contain Packets")
        try:
            return cls.model_validate(dict(payload))
        except Exception as exc:
            raise PTS2ProtocolError(f"Invalid jsonPTS response: {exc}") from exc
