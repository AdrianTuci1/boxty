from __future__ import annotations

import secrets
import urllib.parse

import httpx

from .config import settings
from .models import BaseModel


class OAuthProfile(BaseModel):
    provider: str
    provider_user_id: str
    email: str | None
    name: str | None


GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_PROFILE_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_PROFILE_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


def _default_redirect_uri(provider: str) -> str:
    if provider == "google":
        return settings.google_redirect_uri
    return settings.github_redirect_uri


def _client_credentials(provider: str) -> tuple[str, str]:
    if provider == "google":
        return settings.google_client_id, settings.google_client_secret
    return settings.github_client_id, settings.github_client_secret


def _missing_config(provider: str) -> str | None:
    client_id, client_secret = _client_credentials(provider)
    if not client_id or not client_secret:
        return f"OAuth not configured for {provider}"
    return None


def generate_state() -> str:
    return secrets.token_urlsafe(32)


def build_authorization_url(provider: str, state: str | None = None) -> tuple[str, str]:
    """Return (authorization_url, state)."""
    state = state or generate_state()
    client_id, _ = _client_credentials(provider)
    redirect_uri = _default_redirect_uri(provider)

    if provider == "google":
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
            "prompt": "select_account",
        }
        url = f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"
    else:
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": "read:user user:email",
            "state": state,
        }
        url = f"{GITHUB_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return url, state


async def exchange_code(provider: str, code: str) -> str:
    _, client_secret = _client_credentials(provider)
    redirect_uri = _default_redirect_uri(provider)

    if provider == "google":
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": settings.google_client_id,
            "client_secret": client_secret,
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(GOOGLE_TOKEN_URL, data=data)
            response.raise_for_status()
            payload = response.json()
    else:
        data = {
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": settings.github_client_id,
            "client_secret": client_secret,
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GITHUB_TOKEN_URL,
                data=data,
                headers={"Accept": "application/json"},
            )
            response.raise_for_status()
            payload = response.json()

    access_token = payload.get("access_token")
    if not access_token:
        raise ValueError(f"no access_token in {provider} response")
    return access_token


async def fetch_google_profile(access_token: str) -> OAuthProfile:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_PROFILE_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        profile = response.json()

    return OAuthProfile(
        provider="google",
        provider_user_id=str(profile.get("id", "")),
        email=profile.get("email"),
        name=profile.get("name"),
    )


async def fetch_github_profile(access_token: str) -> OAuthProfile:
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"token {access_token}"}
        response = await client.get(GITHUB_PROFILE_URL, headers=headers)
        response.raise_for_status()
        profile = response.json()

        emails_response = await client.get(GITHUB_EMAILS_URL, headers=headers)
        emails_response.raise_for_status()
        emails = emails_response.json()

    primary_email = None
    for email in emails:
        if email.get("primary") and email.get("verified"):
            primary_email = email.get("email")
            break
    if not primary_email:
        primary_email = profile.get("email")

    return OAuthProfile(
        provider="github",
        provider_user_id=str(profile.get("id", "")),
        email=primary_email,
        name=profile.get("name") or profile.get("login"),
    )


async def fetch_profile(provider: str, access_token: str) -> OAuthProfile:
    if provider == "google":
        return await fetch_google_profile(access_token)
    return await fetch_github_profile(access_token)
