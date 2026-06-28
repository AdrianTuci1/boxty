from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Any, get_args, get_origin, get_type_hints
from uuid import uuid4

try:
    from pydantic import BaseModel, Field
except ImportError:  # pragma: no cover - local fallback when pydantic is unavailable
    @dataclass
    class _FieldInfo:
        default: Any = ...
        default_factory: Any | None = None

    def Field(default: Any = ..., default_factory: Any | None = None, **_: Any) -> Any:
        return _FieldInfo(default=default, default_factory=default_factory)

    class BaseModel:
        def __init__(self, **kwargs: Any) -> None:
            annotations = get_type_hints(self.__class__)
            for name, annotation in annotations.items():
                default = getattr(self.__class__, name, ...)
                if name in kwargs:
                    value = kwargs[name]
                elif isinstance(default, _FieldInfo):
                    if default.default_factory is not None:
                        value = default.default_factory()
                    elif default.default is not ...:
                        value = default.default
                    else:
                        raise TypeError(f"missing required field: {name}")
                elif default is not ...:
                    value = default
                else:
                    raise TypeError(f"missing required field: {name}")
                setattr(self, name, self._coerce(annotation, value))

        @classmethod
        def _coerce(cls, annotation: Any, value: Any) -> Any:
            if value is None:
                return None
            origin = get_origin(annotation)
            args = get_args(annotation)

            if origin is not None and type(None) in args:
                non_none = next((arg for arg in args if arg is not type(None)), None)
                if non_none is not None:
                    return cls._coerce(non_none, value)

            if origin is list:
                inner = args[0] if args else Any
                return [cls._coerce(inner, item) for item in value]

            if origin is dict:
                return dict(value)

            if isinstance(annotation, type):
                if issubclass(annotation, BaseModel):
                    if isinstance(value, annotation):
                        return value
                    if isinstance(value, dict):
                        return annotation(**value)
                if issubclass(annotation, Enum):
                    if isinstance(value, annotation):
                        return value
                    return annotation(value)
            return value

        def model_dump(self, mode: str | None = None) -> dict[str, Any]:
            annotations = get_type_hints(self.__class__)
            return {
                name: self._dump_value(getattr(self, name), mode=mode)
                for name in annotations
            }

        @classmethod
        def _dump_value(cls, value: Any, mode: str | None = None) -> Any:
            if isinstance(value, BaseModel):
                return value.model_dump(mode=mode)
            if isinstance(value, Enum):
                return value.value
            if isinstance(value, datetime):
                return value.isoformat() if mode == "json" else value
            if isinstance(value, list):
                return [cls._dump_value(item, mode=mode) for item in value]
            if isinstance(value, dict):
                return {key: cls._dump_value(item, mode=mode) for key, item in value.items()}
            return value


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def generated_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:12]}"


class ExecutionBackend(str, Enum):
    provider = "provider"
    runpod_serverless = "runpod_serverless"


class WorkloadKind(str, Enum):
    sandbox = "sandbox"
    function = "function"
    endpoint = "endpoint"
    build = "build"


class WorkloadStatus(str, Enum):
    pending = "pending"
    scheduled = "scheduled"
    claimed = "claimed"
    running = "running"
    completed = "completed"
    failed = "failed"
    stopped = "stopped"


class ProviderStatus(str, Enum):
    online = "online"
    draining = "draining"
    offline = "offline"


class SessionAccessMode(str, Enum):
    sandbox_only = "sandbox_only"
    disabled = "disabled"


class UserRegistrationRequest(BaseModel):
    external_user_id: str
    email: str | None = None
    organization_id: str | None = None


class UserRegistrationResponse(BaseModel):
    user_id: str
    token_type: str = "bearer"
    access_token: str
    bootstrap_credit_usd: float
    balance_usd: float
    default_workspace_id: str
    default_environment_id: str


class UserRecord(BaseModel):
    user_id: str
    external_user_id: str
    email: str | None = None
    organization_id: str | None = None
    default_workspace_id: str
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class AccountRecord(BaseModel):
    user_id: str
    organization_id: str | None = None
    balance_usd: float
    credit_grants_usd: float
    total_spend_usd: float = 0.0
    stripe_customer_id: str | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class PaymentRecord(BaseModel):
    payment_id: str = Field(default_factory=lambda: generated_id("pay"))
    user_id: str
    stripe_session_id: str | None = None
    stripe_payment_intent_id: str | None = None
    amount_usd: float
    status: str = "pending"  # pending, completed, failed, refunded
    created_at: datetime = Field(default_factory=utc_now)
    completed_at: datetime | None = None


class BillingHistoryRecord(BaseModel):
    history_id: str = Field(default_factory=lambda: generated_id("bhi"))
    user_id: str
    type: str  # credit_purchase, usage_charge, refund
    amount_usd: float
    description: str
    created_at: datetime = Field(default_factory=utc_now)


class PricingRate(BaseModel):
    cpu_price_per_vcpu_hour_usd: float
    ram_price_per_gb_hour_usd: float
    gpu_price_per_gpu_hour_usd: float
    storage_price_per_gb_hour_usd: float


class WorkspaceCreateRequest(BaseModel):
    owner_id: str
    name: str


class WorkspaceRecord(BaseModel):
    workspace_id: str = Field(default_factory=lambda: generated_id("ws"))
    owner_id: str
    name: str
    is_default: bool = False
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class EnvironmentCreateRequest(BaseModel):
    workspace_id: str
    name: str


class EnvironmentRecord(BaseModel):
    environment_id: str = Field(default_factory=lambda: generated_id("env"))
    workspace_id: str
    name: str
    is_default: bool = False
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class ApiKeyCreateRequest(BaseModel):
    owner_id: str
    workspace_id: str
    environment_id: str
    name: str


class ApiKeyRecord(BaseModel):
    api_key_id: str = Field(default_factory=lambda: generated_id("key"))
    owner_id: str
    workspace_id: str
    environment_id: str
    name: str
    secret_preview: str
    secret_token: str
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class SecretCreateRequest(BaseModel):
    workspace_id: str
    name: str
    env_vars: dict[str, str]


class SecretRecord(BaseModel):
    secret_id: str = Field(default_factory=lambda: generated_id("sec"))
    workspace_id: str
    name: str
    key_names: list[str] = Field(default_factory=list)
    encrypted_env_vars: str
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class InviteCreateRequest(BaseModel):
    inviter_user_id: str
    workspace_id: str
    email: str
    role: str = "developer"


class InviteRecord(BaseModel):
    invite_id: str = Field(default_factory=lambda: generated_id("inv"))
    inviter_user_id: str
    workspace_id: str
    email: str
    role: str
    status: str = "pending"
    token: str = Field(default_factory=lambda: uuid4().hex)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class ProviderCapabilities(BaseModel):
    cpu_cores: int = Field(ge=1)
    memory_mb: int = Field(ge=256)
    disk_gb: int = Field(ge=1)
    gpu_count: int = Field(default=0, ge=0)
    gpu_type: str | None = None
    supports_endpoint_serving: bool = True
    supports_sandbox_ssh: bool = True
    supports_image_builds: bool = False


class ProviderRegistrationRequest(BaseModel):
    provider_name: str
    region: str
    pool: str = "general"
    public_base_url: str | None = None
    control_callback_url: str | None = None
    session_access_mode: SessionAccessMode = SessionAccessMode.sandbox_only
    labels: dict[str, str] = Field(default_factory=dict)
    capabilities: ProviderCapabilities


class ProviderHeartbeatRequest(BaseModel):
    available_slots: int = Field(ge=0, default=0)
    running_workloads: int = Field(ge=0, default=0)
    status: ProviderStatus = ProviderStatus.online


class ProviderRecord(BaseModel):
    provider_id: str = Field(default_factory=lambda: generated_id("prov"))
    provider_name: str
    region: str
    pool: str
    public_base_url: str | None = None
    control_callback_url: str | None = None
    session_access_mode: SessionAccessMode
    labels: dict[str, str]
    capabilities: ProviderCapabilities
    auth_token_hash: str = ""
    status: ProviderStatus = ProviderStatus.online
    available_slots: int = 0
    running_workloads: int = 0
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class ProviderRegistrationResponse(BaseModel):
    provider_id: str
    provider_token: str
    provider: dict[str, Any]


class WorkloadResources(BaseModel):
    cpu_cores: int = Field(default=1, ge=1)
    memory_mb: int = Field(default=512, ge=128)
    disk_gb: int = Field(default=2, ge=1)
    gpu_count: int = Field(default=0, ge=0)
    gpu_type: str | None = None


class VolumeMount(BaseModel):
    locator: str
    mount_path: str
    read_only: bool = False


class WorkloadCreateRequest(BaseModel):
    owner_id: str
    workspace_id: str
    environment_id: str
    kind: WorkloadKind
    image: str
    command: list[str] = Field(default_factory=list)
    env: dict[str, str] = Field(default_factory=dict)
    region: str | None = None
    pool: str | None = None
    endpoint_name: str | None = None
    requested_backend: ExecutionBackend | None = None
    allow_runpod_fallback: bool = True
    secret_names: list[str] = Field(default_factory=list)
    volume_mounts: list[VolumeMount] = Field(default_factory=list)
    resources: WorkloadResources = Field(default_factory=WorkloadResources)
    metadata: dict[str, Any] = Field(default_factory=dict)


class WorkloadRecord(BaseModel):
    workload_id: str = Field(default_factory=lambda: generated_id("wl"))
    owner_id: str
    workspace_id: str
    environment_id: str
    kind: WorkloadKind
    status: WorkloadStatus = WorkloadStatus.pending
    image: str
    command: list[str]
    env: dict[str, str]
    region: str
    pool: str
    requested_backend: ExecutionBackend | None = None
    selected_backend: ExecutionBackend | None = None
    secret_names: list[str] = Field(default_factory=list)
    volume_mounts: list[VolumeMount] = Field(default_factory=list)
    assigned_provider_id: str | None = None
    external_backend_id: str | None = None
    endpoint_name: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    resources: WorkloadResources
    claimed_by_provider_id: str | None = None
    claim_lease_expires_at: datetime | None = None
    runtime_details: dict[str, Any] = Field(default_factory=dict)
    accrued_cost_usd: float = 0.0
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class WorkloadStatusUpdateRequest(BaseModel):
    status: WorkloadStatus
    runtime_details: dict[str, Any] = Field(default_factory=dict)


class WorkerAssignmentRecord(BaseModel):
    provider_id: str
    workload: WorkloadRecord


class WorkloadLaunchSpec(BaseModel):
    workload: WorkloadRecord
    env: dict[str, str] = Field(default_factory=dict)


class VolumeCreateRequest(BaseModel):
    workspace_id: str
    name: str
    size_gb: int = Field(default=10, ge=1)
    volume_type: str = "object-storage"


class VolumeRecord(BaseModel):
    volume_id: str = Field(default_factory=lambda: generated_id("vol"))
    workspace_id: str
    name: str
    size_gb: int
    volume_type: str
    status: str = "available"
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class VolumeEntryRecord(BaseModel):
    path: str
    entry_type: str
    size: int | None = None


class RoutePublishRequest(BaseModel):
    workload_id: str
    hostname: str
    path_prefix: str = "/"


class RouteRecord(BaseModel):
    route_id: str = Field(default_factory=lambda: generated_id("route"))
    workload_id: str
    hostname: str
    path_prefix: str
    target_backend: ExecutionBackend
    target_address: str
    created_at: datetime = Field(default_factory=utc_now)


class SandboxSessionRequest(BaseModel):
    workload_id: str
    requester_id: str
    ttl_seconds: int = Field(default=900, ge=60, le=3600)


class SandboxSessionRecord(BaseModel):
    session_id: str = Field(default_factory=lambda: generated_id("ssh"))
    workload_id: str
    requester_id: str
    token: str = Field(default_factory=lambda: uuid4().hex)
    ttl_seconds: int
    created_at: datetime = Field(default_factory=utc_now)


class RunPodDispatchRequest(BaseModel):
    workload_id: str
    template: str
    gpu_type: str | None = None
    gpu_count: int = Field(default=0, ge=0)
    env: dict[str, str] = Field(default_factory=dict)


class RunPodDispatchResponse(BaseModel):
    workload_id: str
    backend: ExecutionBackend = ExecutionBackend.runpod_serverless
    external_id: str
    status: str


class UsageMeterRequest(BaseModel):
    workload_id: str
    cpu_seconds: float = Field(default=0.0, ge=0.0)
    ram_gb_seconds: float = Field(default=0.0, ge=0.0)
    gpu_seconds: float = Field(default=0.0, ge=0.0)
    storage_gb_seconds: float = Field(default=0.0, ge=0.0)
    egress_gb: float = Field(default=0.0, ge=0.0)
    metadata: dict[str, Any] = Field(default_factory=dict)


class UsageMeterResponse(BaseModel):
    workload_id: str
    owner_id: str
    incremental_cost_usd: float
    workload_total_cost_usd: float
    account_balance_usd: float


class SingleTableItem(BaseModel):
    pk: str
    sk: str
    entity_type: str
    attributes: dict[str, Any]


class LoginRequest(BaseModel):
    external_user_id: str
    email: str | None = None


class LoginResponse(BaseModel):
    user_id: str
    token_type: str = "bearer"
    access_token: str


class BillingBalanceResponse(BaseModel):
    user_id: str
    balance_usd: float
    credit_grants_usd: float
    total_spend_usd: float


class BillingUsageResponse(BaseModel):
    user_id: str
    total_spend_usd: float
    period_start: datetime
    period_end: datetime


class BillingCreditsRequest(BaseModel):
    user_id: str
    amount_usd: float
    success_url: str | None = None
    cancel_url: str | None = None


class BillingCreditsResponse(BaseModel):
    user_id: str
    amount_usd: float
    new_balance_usd: float


class UsageRecord(BaseModel):
    usage_id: str = Field(default_factory=lambda: generated_id("usg"))
    workload_id: str
    owner_id: str
    cpu_seconds: float
    ram_gb_seconds: float
    gpu_seconds: float
    storage_gb_seconds: float
    egress_gb: float
    incremental_cost_usd: float
    created_at: datetime = Field(default_factory=utc_now)


class DashboardSummary(BaseModel):
    workspace_id: str
    environment_id: str
    total_workloads: int
    running_workloads: int
    failed_workloads: int
    total_routes: int
    total_api_keys: int
    total_secrets: int
    total_volumes: int
    balance_usd: float


class WorkloadMetrics(BaseModel):
    workload_id: str
    cpu_seconds: float
    ram_gb_seconds: float
    gpu_seconds: float
    storage_gb_seconds: float
    egress_gb: float
    accrued_cost_usd: float


class WorkloadLogEntry(BaseModel):
    log_id: str = Field(default_factory=lambda: generated_id("log"))
    workload_id: str
    timestamp: datetime = Field(default_factory=utc_now)
    level: str = "info"
    message: str


class ScheduleCreateRequest(BaseModel):
    name: str
    workspace_id: str
    environment_id: str
    owner_id: str
    workload_id: str
    cron_expression: str | None = None
    interval_seconds: int | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


class ScheduleRecord(BaseModel):
    schedule_id: str = Field(default_factory=lambda: generated_id("sch"))
    name: str
    workspace_id: str
    environment_id: str
    owner_id: str
    workload_id: str
    cron_expression: str | None = None
    interval_seconds: int | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    status: str = "active"
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    last_run_at: datetime | None = None
    next_run_at: datetime | None = None


class ImageCreateRequest(BaseModel):
    name: str
    workspace_id: str
    owner_id: str
    base_image: str
    dockerfile: str | None = None
    build_args: dict[str, str] = Field(default_factory=dict)


class ImageRecord(BaseModel):
    image_id: str = Field(default_factory=lambda: generated_id("img"))
    name: str
    workspace_id: str
    owner_id: str
    base_image: str
    dockerfile: str | None = None
    build_args: dict[str, str] = Field(default_factory=dict)
    status: str = "pending"
    build_log: str = ""
    image_ref: str = ""
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    built_at: datetime | None = None
