import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listApiKeys, createApiKey, deleteApiKey } from '../api/auth'

export default function SettingsPage() {
  const { logout } = useAuth()
  const { data } = useQuery({ queryKey: ['api-keys'], queryFn: listApiKeys })
  const [keyName, setKeyName] = useState('')
  const qc = useQueryClient()

  const handleCreate = async () => {
    if (!keyName) return
    await createApiKey(keyName)
    setKeyName('')
    qc.invalidateQueries({ queryKey: ['api-keys'] })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete API key?')) return
    await deleteApiKey(id)
    qc.invalidateQueries({ queryKey: ['api-keys'] })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="mt-2 text-sm text-gray-500">Manage your account and API keys.</p>
        <button onClick={logout} className="mt-3 rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">Logout</button>
      </div>
      <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold">API Keys</h2>
        <div className="mt-3 flex gap-2">
          <input className="flex-1 rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Key name" value={keyName} onChange={(e) => setKeyName(e.target.value)} />
          <button onClick={handleCreate} className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">Generate</button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800"><tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Preview</th><th className="px-4 py-2">Created</th><th className="px-4 py-2">Actions</th></tr></thead>
            <tbody className="divide-y dark:divide-gray-800">
              {data?.map((k) => (
                <tr key={k.id} className="bg-white dark:bg-gray-900">
                  <td className="px-4 py-2">{k.name}</td>
                  <td className="px-4 py-2 font-mono">{k.key_preview}</td>
                  <td className="px-4 py-2">{new Date(k.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2"><button onClick={() => handleDelete(k.id)} className="text-red-600 hover:underline dark:text-red-400">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
