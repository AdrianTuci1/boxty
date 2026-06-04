import { apiFetch } from './client'

export interface Secret {
  id: string
  name: string
  created_at: string
}

export function listSecrets() {
  return apiFetch<Secret[]>('/secrets')
}

export function createSecret(payload: { name: string; value: string }) {
  return apiFetch<Secret>('/secrets', { method: 'POST', body: JSON.stringify(payload) })
}

export function deleteSecret(id: string) {
  return apiFetch<void>(`/secrets/${id}`, { method: 'DELETE' })
}
