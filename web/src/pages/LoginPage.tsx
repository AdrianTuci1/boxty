import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { login, getOAuthUrl, type OAuthProvider } from '../api/auth'

export default function LoginPage() {
  const [externalUserId, setExternalUserId] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const { login: doLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await login({ external_user_id: externalUserId, email: email || undefined })
      doLogin(res.access_token)
      navigate('/apps')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const startOAuth = async (provider: OAuthProvider) => {
    try {
      sessionStorage.setItem('oauth_provider', provider)
      const res = await getOAuthUrl(provider)
      window.location.href = res.authorization_url
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-[#262626] bg-[#161616] p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-bold text-white">Login</h2>
        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
        <label className="mb-1 block text-xs text-gray-400">External User ID</label>
        <input required className="mb-3 w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" value={externalUserId} onChange={(e) => setExternalUserId(e.target.value)} />
        <label className="mb-1 block text-xs text-gray-400">Email (optional)</label>
        <input type="email" className="mb-4 w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" className="w-full rounded-md bg-white py-2 text-xs font-medium text-black hover:bg-gray-200 transition-colors">Login</button>
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-[#262626]" />
            <span className="text-[10px] text-gray-500">or continue with</span>
            <div className="h-px flex-1 bg-[#262626]" />
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => startOAuth('google')}
              className="w-full rounded-md border border-[#262626] bg-[#111111] py-2 text-xs font-medium text-white hover:bg-[#1a1a1a] transition-colors"
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => startOAuth('github')}
              className="w-full rounded-md border border-[#262626] bg-[#111111] py-2 text-xs font-medium text-white hover:bg-[#1a1a1a] transition-colors"
            >
              GitHub
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            No account? <Link to="/register" className="text-mint hover:underline">Register</Link>
          </p>
          <Link to="/password-reset" className="text-xs text-gray-500 hover:text-white transition-colors">Forgot password?</Link>
        </div>
      </form>
    </div>
  )
}
