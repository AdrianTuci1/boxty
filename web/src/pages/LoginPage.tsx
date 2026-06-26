import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { login } from '../api/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login: doLogin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await login({ email, password })
      doLogin(res.token)
      navigate('/apps')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-[#262626] bg-[#161616] p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-bold text-white">Login</h2>
        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
        <label className="mb-1 block text-xs text-gray-400">Email</label>
        <input type="email" required className="mb-3 w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="mb-1 block text-xs text-gray-400">Password</label>
        <input type="password" required className="mb-4 w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="w-full rounded-md bg-white py-2 text-xs font-medium text-black hover:bg-gray-200 transition-colors">Login</button>
        <p className="mt-3 text-center text-xs text-gray-500">
          No account? <Link to="/register" className="text-mint hover:underline">Register</Link>
        </p>
      </form>
    </div>
  )
}
