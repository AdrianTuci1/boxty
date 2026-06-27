import { apiFetch } from './client'

export interface Balance {
  user_id: string
  balance_usd: number
  credit_grants_usd: number
  total_spend_usd: number
}

export interface UsageRecord {
  usage_id: string
  workload_id: string
  owner_id: string
  cpu_seconds: number
  ram_gb_seconds: number
  gpu_seconds: number
  storage_gb_seconds: number
  egress_gb: number
  incremental_cost_usd: number
  created_at: string
}

export function getBalance(userId: string) {
  return apiFetch<Balance>(`/billing/balance?user_id=${userId}`)
}

export function getBillingUsage(userId: string) {
  return apiFetch<{ user_id: string; total_spend_usd: number; period_start: string; period_end: string }>(`/billing/usage?user_id=${userId}`)
}

export function listUsage(workloadId?: string, ownerId?: string) {
  const params = new URLSearchParams()
  if (workloadId) params.set('workload_id', workloadId)
  if (ownerId) params.set('owner_id', ownerId)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return apiFetch<UsageRecord[]>(`/usage${qs}`)
}

export function addCredits(userId: string, amountUsd: number) {
  return apiFetch<{ user_id: string; amount_usd: number; new_balance_usd: number }>('/billing/credits', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, amount_usd: amountUsd }),
  })
}
