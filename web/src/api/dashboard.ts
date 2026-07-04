import { apiFetch } from './client';
import type { AppModel } from '../core/models/app.model';
import type { SandboxModel } from '../core/models/sandbox.model';
import { mapAppFromApi } from '../core/models/app.model';
import { mapSandboxFromApi } from '../core/models/sandbox.model';

export interface DashboardApiResponse {
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

export interface DashboardData {
  apps: AppModel[];
  sandboxes: SandboxModel[];
  summary: DashboardApiResponse;
}

export async function getDashboardData(
  workspaceId: string,
  envId: string
): Promise<DashboardData> {
  const summary = await apiFetch<DashboardApiResponse>(`/dashboard/${workspaceId}/${envId}`);
  const workloads = await apiFetch<Record<string, any>[]>(`/workloads?workspace_id=${workspaceId}&environment_id=${envId}`);
  const apps = workloads.filter(w => w.kind === 'function' || w.kind === 'endpoint' || w.kind === 'build').map(mapAppFromApi);
  const sandboxes = workloads.filter(w => w.kind === 'sandbox').map(mapSandboxFromApi);
  return {
    apps,
    sandboxes,
    summary,
  };
}

export async function getDashboardSummary(
  workspaceId: string,
  envId: string
): Promise<DashboardApiResponse> {
  return apiFetch<DashboardApiResponse>(`/dashboard/${workspaceId}/${envId}/summary`);
}
