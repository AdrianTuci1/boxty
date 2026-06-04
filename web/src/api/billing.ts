import { apiFetch } from './client'

export interface Balance { credits: number; currency: string }

export interface UsageRecord {
  date: string
  cpu_hours: number
  gpu_hours: number
  storage_gb: number
  cost: number
}

export function getBalance() {
  return apiFetch<Balance>('/billing/balance')
}

export function listUsage() {
  return apiFetch<UsageRecord[]>('/billing/usage')
}

export function createCheckoutSession() {
  return apiFetch<{ url: string }>('/billing/checkout', { method: 'POST' })
}
