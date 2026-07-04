import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { oauthCallback, type OAuthProvider } from '../api/auth'

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const provider = sessionStorage.getItem('oauth_provider') as OAuthProvider | null

    if (!provider) {
      setError('OAuth provider not found. Please start the login again.')
      return
    }
    if (!code || !state) {
      setError('Invalid OAuth callback. Missing code or state.')
      return
    }

    oauthCallback(provider, { code, state })
      .then((res) => {
        sessionStorage.removeItem('oauth_provider')
        login(res.access_token)
        navigate('/apps')
      })
      .catch((err) => {
        setError((err as Error).message)
      })
  }, [searchParams, login, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111]">
      <div className="w-full max-w-sm rounded-xl border border-[#262626] bg-[#161616] p-6 shadow-2xl text-center">
        <h2 className="mb-2 text-lg font-bold text-white">Completing sign in...</h2>
        {error ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : (
          <p className="text-xs text-gray-500">Please wait while we finish the OAuth flow.</p>
        )}
      </div>
    </div>
  )
}
