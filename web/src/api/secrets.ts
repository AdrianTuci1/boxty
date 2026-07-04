import { apiFetch } from './client'
import { shouldUseMocks } from '../core/services/mock-decider.service'

export interface Secret {
  secret_id: string
  name: string
  workspace_id: string
  key_names: string[]
  created_at: string
}

export const mockSecrets: Secret[] = [
  { secret_id: 'sec-1', name: 'GEMINI_API_KEY', workspace_id: '', key_names: ['GEMINI_API_KEY'], created_at: new Date('2026-06-01T12:00:00Z').toISOString() },
  { secret_id: 'sec-2', name: 'DATABASE_URL', workspace_id: '', key_names: ['DATABASE_URL'], created_at: new Date('2026-06-02T14:30:00Z').toISOString() },
  { secret_id: 'sec-3', name: 'AWS_ACCESS_KEY_ID', workspace_id: '', key_names: ['AWS_ACCESS_KEY_ID'], created_at: new Date('2026-06-03T09:15:00Z').toISOString() },
  { secret_id: 'sec-4', name: 'SENTRY_DSN', workspace_id: '', key_names: ['SENTRY_DSN'], created_at: new Date('2026-06-04T16:45:00Z').toISOString() },
]

export function listSecrets(workspaceId?: string) {
  if (shouldUseMocks()) {
    return Promise.resolve(mockSecrets)
  }
  const qs = workspaceId ? `?workspace_id=${workspaceId}` : ''
  return apiFetch<Secret[]>(`/secrets${qs}`)
}

export function createSecret(payload: { workspace_id: string; name: string; env_vars: Record<string, string> }) {
  if (shouldUseMocks()) {
    const newSecret: Secret = {
      secret_id: `sec-${Math.random().toString(36).substr(2, 9)}`,
      name: payload.name,
      workspace_id: payload.workspace_id,
      key_names: Object.keys(payload.env_vars),
      created_at: new Date().toISOString(),
    }
    mockSecrets.push(newSecret)
    return Promise.resolve(newSecret)
  }
  return apiFetch<Secret>('/secrets', { method: 'POST', body: JSON.stringify(payload) })
}

export function deleteSecret(workspaceId: string, name: string) {
  if (shouldUseMocks()) {
    const idx = mockSecrets.findIndex(s => s.name === name)
    if (idx !== -1) mockSecrets.splice(idx, 1)
    return Promise.resolve()
  }
  return apiFetch<void>(`/secrets/${workspaceId}/${name}`, { method: 'DELETE' })
}
