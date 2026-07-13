"""Authentication helpers for the control plane.

Handles both user access tokens (``Authorization: Bearer boxty_...``) and
API keys (``Authorization: Bearer bx_...`` or ``ApiKey bx_...``).  API keys are
scoped to a workspace and environment, so endpoints that need that scope can
read them from the resolved user context.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from fastapi import Header, HTTPException

from .store import store


@dataclass
class CurrentUser:
    """Resolved caller context."""

    user_id: str
    external_user_id: str | None
    email: str | None
    token: str
    api_key_id: str | None = None
    workspace_id: str | None = None
    environment_id: str | None = None


def _resolve_access_token(token: str) -> CurrentUser:
    """Resolve a user access token of the form ``boxty_{external_user_id}_{random}``."""
    parts = token.split("_")
    if len(parts) >= 3 and parts[0] == "boxty":
        external_user_id = parts[1]
        for user in store.users.values():
            if user.external_user_id == external_user_id:
                return CurrentUser(
                    user_id=user.user_id,
                    external_user_id=user.external_user_id,
                    email=user.email,
                    token=token,
                )
    raise HTTPException(status_code=401, detail="invalid access token")


def _resolve_api_key(token: str) -> CurrentUser:
    """Resolve an API key secret of the form ``bx_...``.

    The store keeps only the hash, so we iterate known keys and try to verify
    the token against each.  This is acceptable for an in-memory store; a real
    implementation would look up the key by an ID prefix or secondary index.
    """
    for api_key in store.api_keys.values():
        if not api_key.secret_token_salt:
            continue
        from .security_tokens import verify_token

        if verify_token(token, api_key.secret_token_salt, api_key.secret_token_hash):
            user = store.users.get(api_key.owner_id)
            if not user:
                break
            return CurrentUser(
                user_id=user.user_id,
                external_user_id=user.external_user_id,
                email=user.email,
                token=token,
                api_key_id=api_key.api_key_id,
                workspace_id=api_key.workspace_id,
                environment_id=api_key.environment_id,
            )
    raise HTTPException(status_code=401, detail="invalid api key")


def get_current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    """FastAPI dependency that resolves any supported auth credential."""
    if not authorization:
        raise HTTPException(status_code=401, detail="missing authorization header")

    scheme, _, token = authorization.partition(" ")
    scheme = scheme.lower()
    token = token.strip()

    if not token:
        raise HTTPException(status_code=401, detail="missing authorization token")

    if scheme == "bearer":
        if token.startswith("boxty_"):
            return _resolve_access_token(token)
        if token.startswith("bx_"):
            return _resolve_api_key(token)
        return _resolve_access_token(token)

    if scheme == "apikey":
        return _resolve_api_key(token)

    raise HTTPException(status_code=401, detail="unsupported authorization scheme")


def require_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    """Same as ``get_current_user`` but with a clearer name for public endpoints."""
    return get_current_user(authorization)
