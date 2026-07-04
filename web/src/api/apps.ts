import { apiFetch } from './client'

// Backend workloads are mapped to "apps" in the UI
export interface App {
  workload_id: string
  id: string // alias for workload_id, for UI compatibility
  owner_id: string
  workspace_id: string
  environment_id: string
  name: string
  kind: 'sandbox' | 'function' | 'endpoint' | 'build'
  status: string
  image: string
  command: string[]
  env: Record<string, string>
  region: string
  pool: string
  endpoint_name?: string
  secret_names: string[]
  volume_mounts: { locator: string; mount_path: string; read_only: boolean }[]
  resources: { cpu_cores: number; memory_mb: number; disk_gb: number; gpu_count: number; gpu_type: string | null }
  metadata: Record<string, any>
  accrued_cost_usd: number
  created_at: string
  updated_at: string
}

export interface AppMetrics {
  workload_id: string
  cpu_seconds: number
  ram_gb_seconds: number
  gpu_seconds: number
  storage_gb_seconds: number
  egress_gb: number
  accrued_cost_usd: number
}

export interface AppUsage {
  cpu_hours: number
  gpu_hours: number
  total_cost: number
  period: string
}

export function listApps(workspaceId?: string, environmentId?: string) {
  const params = new URLSearchParams()
  if (workspaceId) params.set('workspace_id', workspaceId)
  if (environmentId) params.set('environment_id', environmentId)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return apiFetch<App[]>(`/workloads${qs}`)
}

export function getApp(workloadId: string) {
  return apiFetch<App>(`/workloads/${workloadId}`)
}

export function createApp(payload: { owner_id: string; workspace_id: string; environment_id: string; kind: 'sandbox' | 'function' | 'endpoint' | 'build'; image: string; command?: string[]; env?: Record<string, string>; region?: string; pool?: string; endpoint_name?: string; secret_names?: string[]; volume_mounts?: { locator: string; mount_path: string; read_only?: boolean }[]; resources?: { cpu_cores?: number; memory_mb?: number; disk_gb?: number; gpu_count?: number; gpu_type?: string | null }; metadata?: Record<string, any> }) {
  return apiFetch<App>('/workloads', { method: 'POST', body: JSON.stringify(payload) })
}

export function stopApp(workloadId: string) {
  return apiFetch<void>(`/workloads/${workloadId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status: 'stopped' }),
  })
}

export function deleteApp(workloadId: string) {
  return apiFetch<void>(`/workloads/${workloadId}`, { method: 'DELETE' })
}

export function getAppMetrics(workloadId: string) {
  return apiFetch<AppMetrics>(`/workloads/${workloadId}/metrics`)
}

export function getAppUsage(workloadId: string) {
  return apiFetch<AppUsage>(`/usage?workload_id=${workloadId}`)
}

export function getAppLogs(workloadId: string) {
  return apiFetch<{ log_id: string; timestamp: string; level: string; message: string }[]>(`/workloads/${workloadId}/logs`)
}
