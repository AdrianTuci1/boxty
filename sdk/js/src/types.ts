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
  name: string;
  env_vars: { key: string; value: string }[];
  created_at: string;
  updated_at: string;
}

export interface VolumeInfo {
  id: string;
  name: string;
  size_gb: number;
  volume_type: string;
  status: string;
  created_at: string;
}

export interface VolumeEntry {
  name: string;
  path: string;
  entry_type: string;
  size: number | null;
}

export interface DatabaseInfo {
  id: string;
  name: string;
  type_name: string;
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
  name: string;
  envVars: SecretEnvVar[];
}

export interface CreateVolumePayload {
  name: string;
  sizeGb: number;
  type: string;
}

export interface CreateDatabasePayload {
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
  created_at: string;
}

export interface EnvironmentInfo {
  id: string;
  environment_id: string;
  workspace_id: string;
  name: string;
  created_at: string;
}

export interface RouteInfo {
  id: string;
  route_id: string;
  workload_id: string;
  endpoint_name: string;
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
  created_at: string;
}

export interface ImageInfo {
  id: string;
  image_id: string;
  name: string;
  base_image: string | null;
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
  workloads: number;
  running: number;
  stopped: number;
  failed: number;
  balance_usd: number;
  pending_spend_usd: number;
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
}

export interface InviteInfo {
  id: string;
  invite_id: string;
  workspace_id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export interface ProviderInfo {
  id: string;
  provider_id: string;
  name: string;
  region: string;
  pool: string;
  total_slots: number;
  created_at: string;
}
