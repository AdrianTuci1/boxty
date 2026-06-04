import { apiFetch } from './client'

export interface Environment {
  id: string
  workspace_id: string
  name: string
  created_at: string
}

export function listEnvironments(workspaceId: string) {
  return apiFetch<Environment[]>(`/workspaces/${workspaceId}/environments`)
}

export function createEnvironment(workspaceId: string, name: string) {
  return apiFetch<Environment>(`/workspaces/${workspaceId}/environments`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function deleteEnvironment(workspaceId: string, envId: string) {
  return apiFetch<void>(`/workspaces/${workspaceId}/environments/${envId}`, { method: 'DELETE' })
}
