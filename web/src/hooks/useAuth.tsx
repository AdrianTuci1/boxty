import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

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

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token, devMode: false }}>
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
