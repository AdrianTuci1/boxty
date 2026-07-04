import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

export default function PasswordResetPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState(token ? 'reset' : 'request')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/v1/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      if (res.ok) {
        setMessage('If an account exists with this email, you will receive a password reset link.')
        setStep('sent')
      } else {
        const data = await res.json()
        setError(data.detail || 'Failed to send reset request')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/v1/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      })
      
      if (res.ok) {
        setMessage('Password reset successfully! Redirecting to login...')
        setTimeout(() => navigate('/login'), 2000)
      } else {
        const data = await res.json()
        setError(data.detail || 'Failed to reset password')
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
        <h1 className="text-2xl font-bold text-white mb-6">
          {step === 'request' ? 'Reset Password' : step === 'sent' ? 'Check your email' : 'Set New Password'}
        </h1>
        
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
        
        {step === 'request' && (
          <form onSubmit={handleRequestReset} className="space-y-4">
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black text-xs font-medium py-2 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="text-center text-xs text-gray-500 mt-4">
              <a href="/login" className="text-gray-400 hover:text-white transition-colors">Back to login</a>
            </p>
          </form>
        )}
        
        {step === 'sent' && (
          <div className="text-center">
            <p className="text-gray-400 text-xs">
              We've sent a password reset link to your email address.
              Please check your inbox and follow the instructions.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Back to login
            </button>
          </div>
        )}
        
        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
