"""HTTP authentication helpers."""

from __future__ import annotations

from typing import Literal

from requests.auth import AuthBase, HTTPBasicAuth, HTTPDigestAuth

from .exceptions import PTS2ValidationError

AuthType = Literal["basic", "digest", "none"]


def normalize_auth_type(auth_type: str | None) -> AuthType:
    value = (auth_type or "basic").strip().lower()
    if value not in {"basic", "digest", "none"}:
        raise PTS2ValidationError("auth_type must be one of: basic, digest, none")
    return value  # type: ignore[return-value]


def build_auth(username: str | None, password: str | None, auth_type: str | None) -> AuthBase | None:
    normalized = normalize_auth_type(auth_type)
    if normalized == "none":
        return None
    if not username:
        raise PTS2ValidationError("username is required when authentication is enabled")
    if password is None:
        raise PTS2ValidationError("password is required when authentication is enabled")
    if normalized == "basic":
        return HTTPBasicAuth(username, password)
    return HTTPDigestAuth(username, password)
