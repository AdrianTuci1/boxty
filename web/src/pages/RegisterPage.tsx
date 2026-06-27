import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [externalUserId, setExternalUserId] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register({ external_user_id: externalUserId, email: email || undefined, organization_id: name || undefined })
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-[#262626] bg-[#161616] p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-bold text-white">Register</h2>
        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
        <label className="mb-1 block text-xs text-gray-400">Name</label>
        <input required className="mb-3 w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="mb-1 block text-xs text-gray-400">Email</label>
        <input type="email" className="mb-3 w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="mb-1 block text-xs text-gray-400">External User ID</label>
        <input required className="mb-4 w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" value={externalUserId} onChange={(e) => setExternalUserId(e.target.value)} />
        <button type="submit" className="w-full rounded-md bg-white py-2 text-xs font-medium text-black hover:bg-gray-200 transition-colors">Register</button>
        <p className="mt-3 text-center text-xs text-gray-500">
          Have an account? <Link to="/login" className="text-mint hover:underline">Login</Link>
        </p>
      </form>
    </div>
  )
}
