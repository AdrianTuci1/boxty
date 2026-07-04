from __future__ import annotations

import os
from dataclasses import dataclass


def _get_bool(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _get_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if raw is None:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _get_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    app_name: str = os.environ.get("BOXTY_APP_NAME", "boxty-control-plane")
    environment: str = os.environ.get("BOXTY_ENVIRONMENT", "development")
    api_prefix: str = os.environ.get("BOXTY_API_PREFIX", "/v1")
    api_base_url: str = os.environ.get("BOXTY_API_BASE_URL", "")
    default_provider_pool: str = os.environ.get("BOXTY_DEFAULT_PROVIDER_POOL", "general")
    state_store: str = os.environ.get("BOXTY_STATE_STORE", "memory")
    dynamodb_table_name: str = os.environ.get("BOXTY_DYNAMODB_TABLE_NAME", "")
    dynamodb_region: str = os.environ.get("BOXTY_DYNAMODB_REGION", "eu-central-1")
    runpod_enabled: bool = _get_bool("BOXTY_RUNPOD_ENABLED", True)
    runpod_api_base: str = os.environ.get("BOXTY_RUNPOD_API_BASE", "https://api.runpod.io")
    runpod_api_key: str = os.environ.get("BOXTY_RUNPOD_API_KEY", "")
    runpod_default_template: str = os.environ.get("BOXTY_RUNPOD_DEFAULT_TEMPLATE", "gpu-inference")
    default_region: str = os.environ.get("BOXTY_DEFAULT_REGION", "eu-central")
    object_storage_provider: str = os.environ.get("BOXTY_OBJECT_STORAGE_PROVIDER", "filesystem")
    r2_account_id: str = os.environ.get("BOXTY_R2_ACCOUNT_ID", "")
    r2_bucket: str = os.environ.get("BOXTY_R2_BUCKET", "")
    r2_access_key_id: str = os.environ.get("BOXTY_R2_ACCESS_KEY_ID", "")
    r2_secret_access_key: str = os.environ.get("BOXTY_R2_SECRET_ACCESS_KEY", "")
    r2_public_base_url: str = os.environ.get("BOXTY_R2_PUBLIC_BASE_URL", "")
    invite_email_provider: str = os.environ.get("BOXTY_INVITE_EMAIL_PROVIDER", "console")
    invite_email_from: str = os.environ.get("BOXTY_INVITE_EMAIL_FROM", "noreply@boxty.dev")
    smtp_host: str = os.environ.get("BOXTY_SMTP_HOST", "")
    smtp_port: int = int(os.environ.get("BOXTY_SMTP_PORT", "587"))
    smtp_username: str = os.environ.get("BOXTY_SMTP_USERNAME", "")
    smtp_password: str = os.environ.get("BOXTY_SMTP_PASSWORD", "")
    secret_encryption_key: str = os.environ.get("BOXTY_SECRET_ENCRYPTION_KEY", "")
    provider_shared_token: str = os.environ.get("BOXTY_PROVIDER_TOKEN", "")
    provider_heartbeat_ttl_seconds: int = _get_int("BOXTY_PROVIDER_HEARTBEAT_TTL_SECONDS", 90)
    assignment_lease_ttl_seconds: int = _get_int("BOXTY_ASSIGNMENT_LEASE_TTL_SECONDS", 120)
    worker_runtime: str = os.environ.get("BOXTY_WORKER_RUNTIME", "docker")
    worker_poll_interval_seconds: float = _get_float("BOXTY_WORKER_POLL_INTERVAL_SECONDS", 5.0)
    worker_data_dir: str = os.environ.get("BOXTY_WORKER_DATA_DIR", "/tmp/boxty-worker")
    bootstrap_credit_usd: float = _get_float("BOXTY_BOOTSTRAP_CREDIT_USD", 20.0)
    cpu_price_per_vcpu_hour_usd: float = _get_float("BOXTY_CPU_PRICE_PER_VCPU_HOUR_USD", 0.08)
    ram_price_per_gb_hour_usd: float = _get_float("BOXTY_RAM_PRICE_PER_GB_HOUR_USD", 0.012)
    gpu_price_per_gpu_hour_usd: float = _get_float("BOXTY_GPU_PRICE_PER_GPU_HOUR_USD", 1.8)
    storage_price_per_gb_hour_usd: float = _get_float("BOXTY_STORAGE_PRICE_PER_GB_HOUR_USD", 0.0015)
    # OAuth providers
    google_client_id: str = os.environ.get("BOXTY_GOOGLE_CLIENT_ID", "")
    google_client_secret: str = os.environ.get("BOXTY_GOOGLE_CLIENT_SECRET", "")
    google_redirect_uri: str = os.environ.get("BOXTY_GOOGLE_REDIRECT_URI", "http://localhost:5173/oauth/callback")
    github_client_id: str = os.environ.get("BOXTY_GITHUB_CLIENT_ID", "")
    github_client_secret: str = os.environ.get("BOXTY_GITHUB_CLIENT_SECRET", "")
    github_redirect_uri: str = os.environ.get("BOXTY_GITHUB_REDIRECT_URI", "http://localhost:5173/oauth/callback")


settings = Settings()


if settings.environment == "production":
    if settings.state_store != "dynamodb-single-table":
        raise RuntimeError(
            "BOXTY_ENVIRONMENT=production requires BOXTY_STATE_STORE=dynamodb-single-table"
        )
    if not settings.dynamodb_table_name:
        raise RuntimeError(
            "BOXTY_ENVIRONMENT=production requires BOXTY_DYNAMODB_TABLE_NAME to be set"
        )
    if not settings.secret_encryption_key.strip():
        raise RuntimeError(
            "BOXTY_ENVIRONMENT=production requires BOXTY_SECRET_ENCRYPTION_KEY to be set"
        )
    if not settings.provider_shared_token.strip():
        raise RuntimeError(
            "BOXTY_ENVIRONMENT=production requires BOXTY_PROVIDER_TOKEN to be set"
        )
    if settings.object_storage_provider == "filesystem":
        raise RuntimeError(
            "BOXTY_ENVIRONMENT=production requires a non-filesystem object storage provider"
        )


if settings.state_store == "dynamodb-single-table" and not settings.dynamodb_table_name:
    raise RuntimeError(
        "BOXTY_STATE_STORE=dynamodb-single-table requires BOXTY_DYNAMODB_TABLE_NAME"
    )
