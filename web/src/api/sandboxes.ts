import { apiFetch } from './client'

export interface Sandbox {
  id: string
  app_id: string
  status: 'running' | 'stopped' | 'snapshotted'
  started_at?: string
  finished_at?: string
  boot_duration_ms?: number
  url?: string
  cpu_max_pct?: number
  cpu_avg_pct?: number
  memory_max_mb?: number
  memory_avg_mb?: number
  network_rx_bytes?: number
  network_tx_bytes?: number
  gpu_util_pct?: number
  gpu_memory_mb?: number
}

export interface SandboxMetrics {
  timestamps: string[]
  cpu: number[]
  memory: number[]
  network_rx: number[]
  network_tx: number[]
  gpu_util?: number[]
}

export function listSandboxes() {
  return apiFetch<Sandbox[]>('/sandboxes')
}

export function getSandbox(id: string) {
  return apiFetch<Sandbox>(`/sandboxes/${id}`)
}

export function stopSandbox(id: string) {
  return apiFetch<void>(`/sandboxes/${id}/stop`, { method: 'POST' })
}

export function execSandbox(id: string, command: string) {
  return apiFetch<{ stdout: string; stderr: string }>(`/sandboxes/${id}/exec`, {
    method: 'POST',
    body: JSON.stringify({ command }),
  })
}

export function forwardPort(id: string, port: number) {
  return apiFetch<{ url: string }>(`/sandboxes/${id}/forward`, {
    method: 'POST',
    body: JSON.stringify({ port }),
  })
}

export function snapshotSandbox(id: string) {
  return apiFetch<{ snapshot_id: string }>(`/sandboxes/${id}/snapshot`, { method: 'POST' })
}

export function getSandboxMetrics(id: string) {
  return apiFetch<SandboxMetrics>(`/sandboxes/${id}/metrics`)
}
