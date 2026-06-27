import { apiFetch } from './client'

export interface Schedule {
  schedule_id: string
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
  scheduleId: string,
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
  return apiFetch<Schedule>(`/schedules/${scheduleId}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export function deleteSchedule(scheduleId: string) {
  return apiFetch<void>(`/schedules/${scheduleId}`, { method: 'DELETE' })
}

export function triggerSchedule(scheduleId: string) {
  return apiFetch<void>(`/schedules/${scheduleId}/trigger`, { method: 'POST' })
}
