import { apiFetch } from './client'

export interface Environment {
  id: string
  workspace_id: string
  name: string
  created_at: string
}

export function listEnvironments(workspaceId: string) {
  return apiFetch<Environment[]>(`/environments?workspace_id=${workspaceId}`)
}

export function createEnvironment(workspaceId: string, name: string, type?: string) {
  return apiFetch<Environment>('/environments', {
    method: 'POST',
    body: JSON.stringify({ workspace_id: workspaceId, name, type }),
  })
}

export function deleteEnvironment(envId: string) {
  return apiFetch<void>(`/environments/${envId}`, { method: 'DELETE' })
}
