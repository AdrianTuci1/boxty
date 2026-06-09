import { apiFetch } from './client'
import { shouldUseMocks } from '../core/services/mock-decider.service'

export interface Secret {
  name: string
  workspace_id: string
  created_at: string
}

export const mockSecrets: Secret[] = [
  { name: 'GEMINI_API_KEY', workspace_id: '', created_at: new Date('2026-06-01T12:00:00Z').toISOString() },
  { name: 'DATABASE_URL', workspace_id: '', created_at: new Date('2026-06-02T14:30:00Z').toISOString() },
  { name: 'AWS_ACCESS_KEY_ID', workspace_id: '', created_at: new Date('2026-06-03T09:15:00Z').toISOString() },
  { name: 'SENTRY_DSN', workspace_id: '', created_at: new Date('2026-06-04T16:45:00Z').toISOString() },
]

export function listSecrets() {
  if (shouldUseMocks()) {
    return Promise.resolve(mockSecrets)
  }
  return apiFetch<Secret[]>('/secrets')
}

export function createSecret(payload: { name: string; value: string; workspace_id?: string }) {
  if (shouldUseMocks()) {
    const newSecret: Secret = {
      name: payload.name,
      workspace_id: payload.workspace_id || '',
      created_at: new Date().toISOString(),
    }
    mockSecrets.push(newSecret)
    return Promise.resolve(newSecret)
  }
  return apiFetch<Secret>('/secrets', { method: 'POST', body: JSON.stringify(payload) })
}

export function deleteSecret(name: string) {
  if (shouldUseMocks()) {
    const idx = mockSecrets.findIndex(s => s.name === name)
    if (idx !== -1) mockSecrets.splice(idx, 1)
    return Promise.resolve()
  }
  return apiFetch<void>(`/secrets/${name}`, { method: 'DELETE' })
}
