"""Password/PIN hashing and session-token utilities."""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import time


def hash_pin(pin: str) -> str:
    """Hash a PIN using SHA-256 with a random salt."""
    salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac("sha256", pin.encode("utf-8"), salt, 100000)
    return salt.hex() + ":" + key.hex()


def verify_pin(pin: str, stored: str) -> bool:
    """Verify a PIN against a stored hash."""
    try:
        salt_hex, key_hex = stored.split(":")
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(key_hex)
        actual = hashlib.pbkdf2_hmac("sha256", pin.encode("utf-8"), salt, 100000)
        return actual == expected
    except (ValueError, AttributeError):
        return False


# ─── Tokens de sesión (HMAC, sin dependencias externas) ──────────────────────

TOKEN_TTL_SECONDS = 24 * 60 * 60  # 24 horas — cubre un turno completo


def create_session_token(username: str, role: str, secret: str, ttl_seconds: int = TOKEN_TTL_SECONDS) -> str:
    """Crea un token firmado `payload_b64.firma_hex` con expiración."""
    expiry = int(time.time()) + ttl_seconds
    payload = f"{username}|{role}|{expiry}".encode("utf-8")
    payload_b64 = base64.urlsafe_b64encode(payload).decode("ascii").rstrip("=")
    signature = hmac.new(secret.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{signature}"


def verify_session_token(token: str, secret: str) -> dict | None:
    """Valida firma y expiración. Retorna {username, role} o None si es inválido."""
    try:
        payload_b64, signature = token.split(".", 1)
        expected = hmac.new(secret.encode("utf-8"), payload_b64.encode("ascii"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            return None
        padding = "=" * (-len(payload_b64) % 4)
        payload = base64.urlsafe_b64decode(payload_b64 + padding).decode("utf-8")
        username, role, expiry_str = payload.split("|")
        if int(expiry_str) < time.time():
            return None
        return {"username": username, "role": role}
    except (ValueError, AttributeError):
        return None
