import { apiFetch } from './client'

export interface Workspace {
  id: string
  name: string
  description?: string
  created_at: string
  environment_count?: number
  app_count?: number
}

export function listWorkspaces() {
  return apiFetch<Workspace[]>('/workspaces')
}

export function getWorkspace(id: string) {
  return apiFetch<Workspace>(`/workspaces/${id}`)
}

export function createWorkspace(name: string) {
  return apiFetch<Workspace>('/workspaces', { method: 'POST', body: JSON.stringify({ name }) })
}

export function deleteWorkspace(id: string) {
  return apiFetch<void>(`/workspaces/${id}`, { method: 'DELETE' })
}
