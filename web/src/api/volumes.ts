import { apiFetch } from './client'
import { shouldUseMocks } from '../core/services/mock-decider.service'

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

export const mockVolumes: Volume[] = [
  { volume_id: 'vol-1', id: 'vol-1', name: 'model-cache', size_gb: 150, volume_type: 'object-storage', status: 'available', created_at: new Date('2026-05-25T10:00:00Z').toISOString() },
  { volume_id: 'vol-2', id: 'vol-2', name: 'user-uploads', size_gb: 50, volume_type: 'object-storage', status: 'available', created_at: new Date('2026-06-01T15:30:00Z').toISOString() },
  { volume_id: 'vol-3', id: 'vol-3', name: 'postgres-data', size_gb: 100, volume_type: 'object-storage', status: 'available', created_at: new Date('2026-06-03T08:45:00Z').toISOString() },
  { volume_id: 'vol-4', id: 'vol-4', name: 'scratch-space', size_gb: 20, volume_type: 'object-storage', status: 'available', created_at: new Date('2026-06-05T11:20:00Z').toISOString() },
]

export function listVolumes(workspaceId?: string) {
  if (shouldUseMocks()) {
    return Promise.resolve(mockVolumes)
  }
  const qs = workspaceId ? `?workspace_id=${workspaceId}` : ''
  return apiFetch<Volume[]>(`/volumes${qs}`)
}

export function createVolume(payload: { workspace_id: string; name: string; size_gb: number; volume_type?: string }) {
  if (shouldUseMocks()) {
    const newVol: Volume = {
      volume_id: `vol-${Math.random().toString(36).substr(2, 9)}`,
      id: `vol-${Math.random().toString(36).substr(2, 9)}`,
      name: payload.name,
      size_gb: payload.size_gb,
      volume_type: payload.volume_type || 'object-storage',
      status: 'available',
      created_at: new Date().toISOString(),
    }
    mockVolumes.push(newVol)
    return Promise.resolve(newVol)
  }
  return apiFetch<Volume>('/volumes', { method: 'POST', body: JSON.stringify(payload) })
}

export function deleteVolume(workspaceId: string, locator: string) {
  if (shouldUseMocks()) {
    const idx = mockVolumes.findIndex(v => v.volume_id === locator || v.name === locator)
    if (idx !== -1) mockVolumes.splice(idx, 1)
    return Promise.resolve()
  }
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
