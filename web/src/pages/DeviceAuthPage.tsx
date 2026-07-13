import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { authorizeDeviceCode } from '../api/auth'

export default function DeviceAuthPage() {
  const [searchParams] = useSearchParams()
  const userCode = (searchParams.get('user_code') || '').toUpperCase()
  const [externalUserId, setExternalUserId] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userCode) {
      setStatus('error')
      setMessage('Missing user code. Please use the full link from the CLI.')
      return
    }
    if (!externalUserId.trim()) {
      setStatus('error')
      setMessage('Please enter an external user ID.')
      return
    }
    setStatus('loading')
    try {
      await authorizeDeviceCode({
        user_code: userCode,
        external_user_id: externalUserId.trim(),
        email: email.trim() || undefined,
      })
      setStatus('success')
      setMessage('CLI authorized. You can close this page and return to the terminal.')
    } catch (err) {
      setStatus('error')
      setMessage((err as Error).message || 'Authorization failed.')
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(userCode).catch(() => {})
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] p-4">
      <div className="w-full max-w-sm rounded-xl border border-[#262626] bg-[#161616] p-6 shadow-2xl">
        <h2 className="mb-2 text-lg font-bold text-white">Authorize CLI</h2>
        <p className="mb-4 text-xs text-gray-400">
          Enter the details below to confirm this device. The CLI will receive an access token.
        </p>

        {message && (
          <div
            className={`mb-4 rounded-md border px-3 py-2 text-xs ${
              status === 'success'
                ? 'border-green-900 bg-green-950 text-green-300'
                : status === 'error'
                ? 'border-red-900 bg-red-950 text-red-300'
                : 'border-[#262626] bg-[#111111] text-gray-300'
            }`}
          >
            {message}
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1 block text-xs text-gray-400">User code</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={userCode}
              className="flex-1 rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs font-mono uppercase text-white outline-none"
            />
            <button
              type="button"
              onClick={copyCode}
              className="rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white hover:bg-[#1a1a1a] transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="mt-1 text-[10px] text-gray-500">Copy this code if the CLI asks for it.</p>
        </div>

        {status !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">External User ID</label>
              <input
                required
                value={externalUserId}
                onChange={(e) => setExternalUserId(e.target.value)}
                placeholder="e.g. alice"
                className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none placeholder:text-gray-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alice@example.com"
                className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none placeholder:text-gray-600"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-md bg-white py-2 text-xs font-medium text-black hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {status === 'loading' ? 'Authorizing...' : 'Authorize CLI'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
