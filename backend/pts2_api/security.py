"""Password/PIN hashing utilities."""

from __future__ import annotations

import hashlib
import os


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
