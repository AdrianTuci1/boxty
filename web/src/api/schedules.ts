import { apiFetch } from './client'

export interface Schedule {
  id: string
  name: string
  schedule_type: 'cron' | 'period'
  schedule_value: string
  function_name: string
  image?: string
  cpu?: number
  memory?: number
  gpu?: string | null
  timeout?: number
  secrets?: string[]
  next_run: string
  status: 'active' | 'paused'
  created_at: string
  cron?: string
  period_seconds?: number
}

export function listSchedules() {
  return apiFetch<Schedule[]>('/schedules')
}

export function createSchedule(payload: {
  name: string
  schedule_type: 'cron' | 'period'
  schedule_value: string
  function_name: string
  image?: string
  cpu?: number
  memory?: number
  gpu?: string | null
  timeout?: number
  secrets?: string[]
}) {
  return apiFetch<Schedule>('/schedules', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateSchedule(
  id: string,
  payload: {
    name?: string
    schedule_type?: 'cron' | 'period'
    schedule_value?: string
    function_name?: string
    image?: string
    cpu?: number
    memory?: number
    gpu?: string | null
    timeout?: number
    secrets?: string[]
    status?: 'active' | 'paused'
  }
) {
  return apiFetch<Schedule>(`/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export function deleteSchedule(id: string) {
  return apiFetch<void>(`/schedules/${id}`, { method: 'DELETE' })
}

export function triggerSchedule(id: string) {
  return apiFetch<void>(`/schedules/${id}/trigger`, { method: 'POST' })
}
