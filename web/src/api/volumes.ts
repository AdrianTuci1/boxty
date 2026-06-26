import { apiFetch } from './client'
import { shouldUseMocks } from '../core/services/mock-decider.service'

export interface Volume {
  id: string
  name: string
  size_gb: number
  status: 'available' | 'attached' | 'detached'
  created_at: string
}

export const mockVolumes: Volume[] = [
  { id: 'vol-1', name: 'model-cache', size_gb: 150, status: 'attached', created_at: new Date('2026-05-25T10:00:00Z').toISOString() },
  { id: 'vol-2', name: 'user-uploads', size_gb: 50, status: 'available', created_at: new Date('2026-06-01T15:30:00Z').toISOString() },
  { id: 'vol-3', name: 'postgres-data', size_gb: 100, status: 'attached', created_at: new Date('2026-06-03T08:45:00Z').toISOString() },
  { id: 'vol-4', name: 'scratch-space', size_gb: 20, status: 'detached', created_at: new Date('2026-06-05T11:20:00Z').toISOString() },
]

export function listVolumes() {
  if (shouldUseMocks()) {
    return Promise.resolve(mockVolumes)
  }
  return apiFetch<Volume[]>('/volumes')
}

export function createVolume(payload: { name: string; size_gb: number }) {
  if (shouldUseMocks()) {
    const newVol: Volume = {
      id: `vol-${Math.random().toString(36).substr(2, 9)}`,
      name: payload.name,
      size_gb: payload.size_gb,
      status: 'available',
      created_at: new Date().toISOString(),
    }
    mockVolumes.push(newVol)
    return Promise.resolve(newVol)
  }
  return apiFetch<Volume>('/volumes', { method: 'POST', body: JSON.stringify(payload) })
}

export function deleteVolume(id: string) {
  if (shouldUseMocks()) {
    const idx = mockVolumes.findIndex(v => v.id === id)
    if (idx !== -1) mockVolumes.splice(idx, 1)
    return Promise.resolve()
  }
  return apiFetch<void>(`/volumes/${id}`, { method: 'DELETE' })
}

export function mountVolume(volumeId: string, sandboxId: string, mountPath: string) {
  if (shouldUseMocks()) {
    const vol = mockVolumes.find(v => v.id === volumeId)
    if (vol) vol.status = 'attached'
    return Promise.resolve()
  }
  return apiFetch<void>(`/volumes/${volumeId}/mount`, {
    method: 'POST',
    body: JSON.stringify({ sandbox_id: sandboxId, mount_path: mountPath }),
  })
}

export function unmountVolume(volumeId: string) {
  if (shouldUseMocks()) {
    const vol = mockVolumes.find(v => v.id === volumeId)
    if (vol) vol.status = 'detached'
    return Promise.resolve()
  }
  return apiFetch<void>(`/volumes/${volumeId}/unmount`, { method: 'POST' })
}
