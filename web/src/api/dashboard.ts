import { apiFetch } from './client';
import type { AppModel } from '../core/models/app.model';
import type { SandboxModel } from '../core/models/sandbox.model';
import { mapAppFromApi } from '../core/models/app.model';
import { mapSandboxFromApi } from '../core/models/sandbox.model';

export interface DashboardApiResponse {
  apps: Record<string, any>[];
  sandboxes: Record<string, any>[];
  summary: DashboardApiSummary;
}

export interface DashboardApiSummary {
  totalApps: number;
  liveApps: number;
  stoppedApps: number;
  totalSandboxes: number;
  totalCpuCores?: number;
  totalMemoryMb?: number;
  totalGpuCount?: number;
}

export interface DashboardData {
  apps: AppModel[];
  sandboxes: SandboxModel[];
  summary: DashboardApiSummary;
}

export async function getDashboardData(
  workspaceId: string,
  envId: string
): Promise<DashboardData> {
  const raw = await apiFetch<DashboardApiResponse>(`/dashboard/${workspaceId}/${envId}`);
  return {
    apps: raw.apps.map(mapAppFromApi),
    sandboxes: raw.sandboxes.map(mapSandboxFromApi),
    summary: raw.summary,
  };
}

export async function getDashboardSummary(
  workspaceId: string,
  envId: string
): Promise<DashboardApiSummary> {
  return apiFetch<DashboardApiSummary>(`/dashboard/${workspaceId}/${envId}/summary`);
}
