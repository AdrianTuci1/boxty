"""Typed models for Boxty API responses."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class User:
    user_id: str
    external_user_id: str
    email: str | None = None
    created_at: str = ""

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> User:
        return cls(
            user_id=data.get("user_id", ""),
            external_user_id=data.get("external_user_id", ""),
            email=data.get("email"),
            created_at=data.get("created_at", ""),
        )


@dataclass
class Workspace:
    workspace_id: str
    owner_id: str
    name: str
    description: str = ""
    created_at: str = ""
    environment_count: int = 0
    app_count: int = 0

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Workspace:
        return cls(
            workspace_id=data.get("workspace_id", ""),
            owner_id=data.get("owner_id", ""),
            name=data.get("name", ""),
            description=data.get("description", ""),
            created_at=data.get("created_at", ""),
            environment_count=data.get("environment_count", 0),
            app_count=data.get("app_count", 0),
        )


@dataclass
class Environment:
    environment_id: str
    workspace_id: str
    name: str
    created_at: str = ""

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Environment:
        return cls(
            environment_id=data.get("environment_id", ""),
            workspace_id=data.get("workspace_id", ""),
            name=data.get("name", ""),
            created_at=data.get("created_at", ""),
        )


@dataclass
class ApiKey:
    api_key_id: str
    owner_id: str
    workspace_id: str
    environment_id: str
    name: str
    key_preview: str = ""
    created_at: str = ""

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> ApiKey:
        return cls(
            api_key_id=data.get("api_key_id", ""),
            owner_id=data.get("owner_id", ""),
            workspace_id=data.get("workspace_id", ""),
            environment_id=data.get("environment_id", ""),
            name=data.get("name", ""),
            key_preview=data.get("key_preview", ""),
            created_at=data.get("created_at", ""),
        )


@dataclass
class Secret:
    secret_id: str
    name: str
    workspace_id: str
    key_names: list[str] = field(default_factory=list)
    env_vars: dict[str, str] = field(default_factory=dict)
    created_at: str = ""

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Secret:
        return cls(
            secret_id=data.get("secret_id", ""),
            name=data.get("name", ""),
            workspace_id=data.get("workspace_id", ""),
            key_names=data.get("key_names", []),
            env_vars=data.get("env_vars", {}),
            created_at=data.get("created_at", ""),
        )


@dataclass
class Volume:
    volume_id: str
    name: str
    size_gb: int = 0
    volume_type: str = ""
    status: str = ""
    created_at: str = ""

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Volume:
        return cls(
            volume_id=data.get("volume_id", ""),
            name=data.get("name", ""),
            size_gb=data.get("size_gb", 0),
            volume_type=data.get("volume_type", ""),
            status=data.get("status", ""),
            created_at=data.get("created_at", ""),
        )


@dataclass
class Workload:
    workload_id: str
    owner_id: str
    workspace_id: str
    environment_id: str
    name: str
    kind: str
    status: str
    image: str = ""
    command: list[str] = field(default_factory=list)
    env: dict[str, str] = field(default_factory=dict)
    resources: dict[str, Any] = field(default_factory=dict)
    endpoint_name: str | None = None
    created_at: str = ""
    updated_at: str = ""
    assigned_provider_id: str | None = None
    accrued_cost_usd: float = 0.0

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Workload:
        return cls(
            workload_id=data.get("workload_id", ""),
            owner_id=data.get("owner_id", ""),
            workspace_id=data.get("workspace_id", ""),
            environment_id=data.get("environment_id", ""),
            name=data.get("name", ""),
            kind=data.get("kind", ""),
            status=data.get("status", ""),
            image=data.get("image", ""),
            command=data.get("command", []),
            env=data.get("env", {}),
            resources=data.get("resources", {}),
            endpoint_name=data.get("endpoint_name"),
            created_at=data.get("created_at", ""),
            updated_at=data.get("updated_at", ""),
            assigned_provider_id=data.get("assigned_provider_id"),
            accrued_cost_usd=data.get("accrued_cost_usd", 0.0),
        )


@dataclass
class Route:
    route_id: str
    workload_id: str
    endpoint_name: str
    created_at: str = ""

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Route:
        return cls(
            route_id=data.get("route_id", ""),
            workload_id=data.get("workload_id", ""),
            endpoint_name=data.get("endpoint_name", ""),
            created_at=data.get("created_at", ""),
        )


@dataclass
class Schedule:
    schedule_id: str
    name: str
    schedule_type: str
    schedule_value: str
    function_name: str
    workspace_id: str
    environment_id: str
    status: str = "active"
    image: str | None = None
    cpu: str | None = None
    memory: str | None = None
    gpu: str | None = None
    created_at: str = ""
    updated_at: str = ""

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Schedule:
        return cls(
            schedule_id=data.get("schedule_id", ""),
            name=data.get("name", ""),
            schedule_type=data.get("schedule_type", ""),
            schedule_value=data.get("schedule_value", ""),
            function_name=data.get("function_name", ""),
            workspace_id=data.get("workspace_id", ""),
            environment_id=data.get("environment_id", ""),
            status=data.get("status", "active"),
            image=data.get("image"),
            cpu=data.get("cpu"),
            memory=data.get("memory"),
            gpu=data.get("gpu"),
            created_at=data.get("created_at", ""),
            updated_at=data.get("updated_at", ""),
        )


@dataclass
class ImageModel:
    image_id: str
    name: str
    base_image: str
    status: str = ""
    created_at: str = ""

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> ImageModel:
        return cls(
            image_id=data.get("image_id", ""),
            name=data.get("name", ""),
            base_image=data.get("base_image", ""),
            status=data.get("status", ""),
            created_at=data.get("created_at", ""),
        )


@dataclass
class UsageRecord:
    usage_id: str
    workload_id: str
    owner_id: str
    cpu_seconds: float = 0.0
    ram_gb_seconds: float = 0.0
    gpu_seconds: float = 0.0
    storage_gb_seconds: float = 0.0
    egress_gb: float = 0.0
    incremental_cost_usd: float = 0.0
    created_at: str = ""

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> UsageRecord:
        return cls(
            usage_id=data.get("usage_id", ""),
            workload_id=data.get("workload_id", ""),
            owner_id=data.get("owner_id", ""),
            cpu_seconds=data.get("cpu_seconds", 0.0),
            ram_gb_seconds=data.get("ram_gb_seconds", 0.0),
            gpu_seconds=data.get("gpu_seconds", 0.0),
            storage_gb_seconds=data.get("storage_gb_seconds", 0.0),
            egress_gb=data.get("egress_gb", 0.0),
            incremental_cost_usd=data.get("incremental_cost_usd", 0.0),
            created_at=data.get("created_at", ""),
        )


@dataclass
class BillingBalance:
    user_id: str
    balance_usd: float = 0.0
    credit_grants_usd: float = 0.0
    total_spend_usd: float = 0.0

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> BillingBalance:
        return cls(
            user_id=data.get("user_id", ""),
            balance_usd=data.get("balance_usd", 0.0),
            credit_grants_usd=data.get("credit_grants_usd", 0.0),
            total_spend_usd=data.get("total_spend_usd", 0.0),
        )


@dataclass
class BillingUsage:
    user_id: str
    total_spend_usd: float = 0.0
    period_start: str = ""
    period_end: str = ""

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> BillingUsage:
        return cls(
            user_id=data.get("user_id", ""),
            total_spend_usd=data.get("total_spend_usd", 0.0),
            period_start=data.get("period_start", ""),
            period_end=data.get("period_end", ""),
        )


@dataclass
class DashboardSummary:
    workspace_id: str
    environment_id: str
    total_workloads: int = 0
    running_workloads: int = 0
    failed_workloads: int = 0
    total_routes: int = 0
    total_api_keys: int = 0
    total_secrets: int = 0
    total_volumes: int = 0
    balance_usd: float = 0.0

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> DashboardSummary:
        return cls(
            workspace_id=data.get("workspace_id", ""),
            environment_id=data.get("environment_id", ""),
            total_workloads=data.get("total_workloads", 0),
            running_workloads=data.get("running_workloads", 0),
            failed_workloads=data.get("failed_workloads", 0),
            total_routes=data.get("total_routes", 0),
            total_api_keys=data.get("total_api_keys", 0),
            total_secrets=data.get("total_secrets", 0),
            total_volumes=data.get("total_volumes", 0),
            balance_usd=data.get("balance_usd", 0.0),
        )


@dataclass
class WorkloadMetrics:
    workload_id: str
    cpu_seconds: float = 0.0
    ram_gb_seconds: float = 0.0
    gpu_seconds: float = 0.0
    storage_gb_seconds: float = 0.0
    egress_gb: float = 0.0
    accrued_cost_usd: float = 0.0

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> WorkloadMetrics:
        return cls(
            workload_id=data.get("workload_id", ""),
            cpu_seconds=data.get("cpu_seconds", 0.0),
            ram_gb_seconds=data.get("ram_gb_seconds", 0.0),
            gpu_seconds=data.get("gpu_seconds", 0.0),
            storage_gb_seconds=data.get("storage_gb_seconds", 0.0),
            egress_gb=data.get("egress_gb", 0.0),
            accrued_cost_usd=data.get("accrued_cost_usd", 0.0),
        )


@dataclass
class WorkloadLogEntry:
    log_id: str
    workload_id: str
    timestamp: str = ""
    level: str = "info"
    message: str = ""

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> WorkloadLogEntry:
        return cls(
            log_id=data.get("log_id", ""),
            workload_id=data.get("workload_id", ""),
            timestamp=data.get("timestamp", ""),
            level=data.get("level", "info"),
            message=data.get("message", ""),
        )


@dataclass
class Invite:
    invite_id: str
    workspace_id: str
    email: str
    role: str = "viewer"
    status: str = "pending"
    created_at: str = ""

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Invite:
        return cls(
            invite_id=data.get("invite_id", ""),
            workspace_id=data.get("workspace_id", ""),
            email=data.get("email", ""),
            role=data.get("role", "viewer"),
            status=data.get("status", "pending"),
            created_at=data.get("created_at", ""),
        )


@dataclass
class Provider:
    provider_id: str
    name: str
    region: str
    pool: str
    total_slots: int = 0
    available_slots: int = 0
    running_workloads: int = 0
    status: str = ""
    created_at: str = ""
    updated_at: str = ""

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Provider:
        return cls(
            provider_id=data.get("provider_id", ""),
            name=data.get("name", ""),
            region=data.get("region", ""),
            pool=data.get("pool", ""),
            total_slots=data.get("total_slots", 0),
            available_slots=data.get("available_slots", 0),
            running_workloads=data.get("running_workloads", 0),
            status=data.get("status", ""),
            created_at=data.get("created_at", ""),
            updated_at=data.get("updated_at", ""),
        )
