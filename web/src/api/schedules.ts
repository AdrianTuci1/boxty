import { apiFetch } from './client'

export interface Schedule {
  id: string
  name: string
  cron?: string
  period_seconds?: number
  next_run: string
  status: 'active' | 'paused'
  created_at: string
}

export function listSchedules() {
  return apiFetch<Schedule[]>('/schedules')
}

export function createSchedule(payload: { name: string; cron?: string; period_seconds?: number }) {
  return apiFetch<Schedule>('/schedules', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateSchedule(id: string, payload: { name?: string; cron?: string; period_seconds?: number; status?: 'active' | 'paused' }) {
  return apiFetch<Schedule>(`/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export function deleteSchedule(id: string) {
  return apiFetch<void>(`/schedules/${id}`, { method: 'DELETE' })
}

export function triggerSchedule(id: string) {
  return apiFetch<void>(`/schedules/${id}/trigger`, { method: 'POST' })
}
