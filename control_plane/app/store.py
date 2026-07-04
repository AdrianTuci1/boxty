from __future__ import annotations

from dataclasses import dataclass, field
from datetime import timedelta
import hashlib
import secrets as secrets_lib
from typing import Any

from .config import settings
from .dynamo import (
    account_item,
    api_key_item,
    billing_history_item,
    environment_item,
    invite_item,
    payment_item,
    provider_item,
    route_item,
    secret_item,
    user_item,
    volume_item,
    workload_item,
    workspace_item,
)
from .integrations import dynamo_mirror, invite_email_sender, password_reset_email_sender
from .models import (
    AccountRecord,
    ApiKeyCreateRequest,
    ApiKeyRecord,
    BillingBalanceResponse,
    BillingCreditsResponse,
    BillingHistoryRecord,
    BillingUsageResponse,
    DashboardSummary,
    EnvironmentCreateRequest,
    EnvironmentMember,
    EnvironmentRecord,
    ExecutionBackend,
    FunctionAutoscalerConfig,
    FunctionInvocationResponse,
    FunctionStats,
    ImageCreateRequest,
    ImageRecord,
    InviteCreateRequest,
    InviteRecord,
    LoginResponse,
    PasswordResetRecord,
    PaymentRecord,
    PricingRate,
    ProviderHeartbeatRequest,
    ProviderRecord,
    ProviderRegistrationRequest,
    ProviderRegistrationResponse,
    ProviderStatus,
    ProxyToken,
    RoutePublishRequest,
    RouteRecord,
    SandboxSessionRecord,
    SandboxSessionRequest,
    ScheduleCreateRequest,
    ScheduleRecord,
    SecretCreateRequest,
    SecretRecord,
    SingleTableItem,
    UsageMeterRequest,
    UsageMeterResponse,
    UsageRecord,
    UserRecord,
    VolumeCreateRequest,
    VolumeEntry,
    VolumeEntryRecord,
    VolumeMount,
    VolumeRecord,
    VolumeSnapshot,
    WorkloadCreateRequest,
    WorkloadInvokeRequest,
    WorkloadKind,
    WorkloadLaunchSpec,
    WorkloadLogEntry,
    WorkloadMetrics,
    WorkloadRecord,
    WorkloadStatus,
    WorkloadStatusUpdateRequest,
    WorkerAssignmentRecord,
    WorkspaceCreateRequest,
    WorkspaceMember,
    WorkspaceRecord,
    generated_id,
    utc_now,
)
from .secret_crypto import secret_cipher
from .security_tokens import generate_salt, generate_token, hash_token, verify_token
from .integrations import r2_storage_client


@dataclass
class InMemoryStore:
    users: dict[str, UserRecord] = field(default_factory=dict)
    accounts: dict[str, AccountRecord] = field(default_factory=dict)
    workspaces: dict[str, WorkspaceRecord] = field(default_factory=dict)
    schedules: dict[str, ScheduleRecord] = field(default_factory=dict)
    images: dict[str, ImageRecord] = field(default_factory=dict)
    environments: dict[str, EnvironmentRecord] = field(default_factory=dict)
    api_keys: dict[str, ApiKeyRecord] = field(default_factory=dict)
    secrets: dict[str, SecretRecord] = field(default_factory=dict)
    invites: dict[str, InviteRecord] = field(default_factory=dict)
    providers: dict[str, ProviderRecord] = field(default_factory=dict)
    volumes: dict[str, VolumeRecord] = field(default_factory=dict)
    workloads: dict[str, WorkloadRecord] = field(default_factory=dict)
    routes: dict[str, RouteRecord] = field(default_factory=dict)
    sessions: dict[str, SandboxSessionRecord] = field(default_factory=dict)
    usages: dict[str, UsageRecord] = field(default_factory=dict)
    proxy_tokens: dict[str, Any] = field(default_factory=dict)
    environment_members: dict[str, Any] = field(default_factory=dict)
    workspace_members: dict[str, Any] = field(default_factory=dict)
    password_resets: dict[str, Any] = field(default_factory=dict)
    volume_entries: dict[str, Any] = field(default_factory=dict)
    volume_snapshots: dict[str, Any] = field(default_factory=dict)
    function_autoscalers: dict[str, Any] = field(default_factory=dict)
    function_stats: dict[str, Any] = field(default_factory=dict)
    invocations: dict[str, FunctionInvocationResponse] = field(default_factory=dict)
    logs: dict[str, WorkloadLogEntry] = field(default_factory=dict)
    payments: dict[str, PaymentRecord] = field(default_factory=dict)
    billing_history: dict[str, BillingHistoryRecord] = field(default_factory=dict)

    def _put_item(self, item: SingleTableItem) -> None:
        try:
            dynamo_mirror.put_item(item)
        except Exception as exc:  # pragma: no cover - external integration
            print(f"[DynamoMirror] put failed: {exc}")

    def _delete_item(self, pk: str, sk: str) -> None:
        try:
            dynamo_mirror.delete_item(pk, sk)
        except Exception as exc:  # pragma: no cover - external integration
            print(f"[DynamoMirror] delete failed: {exc}")

    def load_from_dynamodb(self) -> None:
        """Load all items from DynamoDB into the in-memory store."""
        try:
            raw_items = dynamo_mirror.scan_all()
        except Exception as exc:  # pragma: no cover - external integration
            print(f"[DynamoMirror] scan failed: {exc}")
            return

        for raw in raw_items:
            entity_type = raw.get("entity_type")
            attrs = {k: v for k, v in raw.items() if k not in ("pk", "sk", "entity_type")}
            try:
                if entity_type == "User":
                    record = UserRecord(**attrs)
                    self.users[record.user_id] = record
                elif entity_type == "Account":
                    record = AccountRecord(**attrs)
                    self.accounts[record.user_id] = record
                elif entity_type == "Workspace":
                    record = WorkspaceRecord(**attrs)
                    self.workspaces[record.workspace_id] = record
                elif entity_type == "Environment":
                    record = EnvironmentRecord(**attrs)
                    self.environments[record.environment_id] = record
                elif entity_type == "ApiKey":
                    record = ApiKeyRecord(**attrs)
                    self.api_keys[record.api_key_id] = record
                elif entity_type == "Secret":
                    record = SecretRecord(**attrs)
                    self.secrets[record.secret_id] = record
                elif entity_type == "Invite":
                    record = InviteRecord(**attrs)
                    self.invites[record.invite_id] = record
                elif entity_type == "Provider":
                    record = ProviderRecord(**attrs)
                    self.providers[record.provider_id] = record
                elif entity_type == "Volume":
                    record = VolumeRecord(**attrs)
                    self.volumes[record.volume_id] = record
                elif entity_type == "Workload":
                    record = WorkloadRecord(**attrs)
                    self.workloads[record.workload_id] = record
                elif entity_type == "Route":
                    record = RouteRecord(**attrs)
                    self.routes[record.route_id] = record
            except Exception as exc:  # pragma: no cover - data migration edge cases
                print(f"[DynamoMirror] load failed for {entity_type}: {exc}")

    def _provider_is_stale(self, provider: ProviderRecord) -> bool:
        age = utc_now() - provider.updated_at
        return age.total_seconds() > settings.provider_heartbeat_ttl_seconds

    @staticmethod
    def _hash_provider_token(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    def expire_stale_providers(self) -> None:
        for provider_id, provider in list(self.providers.items()):
            if provider.status != ProviderStatus.offline and self._provider_is_stale(provider):
                provider.status = ProviderStatus.offline
                provider.available_slots = 0
                provider.updated_at = utc_now()
                self.providers[provider_id] = provider
                self._put_item(provider_item(provider))

    def reclaim_expired_assignments(self) -> None:
        now = utc_now()
        for workload_id, workload in list(self.workloads.items()):
            if workload.status != WorkloadStatus.claimed:
                continue
            if not workload.claim_lease_expires_at or workload.claim_lease_expires_at > now:
                continue
            workload.status = WorkloadStatus.scheduled
            workload.claimed_by_provider_id = None
            workload.claim_lease_expires_at = None
            workload.updated_at = now
            self.workloads[workload_id] = workload
            self._put_item(workload_item(workload))

            if workload.assigned_provider_id and workload.assigned_provider_id in self.providers:
                provider = self.providers[workload.assigned_provider_id]
                provider.available_slots += 1
                provider.running_workloads = max(0, provider.running_workloads - 1)
                provider.updated_at = now
                self.providers[provider.provider_id] = provider
                self._put_item(provider_item(provider))

    def pricing(self) -> PricingRate:
        return PricingRate(
            cpu_price_per_vcpu_hour_usd=settings.cpu_price_per_vcpu_hour_usd,
            ram_price_per_gb_hour_usd=settings.ram_price_per_gb_hour_usd,
            gpu_price_per_gpu_hour_usd=settings.gpu_price_per_gpu_hour_usd,
            storage_price_per_gb_hour_usd=settings.storage_price_per_gb_hour_usd,
        )

    def create_account(self, user_id: str, organization_id: str | None = None) -> AccountRecord:
        account = AccountRecord(
            user_id=user_id,
            organization_id=organization_id,
            balance_usd=settings.bootstrap_credit_usd,
            credit_grants_usd=settings.bootstrap_credit_usd,
        )
        self.accounts[user_id] = account
        self._put_item(account_item(account))
        return account

    def get_account(self, user_id: str) -> AccountRecord:
        return self.accounts[user_id]

    def _hash_password(self, password: str) -> str:
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest()

    def register_user(
        self,
        user_id: str,
        external_user_id: str,
        email: str | None = None,
        password: str | None = None,
        organization_id: str | None = None,
        oauth_provider: str | None = None,
        oauth_provider_user_id: str | None = None,
    ) -> tuple[UserRecord, AccountRecord, WorkspaceRecord, EnvironmentRecord]:
        default_workspace_name = external_user_id
        workspace = WorkspaceRecord(
            owner_id=user_id,
            name=default_workspace_name,
            is_default=True,
        )
        environment = EnvironmentRecord(
            workspace_id=workspace.workspace_id,
            name="main",
            is_default=True,
        )
        user = UserRecord(
            user_id=user_id,
            external_user_id=external_user_id,
            email=email,
            password_hash=self._hash_password(password) if password else None,
            organization_id=organization_id,
            default_workspace_id=workspace.workspace_id,
            oauth_provider=oauth_provider,
            oauth_provider_user_id=oauth_provider_user_id,
        )
        account = self.create_account(user_id, organization_id)
        self.users[user_id] = user
        self.workspaces[workspace.workspace_id] = workspace
        self.environments[environment.environment_id] = environment
        self._put_item(user_item(user))
        self._put_item(workspace_item(workspace))
        self._put_item(environment_item(environment))
        return user, account, workspace, environment

    def get_user(self, user_id: str) -> UserRecord:
        return self.users[user_id]

    def find_or_create_oauth_user(
        self,
        provider: str,
        provider_user_id: str,
        email: str | None,
        name: str | None,
    ) -> tuple[UserRecord, AccountRecord, WorkspaceRecord, EnvironmentRecord]:
        """Look up an OAuth user or create one with a default workspace and environment."""
        for user in self.users.values():
            if user.oauth_provider == provider and user.oauth_provider_user_id == provider_user_id:
                workspace = self.workspaces[user.default_workspace_id]
                environment = next(
                    e for e in self.environments.values() if e.workspace_id == workspace.workspace_id
                )
                return (user, self.accounts[user.user_id], workspace, environment)

        user_id = generated_id("usr")
        external_user_id = f"{provider}:{provider_user_id}"
        return self.register_user(
            user_id=user_id,
            external_user_id=external_user_id,
            email=email,
            password=None,
            oauth_provider=provider,
            oauth_provider_user_id=provider_user_id,
        )

    def list_workspaces(self, owner_id: str | None = None) -> list[WorkspaceRecord]:
        items = list(self.workspaces.values())
        if owner_id:
            items = [workspace for workspace in items if workspace.owner_id == owner_id]
        return items

    def create_workspace(self, request: WorkspaceCreateRequest) -> WorkspaceRecord:
        if request.owner_id not in self.users:
            raise ValueError("owner not found")
        workspace = WorkspaceRecord(owner_id=request.owner_id, name=request.name)
        self.workspaces[workspace.workspace_id] = workspace
        self._put_item(workspace_item(workspace))
        return workspace

    def delete_workspace(self, workspace_id: str) -> bool:
        workspace = self.workspaces[workspace_id]
        if workspace.is_default:
            raise ValueError("default workspace cannot be deleted")
        del self.workspaces[workspace_id]
        self._delete_item(f"WORKSPACE#{workspace_id}", "PROFILE")
        for environment_id, environment in list(self.environments.items()):
            if environment.workspace_id == workspace_id:
                del self.environments[environment_id]
                self._delete_item(f"WORKSPACE#{workspace_id}", f"ENVIRONMENT#{environment.environment_id}")
        return True

    def list_environments(self, workspace_id: str) -> list[EnvironmentRecord]:
        return [environment for environment in self.environments.values() if environment.workspace_id == workspace_id]

    def create_environment(self, request: EnvironmentCreateRequest) -> EnvironmentRecord:
        if request.workspace_id not in self.workspaces:
            raise ValueError("workspace not found")
        environment = EnvironmentRecord(workspace_id=request.workspace_id, name=request.name)
        self.environments[environment.environment_id] = environment
        self._put_item(environment_item(environment))
        return environment

    def delete_environment(self, environment_id: str) -> bool:
        environment = self.environments[environment_id]
        if environment.is_default:
            raise ValueError("default environment cannot be deleted")
        del self.environments[environment_id]
        self._delete_item(f"WORKSPACE#{environment.workspace_id}", f"ENVIRONMENT#{environment.environment_id}")
        return True

    def create_api_key(self, request: ApiKeyCreateRequest) -> ApiKeyRecord:
        if request.owner_id not in self.users:
            raise ValueError("owner not found")
        workspace = self.workspaces.get(request.workspace_id)
        environment = self.environments.get(request.environment_id)
        if not workspace or workspace.owner_id != request.owner_id:
            raise ValueError("workspace not found")
        if not environment or environment.workspace_id != request.workspace_id:
            raise ValueError("environment not found")
        token = generate_token("bx_", 32)
        salt = generate_salt()
        api_key = ApiKeyRecord(
            owner_id=request.owner_id,
            workspace_id=request.workspace_id,
            environment_id=request.environment_id,
            name=request.name,
            secret_preview=f"{token[:12]}...",
            secret_token_hash=hash_token(token, salt),
            secret_token_salt=salt,
            secret_token="",
        )
        self.api_keys[api_key.api_key_id] = api_key
        self._put_item(api_key_item(api_key))
        return api_key

    def verify_api_key(self, api_key_id: str, token: str) -> ApiKeyRecord | None:
        """Verify an API key token against its stored hash."""
        api_key = self.api_keys.get(api_key_id)
        if not api_key or not token:
            return None
        if api_key.secret_token_salt:
            if verify_token(token, api_key.secret_token_salt, api_key.secret_token_hash):
                return api_key
            return None
        # Backward compatibility: legacy plaintext tokens.
        if api_key.secret_token and api_key.secret_token == token:
            return api_key
        return None

    def list_api_keys(self, workspace_id: str | None = None) -> list[ApiKeyRecord]:
        items = list(self.api_keys.values())
        if workspace_id:
            items = [api_key for api_key in items if api_key.workspace_id == workspace_id]
        return items

    def create_secret(self, request: SecretCreateRequest) -> SecretRecord:
        if request.workspace_id not in self.workspaces:
            raise ValueError("workspace not found")
        if not request.name.strip():
            raise ValueError("secret name is required")
        if not request.env_vars:
            raise ValueError("secret must contain at least one env var")

        encrypted = secret_cipher.encrypt_env_vars(request.env_vars)
        existing = next((record for record in self.secrets.values() if record.workspace_id == request.workspace_id and record.name == request.name), None)
        if existing:
            existing.encrypted_env_vars = encrypted
            existing.key_names = sorted(request.env_vars.keys())
            existing.updated_at = utc_now()
            self.secrets[existing.secret_id] = existing
            self._put_item(secret_item(existing))
            return existing

        secret = SecretRecord(
            workspace_id=request.workspace_id,
            name=request.name,
            key_names=sorted(request.env_vars.keys()),
            encrypted_env_vars=encrypted,
        )
        self.secrets[secret.secret_id] = secret
        self._put_item(secret_item(secret))
        return secret

    def list_secrets(self, workspace_id: str | None = None) -> list[SecretRecord]:
        items = list(self.secrets.values())
        if workspace_id:
            items = [secret for secret in items if secret.workspace_id == workspace_id]
        return items

    def delete_secret(self, workspace_id: str, name: str) -> bool:
        for secret_id, secret in list(self.secrets.items()):
            if secret.workspace_id == workspace_id and secret.name == name:
                del self.secrets[secret_id]
                self._delete_item(f"WORKSPACE#{workspace_id}", f"SECRET#{secret_id}")
                return True
        return False

    def resolve_secret_env_vars(self, workspace_id: str, secret_names: list[str]) -> dict[str, str]:
        resolved: dict[str, str] = {}
        for secret_name in secret_names:
            secret = next(
                (
                    record
                    for record in self.secrets.values()
                    if record.workspace_id == workspace_id and record.name == secret_name
                ),
                None,
            )
            if not secret:
                raise ValueError(f"secret not found: {secret_name}")
            resolved.update(secret_cipher.decrypt_env_vars(secret.encrypted_env_vars))
        return resolved

    def create_volume(self, request: VolumeCreateRequest) -> VolumeRecord:
        if request.workspace_id not in self.workspaces:
            raise ValueError("workspace not found")
        if request.volume_type not in {"object-storage", "block-storage"}:
            raise ValueError("volume_type must be object-storage or block-storage")
        if any(volume.workspace_id == request.workspace_id and volume.name == request.name for volume in self.volumes.values()):
            raise ValueError(f"volume '{request.name}' already exists in workspace")
        volume = VolumeRecord(
            workspace_id=request.workspace_id,
            name=request.name,
            size_gb=request.size_gb,
            volume_type=request.volume_type,
        )
        self.volumes[volume.volume_id] = volume
        self._put_item(volume_item(volume))
        return volume

    def list_volumes(self, workspace_id: str | None = None) -> list[VolumeRecord]:
        items = list(self.volumes.values())
        if workspace_id:
            items = [volume for volume in items if volume.workspace_id == workspace_id]
        return items

    def delete_volume(self, workspace_id: str, locator: str) -> bool:
        for volume_id, volume in list(self.volumes.items()):
            if volume.workspace_id == workspace_id and (volume.volume_id == locator or volume.name == locator):
                prefix = f"volumes/{volume.volume_id}/"
                for item in r2_storage_client.list_keys(prefix):
                    r2_storage_client.delete_key(str(item["key"]))
                del self.volumes[volume_id]
                self._delete_item(f"WORKSPACE#{workspace_id}", f"VOLUME#{volume_id}")
                return True
        return False

    def resolve_volume(self, locator: str) -> VolumeRecord:
        for volume in self.volumes.values():
            if volume.volume_id == locator or volume.name == locator:
                return volume
        raise KeyError("volume not found")

    def normalize_volume_mounts(self, workspace_id: str, mounts: list[VolumeMount]) -> list[VolumeMount]:
        normalized: list[VolumeMount] = []
        seen_paths: set[str] = set()
        for mount in mounts:
            volume = self.resolve_volume(mount.locator)
            if volume.workspace_id != workspace_id:
                raise ValueError(f"volume '{mount.locator}' does not belong to workspace")
            mount_path = mount.mount_path.strip()
            if not mount_path.startswith("/"):
                raise ValueError("volume mount paths must be absolute")
            if mount_path in seen_paths:
                raise ValueError(f"duplicate volume mount path '{mount_path}'")
            seen_paths.add(mount_path)
            normalized.append(
                VolumeMount(
                    locator=volume.volume_id,
                    mount_path=mount_path,
                    read_only=mount.read_only,
                )
            )
        return normalized

    def list_volume_entries(self, locator: str, prefix: str = "") -> list[VolumeEntryRecord]:
        volume = self.resolve_volume(locator)
        base_prefix = f"volumes/{volume.volume_id}/"
        cleaned = prefix.strip().strip("/")
        if cleaned:
            base_prefix = f"{base_prefix}{cleaned}/"
        entries = []
        for item in r2_storage_client.list_keys(base_prefix):
            key = str(item["key"])
            relative = key.removeprefix(f"volumes/{volume.volume_id}/")
            if not relative:
                continue
            entries.append(VolumeEntryRecord(path=relative, entry_type="file", size=int(item.get("size", 0))))
        return entries

    def write_volume_blob(self, locator: str, relative_path: str, data: bytes, content_type: str = "application/octet-stream") -> VolumeEntryRecord:
        volume = self.resolve_volume(locator)
        cleaned = relative_path.strip().strip("/")
        if not cleaned:
            raise ValueError("path is required")
        key = f"volumes/{volume.volume_id}/{cleaned}"
        r2_storage_client.put_bytes(key, data, content_type=content_type)
        return VolumeEntryRecord(path=cleaned, entry_type="file", size=len(data))

    def read_volume_blob(self, locator: str, relative_path: str) -> bytes:
        volume = self.resolve_volume(locator)
        cleaned = relative_path.strip().strip("/")
        if not cleaned:
            raise ValueError("path is required")
        key = f"volumes/{volume.volume_id}/{cleaned}"
        return r2_storage_client.get_bytes(key)

    def delete_volume_blob(self, locator: str, relative_path: str) -> bool:
        volume = self.resolve_volume(locator)
        cleaned = relative_path.strip().strip("/")
        if not cleaned:
            raise ValueError("path is required")
        key = f"volumes/{volume.volume_id}/{cleaned}"
        r2_storage_client.delete_key(key)
        return True

    def create_invite(self, request: InviteCreateRequest) -> InviteRecord:
        workspace = self.workspaces.get(request.workspace_id)
        if not workspace:
            raise ValueError("workspace not found")
        if workspace.owner_id != request.inviter_user_id:
            raise ValueError("only workspace owner can invite")
        invite = InviteRecord(
            inviter_user_id=request.inviter_user_id,
            workspace_id=request.workspace_id,
            email=request.email,
            role=request.role,
        )
        self.invites[invite.invite_id] = invite
        self._put_item(invite_item(invite))
        try:
            invite_email_sender.send(invite, workspace.name)
        except Exception as exc:  # pragma: no cover - external integration
            print(f"[InviteEmail] send failed: {exc}")
        return invite

    def list_invites(self, workspace_id: str | None = None) -> list[InviteRecord]:
        items = list(self.invites.values())
        if workspace_id:
            items = [invite for invite in items if invite.workspace_id == workspace_id]
        return items

    def register_provider(self, request: ProviderRegistrationRequest) -> ProviderRegistrationResponse:
        provider_token = generate_token("bwp_", 24)
        salt = generate_salt()
        provider = ProviderRecord(
            provider_name=request.provider_name,
            region=request.region,
            pool=request.pool,
            public_base_url=request.public_base_url,
            control_callback_url=request.control_callback_url,
            session_access_mode=request.session_access_mode,
            labels=request.labels,
            capabilities=request.capabilities,
            auth_token_hash=hash_token(provider_token, salt),
            auth_token_salt=salt,
        )
        self.providers[provider.provider_id] = provider
        self._put_item(provider_item(provider))
        provider_data = provider.model_dump(mode="json")
        provider_data.pop("auth_token_hash", None)
        return ProviderRegistrationResponse(
            provider_id=provider.provider_id,
            provider_token=provider_token,
            provider=provider_data,
        )

    def verify_provider_token(self, provider_id: str, token: str) -> bool:
        provider = self.providers.get(provider_id)
        if not provider or not token:
            return False
        if provider.auth_token_salt:
            return verify_token(token, provider.auth_token_salt, provider.auth_token_hash)
        # Backward compatibility: legacy providers registered without a salt
        # used plain SHA256. This path can be removed once all providers are
        # migrated to salted HMAC hashes.
        return provider.auth_token_hash == self._hash_provider_token(token)

    def heartbeat_provider(self, provider_id: str, request: ProviderHeartbeatRequest) -> ProviderRecord:
        provider = self.providers[provider_id]
        provider.available_slots = request.available_slots
        provider.running_workloads = request.running_workloads
        provider.status = request.status
        provider.updated_at = utc_now()
        self.providers[provider_id] = provider
        self._put_item(provider_item(provider))
        return provider

    def unregister_provider(self, provider_id: str) -> None:
        self.providers.pop(provider_id, None)
        self._delete_item(f"PROVIDER#{provider_id}", "PROFILE")
        now = utc_now()
        for workload_id, workload in list(self.workloads.items()):
            if workload.assigned_provider_id != provider_id:
                continue
            if workload.status == WorkloadStatus.scheduled:
                workload.assigned_provider_id = None
                workload.updated_at = now
                self.workloads[workload_id] = workload
                self._put_item(workload_item(workload))
            elif workload.status in {WorkloadStatus.claimed, WorkloadStatus.running}:
                workload.status = WorkloadStatus.failed
                workload.claimed_by_provider_id = None
                workload.claim_lease_expires_at = None
                workload.assigned_provider_id = None
                workload.updated_at = now
                self.workloads[workload_id] = workload
                self._put_item(workload_item(workload))

    def select_backend(self, request: WorkloadCreateRequest) -> tuple[ExecutionBackend, str | None]:
        self.expire_stale_providers()
        self.reclaim_expired_assignments()
        gpu_needed = request.resources.gpu_count > 0 or bool(request.resources.gpu_type)
        if request.requested_backend:
            if request.requested_backend == ExecutionBackend.runpod_serverless:
                return ExecutionBackend.runpod_serverless, None

        eligible = [
            provider
            for provider in self.providers.values()
            if provider.status == ProviderStatus.online
            and provider.pool == (request.pool or settings.default_provider_pool)
            and provider.region == (request.region or provider.region)
            and provider.available_slots > 0
            and provider.capabilities.cpu_cores >= request.resources.cpu_cores
            and provider.capabilities.memory_mb >= request.resources.memory_mb
            and provider.capabilities.disk_gb >= request.resources.disk_gb
            and provider.capabilities.gpu_count >= request.resources.gpu_count
            and (not gpu_needed or provider.capabilities.gpu_type == request.resources.gpu_type or request.resources.gpu_type is None)
            and (
                request.kind != WorkloadKind.endpoint
                or provider.capabilities.supports_endpoint_serving
            )
        ]
        if eligible:
            selected = sorted(eligible, key=lambda provider: (-provider.available_slots, provider.updated_at))[0]
            return ExecutionBackend.provider, selected.provider_id

        if request.allow_runpod_fallback and settings.runpod_enabled:
            return ExecutionBackend.runpod_serverless, None

        raise ValueError("no eligible backend available")

    def create_workload(self, request: WorkloadCreateRequest) -> WorkloadRecord:
        if request.owner_id not in self.accounts:
            raise ValueError("owner account not found")
        workspace = self.workspaces.get(request.workspace_id)
        environment = self.environments.get(request.environment_id)
        if not workspace or workspace.owner_id != request.owner_id:
            raise ValueError("workspace not found")
        if not environment or environment.workspace_id != request.workspace_id:
            raise ValueError("environment not found")
        if request.secret_names:
            self.resolve_secret_env_vars(request.workspace_id, request.secret_names)
        try:
            volume_mounts = self.normalize_volume_mounts(request.workspace_id, request.volume_mounts)
        except KeyError as exc:
            raise ValueError("volume not found") from exc
        backend, provider_id = self.select_backend(request)
        workload = WorkloadRecord(
            owner_id=request.owner_id,
            workspace_id=request.workspace_id,
            environment_id=request.environment_id,
            kind=request.kind,
            image=request.image,
            command=request.command,
            env=request.env,
            region=request.region or settings.default_region,
            pool=request.pool or settings.default_provider_pool,
            requested_backend=request.requested_backend,
            selected_backend=backend,
            secret_names=request.secret_names,
            volume_mounts=volume_mounts,
            assigned_provider_id=provider_id,
            endpoint_name=request.endpoint_name,
            metadata=request.metadata,
            resources=request.resources,
            status=WorkloadStatus.scheduled,
        )
        if provider_id:
            provider = self.providers[provider_id]
            provider.available_slots = max(0, provider.available_slots - 1)
            provider.running_workloads += 1
            provider.updated_at = utc_now()
            self.providers[provider_id] = provider
        self.workloads[workload.workload_id] = workload
        self._put_item(workload_item(workload))
        return workload

    def claim_next_assignment(self, provider_id: str) -> WorkerAssignmentRecord | None:
        self.expire_stale_providers()
        self.reclaim_expired_assignments()
        provider = self.providers[provider_id]
        if provider.status != ProviderStatus.online:
            return None
        for workload in self.workloads.values():
            if workload.assigned_provider_id != provider_id:
                continue
            if workload.status != WorkloadStatus.scheduled:
                continue
            workload.status = WorkloadStatus.claimed
            workload.claimed_by_provider_id = provider_id
            workload.claim_lease_expires_at = utc_now() + timedelta(seconds=settings.assignment_lease_ttl_seconds)
            workload.updated_at = utc_now()
            self.workloads[workload.workload_id] = workload
            self._put_item(workload_item(workload))
            provider.updated_at = utc_now()
            self.providers[provider_id] = provider
            self._put_item(provider_item(provider))
            return WorkerAssignmentRecord(provider_id=provider_id, workload=workload)
        return None

    def workload_launch_spec(self, workload_id: str) -> WorkloadLaunchSpec:
        workload = self.workloads[workload_id]
        resolved_env = dict(workload.env)
        if workload.secret_names:
            resolved_env.update(self.resolve_secret_env_vars(workload.workspace_id, workload.secret_names))
        return WorkloadLaunchSpec(workload=workload, env=resolved_env)

    def update_workload_status(self, workload_id: str, request: WorkloadStatusUpdateRequest) -> WorkloadRecord:
        workload = self.workloads[workload_id]
        workload.status = request.status
        if request.status != WorkloadStatus.claimed:
            workload.claim_lease_expires_at = None
        workload.runtime_details.update(request.runtime_details)
        workload.updated_at = utc_now()
        self.workloads[workload_id] = workload
        self._put_item(workload_item(workload))
        if (
            workload.assigned_provider_id
            and workload.assigned_provider_id in self.providers
            and request.status in {WorkloadStatus.completed, WorkloadStatus.failed, WorkloadStatus.stopped}
        ):
            provider = self.providers[workload.assigned_provider_id]
            provider.available_slots += 1
            provider.running_workloads = max(0, provider.running_workloads - 1)
            provider.updated_at = utc_now()
            self.providers[provider.provider_id] = provider
            self._put_item(provider_item(provider))
        return workload

    def publish_route(self, request: RoutePublishRequest) -> RouteRecord:
        workload = self.workloads[request.workload_id]
        if workload.kind == WorkloadKind.sandbox:
            raise ValueError("sandbox workloads cannot publish public routes")

        if workload.selected_backend == ExecutionBackend.provider:
            provider = self.providers.get(workload.assigned_provider_id or "")
            if not provider or not provider.public_base_url:
                raise ValueError("provider route target is not publicly reachable")
            target = provider.public_base_url
        else:
            target = workload.external_backend_id or f"runpod://{workload.workload_id}"

        route = RouteRecord(
            workload_id=workload.workload_id,
            hostname=request.hostname,
            path_prefix=request.path_prefix,
            target_backend=workload.selected_backend or ExecutionBackend.provider,
            target_address=target,
        )
        self.routes[route.route_id] = route
        self._put_item(route_item(route))
        return route

    def create_sandbox_session(self, request: SandboxSessionRequest) -> SandboxSessionRecord:
        workload = self.workloads[request.workload_id]
        if workload.kind != WorkloadKind.sandbox:
            raise ValueError("interactive sessions are allowed only for sandbox workloads")

        if workload.selected_backend != ExecutionBackend.provider:
            raise ValueError("interactive sessions require a provider-backed sandbox")

        provider = self.providers.get(workload.assigned_provider_id or "")
        if not provider:
            raise ValueError("provider not found")
        if provider.session_access_mode.value != "sandbox_only":
            raise ValueError("provider does not allow sandbox sessions")

        session = SandboxSessionRecord(
            workload_id=request.workload_id,
            requester_id=request.requester_id,
            ttl_seconds=request.ttl_seconds,
        )
        self.sessions[session.session_id] = session
        return session

    def get_sandbox_session_by_token(self, token: str) -> SandboxSessionRecord | None:
        now = utc_now()
        for session in self.sessions.values():
            if session.token != token:
                continue
            if (now - session.created_at).total_seconds() > session.ttl_seconds:
                return None
            return session
        return None

    def attach_runpod_backend(self, workload_id: str, external_id: str) -> WorkloadRecord:
        workload = self.workloads[workload_id]
        workload.external_backend_id = external_id
        workload.selected_backend = ExecutionBackend.runpod_serverless
        workload.status = WorkloadStatus.running
        workload.updated_at = utc_now()
        self.workloads[workload_id] = workload
        self._put_item(workload_item(workload))
        return workload

    def meter_usage(self, request: UsageMeterRequest) -> UsageMeterResponse:
        workload = self.workloads[request.workload_id]
        account = self.accounts[workload.owner_id]
        rates = self.pricing()

        incremental_cost = (
            (request.cpu_seconds / 3600.0) * rates.cpu_price_per_vcpu_hour_usd
            + (request.ram_gb_seconds / 3600.0) * rates.ram_price_per_gb_hour_usd
            + (request.gpu_seconds / 3600.0) * rates.gpu_price_per_gpu_hour_usd
            + (request.storage_gb_seconds / 3600.0) * rates.storage_price_per_gb_hour_usd
        )

        incremental_cost = round(incremental_cost, 6)
        account.balance_usd = round(account.balance_usd - incremental_cost, 6)
        account.total_spend_usd = round(account.total_spend_usd + incremental_cost, 6)
        account.updated_at = utc_now()
        workload.accrued_cost_usd = round(workload.accrued_cost_usd + incremental_cost, 6)
        workload.updated_at = utc_now()

        self.accounts[account.user_id] = account
        self.workloads[workload.workload_id] = workload
        self._put_item(account_item(account))
        self._put_item(workload_item(workload))

        return UsageMeterResponse(
            workload_id=workload.workload_id,
            owner_id=workload.owner_id,
            incremental_cost_usd=incremental_cost,
            workload_total_cost_usd=workload.accrued_cost_usd,
            account_balance_usd=account.balance_usd,
        )

    def export_single_table_items(self) -> list[SingleTableItem]:
        items: list[SingleTableItem] = []
        items.extend(user_item(record) for record in self.users.values())
        items.extend(account_item(record) for record in self.accounts.values())
        items.extend(workspace_item(record) for record in self.workspaces.values())
        items.extend(environment_item(record) for record in self.environments.values())
        items.extend(api_key_item(record) for record in self.api_keys.values())
        items.extend(secret_item(record) for record in self.secrets.values())
        items.extend(invite_item(record) for record in self.invites.values())
        items.extend(provider_item(record) for record in self.providers.values())
        items.extend(volume_item(record) for record in self.volumes.values())
        items.extend(workload_item(record) for record in self.workloads.values())
        items.extend(route_item(record) for record in self.routes.values())
        return items

    def login(self, external_user_id: str, email: str | None = None) -> LoginResponse:
        user = next((u for u in self.users.values() if u.external_user_id == external_user_id), None)
        if not user:
            raise KeyError("user not found")
        return LoginResponse(user_id=user.user_id, access_token=issued_access_token(external_user_id))

    def delete_api_key(self, api_key_id: str) -> bool:
        if api_key_id not in self.api_keys:
            return False
        del self.api_keys[api_key_id]
        self._delete_item(f"APIKEY#{api_key_id}", "PROFILE")
        return True

    def delete_workload(self, workload_id: str) -> bool:
        if workload_id not in self.workloads:
            return False
        workload = self.workloads[workload_id]
        if workload.assigned_provider_id and workload.assigned_provider_id in self.providers:
            provider = self.providers[workload.assigned_provider_id]
            provider.available_slots += 1
            provider.running_workloads = max(0, provider.running_workloads - 1)
            provider.updated_at = utc_now()
            self.providers[provider.provider_id] = provider
            self._put_item(provider_item(provider))
        del self.workloads[workload_id]
        self._delete_item(f"WORKLOAD#{workload_id}", "PROFILE")
        return True

    def list_routes(self, workspace_id: str | None = None, environment_id: str | None = None) -> list[RouteRecord]:
        items = list(self.routes.values())
        if workspace_id or environment_id:
            workload_ids = {w.workload_id for w in self.workloads.values() if (not workspace_id or w.workspace_id == workspace_id) and (not environment_id or w.environment_id == environment_id)}
            items = [route for route in items if route.workload_id in workload_ids]
        return items

    def delete_route(self, route_id: str) -> bool:
        if route_id not in self.routes:
            return False
        del self.routes[route_id]
        self._delete_item(f"ROUTE#{route_id}", "PROFILE")
        return True

    def list_usage(self, workload_id: str | None = None, owner_id: str | None = None) -> list[UsageRecord]:
        items = list(self.usages.values())
        if workload_id:
            items = [u for u in items if u.workload_id == workload_id]
        if owner_id:
            items = [u for u in items if u.owner_id == owner_id]
        return items

    def billing_balance(self, user_id: str) -> BillingBalanceResponse:
        account = self.accounts[user_id]
        return BillingBalanceResponse(
            user_id=user_id,
            balance_usd=account.balance_usd,
            credit_grants_usd=account.credit_grants_usd,
            total_spend_usd=account.total_spend_usd,
        )

    def billing_usage(self, user_id: str) -> BillingUsageResponse:
        account = self.accounts[user_id]
        now = utc_now()
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return BillingUsageResponse(
            user_id=user_id,
            total_spend_usd=account.total_spend_usd,
            period_start=start,
            period_end=now,
        )

    def add_credits(self, user_id: str, amount_usd: float) -> BillingCreditsResponse:
        account = self.accounts[user_id]
        account.balance_usd = round(account.balance_usd + amount_usd, 6)
        account.credit_grants_usd = round(account.credit_grants_usd + amount_usd, 6)
        account.updated_at = utc_now()
        self.accounts[user_id] = account
        self._put_item(account_item(account))
        
        # Add billing history entry
        history = BillingHistoryRecord(
            user_id=user_id,
            type="credit_purchase",
            amount_usd=amount_usd,
            description=f"Added ${amount_usd:.2f} credits",
        )
        self.billing_history[history.history_id] = history
        self._put_item(billing_history_item(history))
        
        return BillingCreditsResponse(
            user_id=user_id,
            amount_usd=amount_usd,
            new_balance_usd=account.balance_usd,
        )

    def update_account_stripe_customer(self, user_id: str, stripe_customer_id: str) -> AccountRecord:
        account = self.accounts[user_id]
        account.stripe_customer_id = stripe_customer_id
        account.updated_at = utc_now()
        self.accounts[user_id] = account
        self._put_item(account_item(account))
        return account

    def create_pending_payment(self, user_id: str, stripe_session_id: str, amount_usd: float) -> PaymentRecord:
        payment = PaymentRecord(
            user_id=user_id,
            stripe_session_id=stripe_session_id,
            amount_usd=amount_usd,
            status="pending",
        )
        self.payments[payment.payment_id] = payment
        self._put_item(payment_item(payment))
        return payment

    def get_pending_payment_by_session(self, stripe_session_id: str) -> PaymentRecord | None:
        for payment in self.payments.values():
            if payment.stripe_session_id == stripe_session_id and payment.status == "pending":
                return payment
        return None

    def mark_payment_completed(self, payment_id: str, stripe_payment_intent_id: str) -> PaymentRecord:
        payment = self.payments[payment_id]
        payment.status = "completed"
        payment.stripe_payment_intent_id = stripe_payment_intent_id
        payment.completed_at = utc_now()
        self.payments[payment_id] = payment
        self._put_item(payment_item(payment))
        
        # Add billing history
        history = BillingHistoryRecord(
            user_id=payment.user_id,
            type="credit_purchase",
            amount_usd=payment.amount_usd,
            description=f"Credit purchase via Stripe (${payment.amount_usd:.2f})",
        )
        self.billing_history[history.history_id] = history
        self._put_item(billing_history_item(history))
        
        return payment

    def get_billing_history(self, user_id: str) -> list[BillingHistoryRecord]:
        if user_id not in self.accounts:
            raise KeyError(user_id)
        return [h for h in self.billing_history.values() if h.user_id == user_id]

    def add_usage_charge(self, user_id: str, amount_usd: float, description: str) -> BillingHistoryRecord:
        history = BillingHistoryRecord(
            user_id=user_id,
            type="usage_charge",
            amount_usd=-amount_usd,
            description=description,
        )
        self.billing_history[history.history_id] = history
        self._put_item(billing_history_item(history))
        return history

    def list_workloads_filtered(self, workspace_id: str | None = None, environment_id: str | None = None) -> list[WorkloadRecord]:
        items = list(self.workloads.values())
        if workspace_id:
            items = [w for w in items if w.workspace_id == workspace_id]
        if environment_id:
            items = [w for w in items if w.environment_id == environment_id]
        return items

    def dashboard_summary(self, workspace_id: str, environment_id: str) -> DashboardSummary:
        workloads = [w for w in self.workloads.values() if w.workspace_id == workspace_id and w.environment_id == environment_id]
        running = sum(1 for w in workloads if w.status == WorkloadStatus.running)
        failed = sum(1 for w in workloads if w.status == WorkloadStatus.failed)
        routes = len(self.list_routes(workspace_id=workspace_id, environment_id=environment_id))
        api_keys = len([k for k in self.api_keys.values() if k.workspace_id == workspace_id and k.environment_id == environment_id])
        secrets = len([s for s in self.secrets.values() if s.workspace_id == workspace_id])
        volumes = len([v for v in self.volumes.values() if v.workspace_id == workspace_id])
        balance = 0.0
        if workloads:
            owner_id = workloads[0].owner_id
            account = self.accounts.get(owner_id)
            if account:
                balance = account.balance_usd
        return DashboardSummary(
            workspace_id=workspace_id,
            environment_id=environment_id,
            total_workloads=len(workloads),
            running_workloads=running,
            failed_workloads=failed,
            total_routes=routes,
            total_api_keys=api_keys,
            total_secrets=secrets,
            total_volumes=volumes,
            balance_usd=balance,
        )

    def workload_metrics(self, workload_id: str) -> WorkloadMetrics:
        workload = self.workloads[workload_id]
        usage_items = [u for u in self.usages.values() if u.workload_id == workload_id]
        cpu_seconds = sum(u.cpu_seconds for u in usage_items)
        ram_gb_seconds = sum(u.ram_gb_seconds for u in usage_items)
        gpu_seconds = sum(u.gpu_seconds for u in usage_items)
        storage_gb_seconds = sum(u.storage_gb_seconds for u in usage_items)
        egress_gb = sum(u.egress_gb for u in usage_items)
        return WorkloadMetrics(
            workload_id=workload_id,
            cpu_seconds=cpu_seconds,
            ram_gb_seconds=ram_gb_seconds,
            gpu_seconds=gpu_seconds,
            storage_gb_seconds=storage_gb_seconds,
            egress_gb=egress_gb,
            accrued_cost_usd=workload.accrued_cost_usd,
        )

    def workload_logs(self, workload_id: str) -> list[WorkloadLogEntry]:
        return [log for log in self.logs.values() if log.workload_id == workload_id]

    def add_workload_log(self, workload_id: str, level: str, message: str) -> WorkloadLogEntry:
        log = WorkloadLogEntry(workload_id=workload_id, level=level, message=message)
        self.logs[log.log_id] = log
        return log

    def create_schedule(self, request: ScheduleCreateRequest) -> ScheduleRecord:
        schedule = ScheduleRecord(
            name=request.name,
            workspace_id=request.workspace_id,
            environment_id=request.environment_id,
            owner_id=request.owner_id,
            workload_id=request.workload_id,
            cron_expression=request.cron_expression,
            interval_seconds=request.interval_seconds,
            payload=request.payload,
        )
        self.schedules[schedule.schedule_id] = schedule
        return schedule

    def list_schedules(self, workspace_id: str | None = None, environment_id: str | None = None) -> list[ScheduleRecord]:
        items = list(self.schedules.values())
        if workspace_id:
            items = [s for s in items if s.workspace_id == workspace_id]
        if environment_id:
            items = [s for s in items if s.environment_id == environment_id]
        return items

    def get_schedule(self, schedule_id: str) -> ScheduleRecord:
        return self.schedules[schedule_id]

    def update_schedule(self, schedule_id: str, payload: dict[str, Any]) -> ScheduleRecord:
        schedule = self.schedules[schedule_id]
        for key, value in payload.items():
            if hasattr(schedule, key):
                setattr(schedule, key, value)
        schedule.updated_at = utc_now()
        return schedule

    def delete_schedule(self, schedule_id: str) -> bool:
        if schedule_id in self.schedules:
            del self.schedules[schedule_id]
            return True
        return False

    def trigger_schedule(self, schedule_id: str) -> tuple[ScheduleRecord, WorkloadRecord]:
        """Trigger a schedule manually and create a real workload from it.

        Uses the same implementation as the automatic scheduler loop so that
        both manual and scheduled triggers produce identical behavior.
        """
        return self._trigger_schedule_workload(schedule_id, force=True)

    def _build_workload_from_schedule(self, schedule: ScheduleRecord) -> WorkloadCreateRequest:
        """Build a WorkloadCreateRequest from the schedule's linked workload."""
        template = self.workloads.get(schedule.workload_id)
        if template is None:
            raise ValueError(f"template workload {schedule.workload_id} not found")
        return WorkloadCreateRequest(
            owner_id=schedule.owner_id,
            workspace_id=schedule.workspace_id,
            environment_id=schedule.environment_id,
            kind=template.kind,
            image=template.image,
            command=list(template.command),
            env=dict(template.env),
            region=template.region,
            pool=template.pool,
            endpoint_name=template.endpoint_name,
            requested_backend=template.requested_backend,
            allow_runpod_fallback=True,
            secret_names=list(template.secret_names),
            volume_mounts=[vm.model_copy() for vm in template.volume_mounts],
            resources=template.resources.model_copy() if hasattr(template.resources, "model_copy") else template.resources,
            metadata={**template.metadata, **schedule.payload, "triggered_by_schedule": schedule.schedule_id},
        )

    def _trigger_schedule_workload(
        self, schedule_id: str, force: bool = False
    ) -> tuple[ScheduleRecord, WorkloadRecord]:
        """Create a workload from a schedule and return the updated schedule + workload.

        This is the single trigger implementation used by both the automatic
        scheduler loop and the manual ``POST /schedules/{id}/trigger`` endpoint.
        When ``force`` is True, the schedule is triggered regardless of the cron or
        interval constraints. The schedule must be ``active`` unless ``force`` is True.
        """
        schedule = self.schedules.get(schedule_id)
        if schedule is None:
            raise KeyError(f"schedule {schedule_id} not found")
        if not force and schedule.status != "active":
            raise ValueError("schedule is not active")

        now = utc_now()
        request = self._build_workload_from_schedule(schedule)
        workload = self.create_workload(request)
        schedule.last_run_at = now
        schedule.next_run_at = None
        schedule.updated_at = now
        self.add_workload_log(
            workload.workload_id, "info",
            f"Triggered by schedule {schedule.schedule_id} ({schedule.name})"
        )
        return schedule, workload

    def create_image(self, request: ImageCreateRequest) -> ImageRecord:
        source_content = request.source_file_content
        if source_content:
            import base64
            try:
                source_content = base64.b64decode(source_content, validate=True).decode("utf-8")
            except Exception:
                # If decoding fails, treat as plain text for backwards compatibility
                pass
        image = ImageRecord(
            name=request.name,
            workspace_id=request.workspace_id,
            owner_id=request.owner_id,
            base_image=request.base_image,
            dockerfile=request.dockerfile,
            build_args=request.build_args,
            source_file_content=source_content,
            source_filename=request.source_filename,
        )
        self.images[image.image_id] = image
        return image

    def list_images(self, workspace_id: str | None = None) -> list[ImageRecord]:
        items = list(self.images.values())
        if workspace_id:
            items = [i for i in items if i.workspace_id == workspace_id]
        return items

    def get_image(self, image_id: str) -> ImageRecord:
        return self.images[image_id]

    def delete_image(self, image_id: str) -> bool:
        if image_id in self.images:
            del self.images[image_id]
            return True
        return False

    def build_image(self, image_id: str) -> ImageRecord:
        import subprocess
        import tempfile
        import os

        image = self.images.get(image_id)
        if image is None:
            raise KeyError(f"image {image_id} not found")

        image.status = "building"
        image.updated_at = utc_now()
        self.images[image_id] = image

        # Tag is deterministic per workspace/image
        tag = f"boxty/{image.workspace_id}/{image.name}:latest"

        with tempfile.TemporaryDirectory() as tmpdir:
            dockerfile_path = os.path.join(tmpdir, "Dockerfile")

            if image.dockerfile:
                dockerfile_content = image.dockerfile
            elif image.source_filename and image.source_filename.endswith(".py"):
                dockerfile_content = "FROM python:3.11-slim\nWORKDIR /app\nCOPY main.py /app/main.py\nCMD [\"python\", \"/app/main.py\"]\n"
            else:
                dockerfile_content = f"FROM {image.base_image or 'alpine:latest'}\n"

            with open(dockerfile_path, "w") as f:
                f.write(dockerfile_content)

            # Save source file into build context when available
            if image.source_filename and image.source_file_content:
                source_path = os.path.join(tmpdir, image.source_filename)
                try:
                    os.makedirs(os.path.dirname(source_path) or tmpdir, exist_ok=True)
                except OSError:
                    pass
                # Normalize Python source to be copied as main.py when generating Dockerfile
                if image.source_filename.endswith(".py") and not image.dockerfile:
                    source_path = os.path.join(tmpdir, "main.py")
                with open(source_path, "w") as f:
                    f.write(image.source_file_content)

            build_args = image.build_args or {}
            args_list = []
            for key, value in build_args.items():
                args_list.extend(["--build-arg", f"{key}={value}"])

            try:
                result = subprocess.run(
                    ["docker", "build", "-t", tag, "."] + args_list,
                    cwd=tmpdir,
                    capture_output=True,
                    text=True,
                    timeout=300,
                )
                image.build_log = result.stdout + result.stderr
                if result.returncode == 0:
                    image.status = "ready"
                    image.image_ref = tag
                    image.built_at = utc_now()
                else:
                    image.status = "failed"
            except subprocess.TimeoutExpired:
                image.status = "failed"
                image.build_log = "Build timed out after 5 minutes"
            except FileNotFoundError:
                image.status = "failed"
                image.build_log = "Docker not found. Please install Docker."
            except Exception as e:
                image.status = "failed"
                image.build_log = f"Build error: {str(e)}"

        image.updated_at = utc_now()
        self.images[image_id] = image
        return image

    def _select_backend_for_workload(self, workload: WorkloadRecord) -> tuple[ExecutionBackend, str | None]:
        """Mirror of select_backend using an existing workload record."""
        self.expire_stale_providers()
        self.reclaim_expired_assignments()
        gpu_needed = workload.resources.gpu_count > 0
        if workload.requested_backend:
            if workload.requested_backend == ExecutionBackend.runpod_serverless:
                return ExecutionBackend.runpod_serverless, None

        eligible = [
            provider
            for provider in self.providers.values()
            if provider.status == ProviderStatus.online
            and provider.pool == (workload.pool or settings.default_provider_pool)
            and provider.region == (workload.region or provider.region)
            and provider.available_slots > 0
            and provider.capabilities.cpu_cores >= workload.resources.cpu_cores
            and provider.capabilities.memory_mb >= workload.resources.memory_mb
            and provider.capabilities.disk_gb >= workload.resources.disk_gb
            and provider.capabilities.gpu_count >= workload.resources.gpu_count
            and (not gpu_needed or provider.capabilities.gpu_type == workload.resources.gpu_type or workload.resources.gpu_type is None)
            and (
                workload.kind != WorkloadKind.endpoint
                or provider.capabilities.supports_endpoint_serving
            )
        ]
        if eligible:
            selected = sorted(eligible, key=lambda provider: (-provider.available_slots, provider.updated_at))[0]
            return ExecutionBackend.provider, selected.provider_id

        if settings.runpod_enabled:
            return ExecutionBackend.runpod_serverless, None

        raise ValueError("no eligible backend available")

    def invoke_workload_sync(
        self,
        workload_id: str,
        request: WorkloadInvokeRequest,
        timeout_seconds: int = 300,
    ) -> FunctionInvocationResponse:
        workload = self.workloads.get(workload_id)
        if workload is None:
            raise KeyError(f"workload {workload_id} not found")
        if workload.kind != WorkloadKind.function:
            raise ValueError("invoke_sync is only supported for function workloads")

        invocation = FunctionInvocationResponse(
            workload_id=workload_id,
            status=WorkloadStatus.pending.value,
        )
        self.invocations[invocation.invocation_id] = invocation

        # Encode payload into the workload env so the worker can pass it to the container
        if request.payload:
            import json as _json
            workload.env["BOXTY_INVOCATION_PAYLOAD"] = _json.dumps(request.payload)
        workload.env["BOXTY_INVOCATION_ID"] = invocation.invocation_id
        workload.env["BOXTY_SYNC_TIMEOUT"] = str(timeout_seconds)

        # Assign a backend if the workload is not already scheduled to a provider
        if not workload.assigned_provider_id:
            backend, provider_id = self._select_backend_for_workload(workload)
            workload.selected_backend = backend
            workload.assigned_provider_id = provider_id
            if provider_id and provider_id in self.providers:
                provider = self.providers[provider_id]
                provider.available_slots = max(0, provider.available_slots - 1)
                provider.running_workloads += 1
                provider.updated_at = utc_now()
                self.providers[provider_id] = provider
                self._put_item(provider_item(provider))

        workload.status = WorkloadStatus.scheduled
        workload.updated_at = utc_now()
        self.workloads[workload_id] = workload
        self._put_item(workload_item(workload))

        invocation.status = WorkloadStatus.scheduled.value
        return invocation

    def get_invocation(self, invocation_id: str) -> FunctionInvocationResponse:
        return self.invocations[invocation_id]

    # -- proxy tokens ----------------------------------------------------------

    def create_proxy_token(self, token: ProxyToken) -> ProxyToken:
        self.proxy_tokens[token.token_id] = token
        return token

    def list_proxy_tokens(self, workspace_id: str) -> list[ProxyToken]:
        return [t for t in self.proxy_tokens.values() if t.workspace_id == workspace_id]

    def get_proxy_token(self, token_id: str) -> ProxyToken:
        return self.proxy_tokens[token_id]

    def update_proxy_token(self, token_id: str, payload: dict[str, Any]) -> ProxyToken:
        token = self.proxy_tokens[token_id]
        if "status" in payload:
            token.status = payload["status"]
        if "allowed_providers" in payload:
            token.allowed_providers = payload["allowed_providers"]
        token.updated_at = utc_now()
        return token

    def delete_proxy_token(self, token_id: str) -> bool:
        if token_id in self.proxy_tokens:
            del self.proxy_tokens[token_id]
            return True
        return False

    # -- environment members (RBAC) --------------------------------------------

    def create_environment_member(self, member: EnvironmentMember) -> EnvironmentMember:
        self.environment_members[member.member_id] = member
        return member

    def list_environment_members(self, environment_id: str) -> list[EnvironmentMember]:
        return [m for m in self.environment_members.values() if m.environment_id == environment_id]

    def get_environment_member(self, member_id: str) -> EnvironmentMember:
        return self.environment_members[member_id]

    def update_environment_member(self, member_id: str, payload: dict[str, Any]) -> EnvironmentMember:
        member = self.environment_members[member_id]
        if "role" in payload:
            member.role = payload["role"]
        if "permissions" in payload:
            member.permissions = payload["permissions"]
        member.updated_at = utc_now()
        return member

    def delete_environment_member(self, member_id: str) -> bool:
        if member_id in self.environment_members:
            del self.environment_members[member_id]
            return True
        return False

    # -- workspace members (RBAC) ------------------------------------------------

    def create_workspace_member(self, member: WorkspaceMember) -> WorkspaceMember:
        self.workspace_members[member.member_id] = member
        return member

    def list_workspace_members(self, workspace_id: str) -> list[WorkspaceMember]:
        return [m for m in self.workspace_members.values() if m.workspace_id == workspace_id]

    def get_workspace_member(self, member_id: str) -> WorkspaceMember:
        return self.workspace_members[member_id]

    def update_workspace_member(self, member_id: str, payload: dict[str, Any]) -> WorkspaceMember:
        member = self.workspace_members[member_id]
        if "role" in payload:
            member.role = payload["role"]
        if "permissions" in payload:
            member.permissions = payload["permissions"]
        member.updated_at = utc_now()
        return member

    def delete_workspace_member(self, member_id: str) -> bool:
        if member_id in self.workspace_members:
            del self.workspace_members[member_id]
            return True
        return False

    # -- password reset ----------------------------------------------------------

    def create_password_reset(self, user_id: str, email: str) -> PasswordResetRecord:
        reset = PasswordResetRecord(user_id=user_id, email=email)
        self.password_resets[reset.reset_id] = reset
        return reset

    def get_password_reset_by_token(self, token: str) -> PasswordResetRecord | None:
        for reset in self.password_resets.values():
            if reset.token == token and reset.status == "pending":
                if reset.expires_at > utc_now():
                    return reset
        return None

    def use_password_reset(self, token: str) -> PasswordResetRecord | None:
        reset = self.get_password_reset_by_token(token)
        if reset:
            reset.status = "used"
            reset.updated_at = utc_now()
        return reset

    # -- invite acceptance -------------------------------------------------------

    def get_invite_by_token(self, token: str) -> InviteRecord | None:
        for invite in self.invites.values():
            if invite.token == token and invite.status == "pending":
                return invite
        return None

    def accept_invite(self, token: str, user_id: str) -> InviteRecord:
        invite = self.get_invite_by_token(token)
        if not invite:
            raise ValueError("invite not found or already used")
        invite.status = "accepted"
        invite.updated_at = utc_now()
        # Create workspace member
        member = WorkspaceMember(
            workspace_id=invite.workspace_id,
            user_id=user_id,
            role=invite.role,
        )
        self.workspace_members[member.member_id] = member
        return invite

    # -- volume entries --------------------------------------------------------

    def create_volume_entry(self, entry: VolumeEntry) -> VolumeEntry:
        self.volume_entries[entry.entry_id] = entry
        return entry

    def list_volume_entries(self, volume_id: str, path: str = "") -> list[VolumeEntry]:
        entries = [e for e in self.volume_entries.values() if e.volume_id == volume_id]
        if path:
            entries = [e for e in entries if e.path.startswith(path)]
        return entries

    def get_volume_entry(self, entry_id: str) -> VolumeEntry:
        return self.volume_entries[entry_id]

    def delete_volume_entry(self, entry_id: str) -> bool:
        if entry_id in self.volume_entries:
            del self.volume_entries[entry_id]
            return True
        return False

    # -- volume snapshots ------------------------------------------------------

    def create_volume_snapshot(self, snapshot: VolumeSnapshot) -> VolumeSnapshot:
        self.volume_snapshots[snapshot.snapshot_id] = snapshot
        return snapshot

    def list_volume_snapshots(self, volume_id: str) -> list[VolumeSnapshot]:
        return [s for s in self.volume_snapshots.values() if s.volume_id == volume_id]

    def get_volume_snapshot(self, snapshot_id: str) -> VolumeSnapshot:
        return self.volume_snapshots[snapshot_id]

    def delete_volume_snapshot(self, snapshot_id: str) -> bool:
        if snapshot_id in self.volume_snapshots:
            del self.volume_snapshots[snapshot_id]
            return True
        return False

    # -- function autoscaler & stats -------------------------------------------

    def update_function_autoscaler(self, config: FunctionAutoscalerConfig) -> FunctionAutoscalerConfig:
        self.function_autoscalers[config.function_id] = config
        return config

    def get_function_autoscaler(self, function_id: str) -> FunctionAutoscalerConfig:
        return self.function_autoscalers[function_id]

    def get_function_stats(self, function_id: str) -> FunctionStats:
        return self.function_stats.get(function_id, FunctionStats(function_id=function_id))

    def update_function_stats(self, function_id: str, stats: FunctionStats) -> FunctionStats:
        self.function_stats[function_id] = stats
        return stats


store = InMemoryStore()


def issued_access_token(external_user_id: str) -> str:
    return f"boxty_{external_user_id}_{generated_id('tok')}"
