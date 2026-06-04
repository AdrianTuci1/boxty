import { apiFetch } from './client'

export interface Volume {
  id: string
  name: string
  size_gb: number
  status: 'available' | 'attached' | 'detached'
  created_at: string
}

export function listVolumes() {
  return apiFetch<Volume[]>('/volumes')
}

export function createVolume(payload: { name: string; size_gb: number }) {
  return apiFetch<Volume>('/volumes', { method: 'POST', body: JSON.stringify(payload) })
}

export function deleteVolume(id: string) {
  return apiFetch<void>(`/volumes/${id}`, { method: 'DELETE' })
}

export function mountVolume(volumeId: string, sandboxId: string, mountPath: string) {
  return apiFetch<void>(`/volumes/${volumeId}/mount`, {
    method: 'POST',
    body: JSON.stringify({ sandbox_id: sandboxId, mount_path: mountPath }),
  })
}

export function unmountVolume(volumeId: string) {
  return apiFetch<void>(`/volumes/${volumeId}/unmount`, { method: 'POST' })
}
