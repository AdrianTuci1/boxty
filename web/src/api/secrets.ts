import { apiFetch } from './client'

export interface Secret {
  secret_id: string
  name: string
  workspace_id: string
  key_names: string[]
  created_at: string
}

export function listSecrets(workspaceId?: string) {
  const qs = workspaceId ? `?workspace_id=${workspaceId}` : ''
  return apiFetch<Secret[]>(`/secrets${qs}`)
}

export function createSecret(payload: { workspace_id: string; name: string; env_vars: Record<string, string> }) {
  return apiFetch<Secret>('/secrets', { method: 'POST', body: JSON.stringify(payload) })
}

export function deleteSecret(workspaceId: string, name: string) {
  return apiFetch<void>(`/secrets/${workspaceId}/${name}`, { method: 'DELETE' })
}
