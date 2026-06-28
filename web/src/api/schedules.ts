import { apiFetch } from './client'

export interface Schedule {
  schedule_id: string
  name: string
  workspace_id: string
  environment_id: string
  owner_id: string
  workload_id: string
  cron_expression: string | null
  interval_seconds: number | null
  payload: Record<string, any>
  status: string
  created_at: string
  updated_at: string
  last_run_at: string | null
  next_run_at: string | null
}

export function listSchedules(workspaceId?: string, environmentId?: string) {
  const params = new URLSearchParams()
  if (workspaceId) params.set('workspace_id', workspaceId)
  if (environmentId) params.set('environment_id', environmentId)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return apiFetch<Schedule[]>(`/schedules${qs}`)
}

export function createSchedule(payload: {
  name: string
  workspace_id: string
  environment_id: string
  owner_id: string
  workload_id: string
  cron_expression?: string
  interval_seconds?: number
  payload?: Record<string, any>
}) {
  return apiFetch<Schedule>('/schedules', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateSchedule(
  scheduleId: string,
  payload: {
    name?: string
    cron_expression?: string
    interval_seconds?: number
    payload?: Record<string, any>
    status?: string
  }
) {
  return apiFetch<Schedule>(`/schedules/${scheduleId}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export function deleteSchedule(scheduleId: string) {
  return apiFetch<void>(`/schedules/${scheduleId}`, { method: 'DELETE' })
}

export function triggerSchedule(scheduleId: string) {
  return apiFetch<void>(`/schedules/${scheduleId}/trigger`, { method: 'POST' })
}
