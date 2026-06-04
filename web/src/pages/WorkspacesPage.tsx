import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspaces, useCreateWorkspace } from '../hooks/useWorkspaces'
import Modal from '../components/Modal'

export default function WorkspacesPage() {
  const { data, isLoading } = useWorkspaces()
  const create = useCreateWorkspace()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const handleCreate = async () => {
    if (!name) return
    await create.mutateAsync(name)
    setName('')
    setOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workspaces</h1>
        <button onClick={() => setOpen(true)} className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">Create Workspace</button>
      </div>
      {isLoading && <p>Loading...</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((w) => (
          <Link key={w.id} to={`/workspaces/${w.id}`} className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-lg font-semibold">{w.name}</h3>
            <p className="text-sm text-gray-500">{w.environment_count} environments · {w.app_count} apps</p>
          </Link>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Create Workspace">
        <input className="mb-3 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={handleCreate} className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700">Create</button>
      </Modal>
    </div>
  )
}
