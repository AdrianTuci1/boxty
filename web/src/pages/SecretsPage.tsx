import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listSecrets, createSecret, deleteSecret } from '../api/secrets'
import Modal from '../components/Modal'

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
        <h1 className="text-2xl font-bold">Secrets</h1>
        <button onClick={() => setOpen(true)} className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">New Secret</button>
      </div>
      {isLoading && <p>Loading...</p>}
      <div className="overflow-x-auto rounded-lg border dark:border-gray-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800"><tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Created</th><th className="px-4 py-2">Actions</th></tr></thead>
          <tbody className="divide-y dark:divide-gray-800">
            {data?.map((s) => (
              <tr key={s.id} className="bg-white dark:bg-gray-900">
                <td className="px-4 py-2">{s.name}</td>
                <td className="px-4 py-2">{new Date(s.created_at).toLocaleString()}</td>
                <td className="px-4 py-2">
                  <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline dark:text-red-400">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Create Secret">
        <input className="mb-2 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="password" className="mb-3 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} />
        <button onClick={handleCreate} className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700">Create</button>
      </Modal>
    </div>
  )
}
