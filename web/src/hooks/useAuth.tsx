import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

const DEV_SKIP_AUTH = import.meta.env.VITE_DEV_SKIP_AUTH === 'true'

interface AuthContextValue {
  token: string | null
  login: (token: string) => void
  logout: () => void
  isAuthenticated: boolean
  devMode: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('boxty_token'))

  const login = useCallback((t: string) => {
    localStorage.setItem('boxty_token', t)
    setToken(t)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('boxty_token')
    setToken(null)
  }, [])

  useEffect(() => {
    if (DEV_SKIP_AUTH && !token) {
      const setupDevAuth = async () => {
        try {
          const loginRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'dev@boxty.dev', password: 'dev123' }),
          })
          if (loginRes.ok) {
            const data = await loginRes.json()
            login(data.token)
            return
          }
          await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'dev@boxty.dev', password: 'dev123', name: 'Dev User' }),
          })
          const res2 = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'dev@boxty.dev', password: 'dev123' }),
          })
          const data2 = await res2.json()
          login(data2.token)
        } catch {
          // API not running yet — ignore
        }
      }
      setupDevAuth()
    }
  }, [token, login])

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!(token || DEV_SKIP_AUTH), devMode: DEV_SKIP_AUTH }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function useCurrentUser() {
  const { token } = useAuth();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub ?? payload.user_id ?? '',
      email: payload.email ?? '',
      name: payload.name ?? 'User',
    };
  } catch {
    return null;
  }
}
