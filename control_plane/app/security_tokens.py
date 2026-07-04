"""Secure token generation and verification helpers.

This module centralizes how provider tokens, API keys, and other
high-sensitivity credentials are generated, salted, and hashed.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets


def generate_salt(length: int = 16) -> str:
    """Return a URL-safe random salt."""
    return secrets.token_urlsafe(length)


def generate_token(prefix: str, length: int = 32) -> str:
    """Return a random bearer token with the given prefix.

    The token is meant to be shown exactly once to the caller and then
    discarded; only its salted hash should be stored.
    """
    return f"{prefix}{secrets.token_urlsafe(length)}"


def hash_token(token: str, salt: str) -> str:
    """Return HMAC-SHA256(salt, token) as a hex string.

    Using HMAC with a per-record random salt makes pre-computation
    attacks (rainbow tables) impractical and binds each hash to its
    owning record.
    """
    return hmac.new(salt.encode("utf-8"), token.encode("utf-8"), hashlib.sha256).hexdigest()


def verify_token(token: str, salt: str, expected_hash: str) -> bool:
    """Constant-time verification of a token against its stored hash."""
    if not token or not expected_hash:
        return False
    return hmac.compare_digest(hash_token(token, salt), expected_hash)
