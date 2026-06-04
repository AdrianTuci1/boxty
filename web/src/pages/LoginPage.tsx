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
      navigate('/dashboard')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-xl font-bold">Login</h2>
        {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
        <label className="mb-1 block text-sm font-medium">Email</label>
        <input type="email" required className="mb-3 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="mb-1 block text-sm font-medium">Password</label>
        <input type="password" required className="mb-4 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700">Login</button>
        <p className="mt-3 text-center text-sm">
          No account? <Link to="/register" className="text-indigo-600 hover:underline dark:text-indigo-400">Register</Link>
        </p>
      </form>
    </div>
  )
}
