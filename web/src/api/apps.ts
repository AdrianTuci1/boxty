import { apiFetch } from './client'

export interface App {
  id: string
  name: string
  environment_id: string
  status: string
  image_url?: string
  url?: string
  instances?: InstanceConfig[]
  functions?: string[]
  endpoints?: string[]
  deployer_name?: string
  created_at: string
  updated_at: string
  type?: 'function' | 'sandbox'
}

export interface InstanceConfig {
  id: string
  app_id: string
  name: string
  cpu: number
  memory: number
  gpu: string | null
  min_containers: number
  max_containers: number
  scaledown_window: number
  running_containers: number
  status: string
  created_at: string
}

export interface Deployment {
  id: string
  app_id: string
  instance_id: string
  version: string
  image: string
  status: string
  created_at: string
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

export function createApp(payload: { name: string; environment_id: string; image_url: string }) {
  return apiFetch<App>('/apps', { method: 'POST', body: JSON.stringify(payload) })
}

export function stopApp(id: string) {
  return apiFetch<void>(`/apps/${id}/stop`, { method: 'POST' })
}

export function deleteApp(id: string) {
  return apiFetch<void>(`/apps/${id}`, { method: 'DELETE' })
}

// Instance Configs
export function createInstance(appId: string, payload: { name: string; cpu: number; memory: number; gpu?: string | null; min_containers?: number; max_containers?: number; scaledown_window?: number }) {
  return apiFetch<InstanceConfig>(`/apps/${appId}/instances`, { method: 'POST', body: JSON.stringify(payload) })
}

export function listInstances(appId: string) {
  return apiFetch<InstanceConfig[]>(`/apps/${appId}/instances`)
}

export function deleteInstance(appId: string, instanceId: string) {
  return apiFetch<void>(`/apps/${appId}/instances/${instanceId}`, { method: 'DELETE' })
}

// Deploy targets an instance config
export function deployApp(appId: string, instanceId: string, image?: string) {
  return apiFetch<Deployment>(`/apps/${appId}/deploy`, { method: 'POST', body: JSON.stringify({ instance_id: instanceId, image }) })
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
