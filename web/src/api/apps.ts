import { apiFetch } from './client'

export interface App {
  id: string
  name: string
  environment_id: string
  status: 'active' | 'stopped' | 'deploying'
  url?: string
  image_url?: string
  created_at: string
  updated_at: string
}

export interface Deployment {
  id: string
  app_id: string
  version: string
  image: string
  status: string
  created_at: string
  changelog?: string
}

export interface AppMetrics {
  timestamps: string[]
  cpu: number[]
  memory: number[]
  network_rx: number[]
  network_tx: number[]
  gpu_util?: number[]
}

export interface AppUsage {
  cpu_hours: number
  gpu_hours: number
  total_cost: number
  period: string
}

export function listApps(envId?: string) {
  const qs = envId ? `?environment_id=${envId}` : ''
  return apiFetch<App[]>(`/apps${qs}`)
}

export function getApp(id: string) {
  return apiFetch<App>(`/apps/${id}`)
}

export function createApp(payload: { name: string; environment_id: string; image_url: string; cpu: number; memory: number; gpu?: number }) {
  return apiFetch<App>('/apps', { method: 'POST', body: JSON.stringify(payload) })
}

export function stopApp(id: string) {
  return apiFetch<void>(`/apps/${id}/stop`, { method: 'POST' })
}

export function deployApp(id: string, payload: { image: string; cpu: number; memory: number; gpu?: number }) {
  return apiFetch<Deployment>(`/apps/${id}/deploy`, { method: 'POST', body: JSON.stringify(payload) })
}

export function deleteApp(id: string) {
  return apiFetch<void>(`/apps/${id}`, { method: 'DELETE' })
}

export function getAppMetrics(id: string) {
  return apiFetch<AppMetrics>(`/apps/${id}/metrics`)
}

export function getAppUsage(id: string, period: 'day' | 'week' | 'month') {
  return apiFetch<AppUsage>(`/apps/${id}/usage?period=${period}`)
}

export function getAppDeployments(id: string) {
  return apiFetch<Deployment[]>(`/apps/${id}/deployments`)
}
