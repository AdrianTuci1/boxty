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
