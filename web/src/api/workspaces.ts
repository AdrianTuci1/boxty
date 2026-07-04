import { apiFetch } from './client'

export interface Workspace {
  workspace_id: string
  id: string // alias
  name: string
  description?: string
  is_default?: boolean
  created_at: string
  environment_count?: number
  app_count?: number
}

export function listWorkspaces(ownerId?: string) {
  const qs = ownerId ? `?owner_id=${ownerId}` : ''
  return apiFetch<Workspace[]>(`/workspaces${qs}`)
}

export function getWorkspace(workspaceId: string) {
  return apiFetch<Workspace>(`/workspaces/${workspaceId}`)
}

export function createWorkspace(payload: { owner_id: string; name: string }) {
  return apiFetch<Workspace>('/workspaces', { method: 'POST', body: JSON.stringify(payload) })
}

export function deleteWorkspace(workspaceId: string) {
  return apiFetch<void>(`/workspaces/${workspaceId}`, { method: 'DELETE' })
}
