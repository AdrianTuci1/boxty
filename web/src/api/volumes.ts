import { apiFetch } from './client'

export interface Volume {
  volume_id: string
  id: string // alias
  name: string
  size_gb: number
  volume_type: string
  status: string
  created_at: string
}

export interface VolumeEntry {
  path: string
  entry_type: string
  size: number | null
}

export function listVolumes(workspaceId?: string) {
  const qs = workspaceId ? `?workspace_id=${workspaceId}` : ''
  return apiFetch<Volume[]>(`/volumes${qs}`)
}

export function createVolume(payload: { workspace_id: string; name: string; size_gb: number; volume_type?: string }) {
  return apiFetch<Volume>('/volumes', { method: 'POST', body: JSON.stringify(payload) })
}

export function deleteVolume(workspaceId: string, locator: string) {
  return apiFetch<void>(`/volumes/${workspaceId}/${locator}`, { method: 'DELETE' })
}

export function listVolumeEntries(locator: string, prefix?: string) {
  const qs = prefix ? `?prefix=${encodeURIComponent(prefix)}` : ''
  return apiFetch<VolumeEntry[]>(`/volumes/${locator}/entries${qs}`)
}

export function getVolumeBlob(locator: string, path: string) {
  return apiFetch<ArrayBuffer>(`/volumes/${locator}/blob?path=${encodeURIComponent(path)}`)
}

export function putVolumeBlob(locator: string, path: string, data: ArrayBuffer) {
  return apiFetch<VolumeEntry>(`/volumes/${locator}/blob?path=${encodeURIComponent(path)}`, {
    method: 'PUT',
    body: data,
    headers: { 'Content-Type': 'application/octet-stream' },
  })
}

export function deleteVolumeBlob(locator: string, path: string) {
  return apiFetch<void>(`/volumes/${locator}/blob?path=${encodeURIComponent(path)}`, { method: 'DELETE' })
}
