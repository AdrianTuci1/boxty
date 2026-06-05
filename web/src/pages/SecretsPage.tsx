import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listSecrets, createSecret, deleteSecret } from '../api/secrets'
import { X, Plus } from 'lucide-react'

export default function SecretsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['secrets'], queryFn: listSecrets })
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const qc = useQueryClient()

  const handleCreate = async () => {
    await createSecret({ name, value })
    setName('')
    setValue('')
    setOpen(false)
    qc.invalidateQueries({ queryKey: ['secrets'] })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete secret?')) return
    await deleteSecret(id)
    qc.invalidateQueries({ queryKey: ['secrets'] })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Secrets</h1>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-200 transition-colors">
          <Plus className="h-3.5 w-3.5" />
          New Secret
        </button>
      </div>
      {isLoading && <p className="text-sm text-gray-500">Loading...</p>}
      <div className="overflow-x-auto rounded-xl border border-[#262626]">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="bg-[#111111] border-b border-[#262626]">
              <th className="px-4 py-2.5 text-gray-500 font-medium">Name</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">Created</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262626]">
            {data?.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-600 bg-[#161616]">No secrets yet.</td></tr>
            )}
            {data?.map((s) => (
              <tr key={s.id} className="bg-[#161616]">
                <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(s.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300 text-xs transition-colors">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-[#262626] bg-[#161616] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Create Secret</h3>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <input type="password" className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} />
              <button onClick={handleCreate} className="w-full rounded-md bg-white py-2 text-xs font-medium text-black hover:bg-gray-200 transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
