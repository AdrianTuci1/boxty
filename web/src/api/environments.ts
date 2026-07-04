import { apiFetch } from './client'

export interface Environment {
  environment_id: string
  workspace_id: string
  name: string
  created_at: string
}

export function listEnvironments(workspaceId: string) {
  return apiFetch<Environment[]>(`/workspaces/${workspaceId}/environments`)
}

export function createEnvironment(payload: { workspace_id: string; name: string }) {
  return apiFetch<Environment>('/environments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteEnvironment(environmentId: string) {
  return apiFetch<void>(`/environments/${environmentId}`, { method: 'DELETE' })
}
