import { apiFetch } from './client'

export interface Sandbox {
  workload_id: string
  id: string // alias for workload_id
  owner_id: string
  workspace_id: string
  environment_id: string
  kind: 'sandbox'
  status: string
  image: string
  command: string[]
  env: Record<string, string>
  region: string
  pool: string
  secret_names: string[]
  volume_mounts: { locator: string; mount_path: string; read_only: boolean }[]
  resources: { cpu_cores: number; memory_mb: number; disk_gb: number; gpu_count: number; gpu_type: string | null }
  metadata: Record<string, any>
  accrued_cost_usd: number
  created_at: string
  updated_at: string
}

export interface SandboxMetrics {
  workload_id: string
  cpu_seconds: number
  ram_gb_seconds: number
  gpu_seconds: number
  storage_gb_seconds: number
  egress_gb: number
  accrued_cost_usd: number
}

export function listSandboxes(workspaceId?: string, environmentId?: string) {
  const params = new URLSearchParams()
  if (workspaceId) params.set('workspace_id', workspaceId)
  if (environmentId) params.set('environment_id', environmentId)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return apiFetch<Sandbox[]>(`/workloads${qs}`)
}

export function getSandbox(workloadId: string) {
  return apiFetch<Sandbox>(`/workloads/${workloadId}`)
}

export function stopSandbox(workloadId: string) {
  return apiFetch<void>(`/workloads/${workloadId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status: 'stopped' }),
  })
}

export function deleteSandbox(workloadId: string) {
  return apiFetch<void>(`/workloads/${workloadId}`, { method: 'DELETE' })
}

export function getSandboxMetrics(workloadId: string) {
  return apiFetch<SandboxMetrics>(`/workloads/${workloadId}/metrics`)
}

export function getSandboxLogs(workloadId: string) {
  return apiFetch<{ log_id: string; timestamp: string; level: string; message: string }[]>(`/workloads/${workloadId}/logs`)
}
