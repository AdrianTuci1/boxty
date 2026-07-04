import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/v1/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          password,
          name: name || undefined,
        }),
      })
      
      if (res.ok) {
        const data = await res.json()
        setMessage(`Welcome! You've been added to the workspace with role: ${data.role}`)
        setTimeout(() => navigate('/login'), 3000)
      } else {
        const data = await res.json()
        setError(data.detail || 'Failed to accept invite')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center">
      <div className="w-full max-w-sm p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Accept Invitation</h1>
        <p className="text-gray-400 text-xs mb-6">
          You've been invited to join a workspace. Create your account to get started.
        </p>
        
        {message && (
          <div className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs p-3 rounded-md mb-4">
            {message}
          </div>
        )}
        
        {error && (
          <div className="bg-red-950/20 border border-red-900/40 text-red-400 text-xs p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleAcceptInvite} className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#161616] border border-[#262626] rounded-md px-3 py-2 text-white text-xs outline-none focus:border-[#34d399] transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-2">Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#161616] border border-[#262626] rounded-md px-3 py-2 text-white text-xs outline-none focus:border-[#34d399] transition-colors"
              placeholder="Your name"
            />
          </div>
          
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#161616] border border-[#262626] rounded-md px-3 py-2 text-white text-xs outline-none focus:border-[#34d399] transition-colors"
              placeholder="Min 8 characters"
              required
              minLength={8}
            />
          </div>
          
          <div>
            <label className="text-gray-400 text-xs font-medium block mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#161616] border border-[#262626] rounded-md px-3 py-2 text-white text-xs outline-none focus:border-[#34d399] transition-colors"
              placeholder="Repeat password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black text-xs font-medium py-2 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Accept Invitation'}
          </button>
        </form>
        
        <p className="text-center text-xs text-gray-500 mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-gray-400 hover:text-white transition-colors">Log in</a>
        </p>
      </div>
    </div>
  )
}
