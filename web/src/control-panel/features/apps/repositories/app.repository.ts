import { apiFetch } from '@/api/client';
import type { AppModel } from '@/control-panel/core/models/app.model';
import type { IAppRepository } from '@/control-panel/core/ports/app.repository.port';
import { AppModelMapper } from '@/control-panel/core/use-cases/app-mapper.use-case';
import { mockApps, mockSandboxApps } from '@/core/mocks/apps.mock';
import { shouldUseMocks } from '@/core/services/mock-decider.service';

export interface AppApiRecord {
  workload_id: string;
  id: string;
  owner_id: string;
  workspace_id: string;
  environment_id: string;
  name: string;
  kind: 'sandbox' | 'function' | 'endpoint' | 'build';
  status: string;
  image: string;
  command: string[];
  env: Record<string, string>;
  region: string;
  pool: string;
  endpoint_name?: string;
  secret_names: string[];
  volume_mounts: { locator: string; mount_path: string; read_only: boolean }[];
  resources: { cpu_cores: number; memory_mb: number; disk_gb: number; gpu_count: number; gpu_type: string | null };
  metadata: Record<string, any>;
  accrued_cost_usd: number;
  created_at: string;
  updated_at: string;
}

export class AppRepository implements IAppRepository {
  async list(workspaceId?: string, environmentId?: string): Promise<AppModel[]> {
    if (shouldUseMocks()) {
      return [...mockApps, ...mockSandboxApps].map((m) => AppModelMapper.fromLegacy(m));
    }
    const params = new URLSearchParams();
    if (workspaceId) params.set('workspace_id', workspaceId);
    if (environmentId) params.set('environment_id', environmentId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const raw = await apiFetch<AppApiRecord[]>(`/workloads${qs}`);
    return raw.map((r) => AppModelMapper.fromApi(r));
  }

  async getById(id: string): Promise<AppModel> {
    if (shouldUseMocks()) {
      const found = [...mockApps, ...mockSandboxApps].find((m) => m.id === id);
      if (!found) throw new Error(`App not found: ${id}`);
      return AppModelMapper.fromLegacy(found);
    }
    const raw = await apiFetch<AppApiRecord>(`/workloads/${id}`);
    return AppModelMapper.fromApi(raw);
  }

  async create(payload: Partial<AppModel>): Promise<AppModel> {
    const raw = await apiFetch<AppApiRecord>('/workloads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return AppModelMapper.fromApi(raw);
  }

  async stop(id: string): Promise<void> {
    await apiFetch<void>(`/workloads/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: 'stopped' }),
    });
  }

  async delete(id: string): Promise<void> {
    await apiFetch<void>(`/workloads/${id}`, { method: 'DELETE' });
  }
}

export const appRepository = new AppRepository();
