import { apiFetch } from './client'

export interface LoginPayload { external_user_id: string; email?: string }
export interface RegisterPayload { external_user_id: string; email?: string; organization_id?: string }
export interface TokenResponse { user_id: string; access_token: string }
export interface ApiKey { api_key_id: string; name: string; secret_preview: string; created_at: string }
export interface ApiKeyCreated extends ApiKey { secret_token: string }

export type OAuthProvider = 'google' | 'github'
export interface OAuthUrlResponse { authorization_url: string; state: string }

export function login(payload: LoginPayload) {
  return apiFetch<TokenResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
}

export function register(payload: RegisterPayload) {
  return apiFetch<TokenResponse>('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
}

export function getOAuthUrl(provider: OAuthProvider) {
  return apiFetch<OAuthUrlResponse>(`/auth/oauth/${provider}`)
}

export function oauthCallback(provider: OAuthProvider, payload: { code: string; state: string }) {
  return apiFetch<TokenResponse>(`/auth/oauth/${provider}/callback`, { method: 'POST', body: JSON.stringify(payload) })
}

export function whoami() {
  return apiFetch<Record<string, any>>('/auth/me')
}

export function listApiKeys(workspaceId?: string) {
  const qs = workspaceId ? `?workspace_id=${workspaceId}` : ''
  return apiFetch<ApiKey[]>(`/api-keys${qs}`)
}

export function createApiKey(payload: { owner_id: string; workspace_id: string; environment_id: string; name: string }) {
  return apiFetch<ApiKeyCreated>('/api-keys', { method: 'POST', body: JSON.stringify(payload) })
}

export function deleteApiKey(apiKeyId: string) {
  return apiFetch<void>(`/api-keys/${apiKeyId}`, { method: 'DELETE' })
}

export function getUser(userId: string) {
  return apiFetch<Record<string, any>>(`/users/${userId}`)
}

export function getAccount(userId: string) {
  return apiFetch<Record<string, any>>(`/accounts/${userId}`)
}
