/**
 * Shared type definitions for the Boxty SDK.
 */

export interface WalletState {
  address: string;
  balance: number;
}

export interface ProviderState {
  pid: number;
  tier: string;
  diskGb: number;
  instances: number;
  sharedCpu: number;
  sharedRamMb: number;
  signaling: string;
  status: string;
  startedAt: string;
  updatedAt: string;
}

export interface AppInfo {
  id: number;
  name: string;
  appType: string;
  pid: number;
  runtimePid?: number;
  port?: number;
  status: string;
  updatedAt: string;
}

export interface CliState {
  wallet: WalletState | null;
  provider: ProviderState | null;
  apps: AppInfo[];
  summary: {
    providerCount: number;
    consumerCount: number;
    appCount: number;
  };
}

export interface SecretInfo {
  id: string;
  secret_id: string;
  workspace_id: string;
  name: string;
  env_vars: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface VolumeInfo {
  id: string;
  volume_id: string;
  workspace_id: string;
  name: string;
  size_gb: number;
  volume_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface VolumeEntry {
  name: string;
  path: string;
  entry_type: string;
  size: number | null;
}

export interface DatabaseInfo {
  id: string;
  database_id: string;
  workspace_id: string;
  name: string;
  pk_name: string;
  sk_name: string;
  gsi_name: string;
  gsi_pk_name: string;
  gsi_sk_name: string;
  created_at: string;
}

export interface DatabaseItem {
  item_id: string;
  pk: string;
  sk: string;
  value: Record<string, unknown>;
}

export interface DatabaseQueryParams {
  pk?: string;
  sk?: string;
  skBeginsWith?: string;
  skFrom?: string;
  skTo?: string;
  gsiPk?: string;
  gsiSk?: string;
  gsiSkBeginsWith?: string;
  gsiSkFrom?: string;
  gsiSkTo?: string;
  limit?: number;
}

export interface SecretEnvVar {
  key: string;
  value: string;
}

export interface CreateSecretPayload {
  workspace_id: string;
  name: string;
  env_vars: Record<string, string>;
}

export interface CreateVolumePayload {
  workspace_id: string;
  name: string;
  sizeGb: number;
  type: string;
}

export interface CreateDatabasePayload {
  workspace_id: string;
  name: string;
  pkName: string;
  skName: string;
  gsiName: string;
  gsiPkName: string;
  gsiSkName: string;
}

export interface PutEntryPayload {
  path: string;
  contents: string;
}

export interface PutItemPayload {
  value: Record<string, unknown>;
}

// Workload types
export interface WorkloadInfo {
  id: string;
  workload_id: string;
  owner_id: string;
  workspace_id: string;
  environment_id: string;
  kind: string;
  name: string;
  image: string;
  status: string;
  command: string[];
  env: Record<string, string>;
  region: string | null;
  pool: string | null;
  endpoint_name: string | null;
  requested_backend: string | null;
  resources: {
    cpu_cores: number;
    memory_mb: number;
    disk_gb: number;
    gpu_count: number;
    gpu_type: string | null;
  };
  created_at: string;
  updated_at: string;
}

export interface WorkspaceInfo {
  id: string;
  workspace_id: string;
  owner_id: string;
  name: string;
  description: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnvironmentInfo {
  id: string;
  environment_id: string;
  workspace_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface RouteInfo {
  id: string;
  route_id: string;
  workload_id: string;
  endpoint_name: string;
  hostname: string;
  path_prefix: string;
  created_at: string;
}

export interface ScheduleInfo {
  id: string;
  schedule_id: string;
  name: string;
  schedule_type: string;
  schedule_value: string;
  function_name: string;
  image: string | null;
  cpu: string | null;
  memory: string | null;
  gpu: string | null;
  workspace_id: string;
  environment_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ImageInfo {
  id: string;
  image_id: string;
  workspace_id: string;
  name: string;
  base_image: string | null;
  dockerfile: string | null;
  status: string;
  created_at: string;
}

export interface BillingBalance {
  user_id: string;
  balance_usd: number;
  credit_grants_usd: number;
  total_spend_usd: number;
}

export interface BillingUsage {
  user_id: string;
  period_start: string;
  period_end: string;
  cpu_hours: number;
  gpu_hours: number;
  storage_gb_hours: number;
  network_egress_gb: number;
  total_cost_usd: number;
}

export interface DashboardSummary {
  workspace_id: string;
  environment_id: string;
  total_workloads: number;
  running_workloads: number;
  failed_workloads: number;
  total_routes: number;
  total_api_keys: number;
  total_secrets: number;
  total_volumes: number;
  balance_usd: number;
}

export interface ApiKeyInfo {
  id: string;
  api_key_id: string;
  owner_id: string;
  workspace_id: string;
  environment_id: string;
  name: string;
  key_preview: string;
  created_at: string;
  updated_at: string;
}

export interface InviteInfo {
  id: string;
  invite_id: string;
  workspace_id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMemberInfo {
  member_id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface ProviderInfo {
  id: string;
  provider_id: string;
  name: string;
  region: string;
  pool: string;
  total_slots: number;
  available_slots: number;
  running_workloads: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// Missing types added
export interface PaymentInfo {
  payment_id: string;
  user_id: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_usd: number;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export interface BillingHistoryEntry {
  history_id: string;
  user_id: string;
  type: string;
  amount_usd: number;
  description: string;
  created_at: string;
}

export interface SandboxSessionInfo {
  session_id: string;
  workload_id: string;
  requester_id: string;
  token: string;
  ttl_seconds: number;
  created_at: string;
}

export interface UsageRecordInfo {
  usage_id: string;
  workload_id: string;
  owner_id: string;
  cpu_seconds: number;
  ram_gb_seconds: number;
  gpu_seconds: number;
  storage_gb_seconds: number;
  egress_gb: number;
  incremental_cost_usd: number;
  created_at: string;
}

export interface ProviderCapabilities {
  cpu_cores: number;
  memory_mb: number;
  disk_gb: number;
  gpu_count: number;
  gpu_type: string | null;
  supports_endpoint_serving: boolean;
  supports_sandbox_ssh: boolean;
  supports_image_builds: boolean;
}

export interface WorkloadLaunchSpec {
  workload: WorkloadInfo;
  env: Record<string, string>;
  volume_mounts: Array<{ locator: string; mount_path: string; read_only: boolean }>;
  secret_names: string[];
}

export interface RunPodDispatchPayload {
  workload_id: string;
  template: string;
  gpu_type: string | null;
  gpu_count: number;
  env: Record<string, string>;
}

export interface RunPodDispatchResponse {
  workload_id: string;
  backend: string;
  external_id: string;
  status: string;
}
