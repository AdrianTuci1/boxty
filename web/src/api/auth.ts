import { apiFetch } from './client'

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { email: string; password: string; name: string }
export interface TokenResponse { token: string; user_id: string }
export interface ApiKey { id: string; name: string; key_preview: string; created_at: string }
export interface ApiKeyCreated extends ApiKey { key: string }

export function login(payload: LoginPayload) {
  return apiFetch<TokenResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
}

export function register(payload: RegisterPayload) {
  return apiFetch<TokenResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
}

export function listApiKeys() {
  return apiFetch<ApiKey[]>('/auth/api-keys')
}

export function createApiKey(name: string) {
  return apiFetch<ApiKeyCreated>('/auth/api-keys', { method: 'POST', body: JSON.stringify({ name }) })
}

export function deleteApiKey(id: string) {
  return apiFetch<void>(`/auth/api-keys/${id}`, { method: 'DELETE' })
}
