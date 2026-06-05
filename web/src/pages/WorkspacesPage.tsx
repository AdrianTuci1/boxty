import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspaces, useCreateWorkspace } from '../hooks/useWorkspaces'
import { X, Plus } from 'lucide-react'

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
        <h1 className="text-xl font-bold text-white">Workspaces</h1>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-200 transition-colors">
          <Plus className="h-3.5 w-3.5" />
          Create Workspace
        </button>
      </div>
      {isLoading && <p className="text-sm text-gray-500">Loading...</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((w) => (
          <Link key={w.id} to={`/workspaces/${w.id}`} className="rounded-xl border border-[#262626] bg-[#161616] p-4 hover:bg-[#1a1a1a] transition-colors">
            <h3 className="text-sm font-semibold text-white">{w.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{w.environment_count} environments · {w.app_count} apps</p>
          </Link>
        ))}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-[#262626] bg-[#161616] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Create Workspace</h3>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <button onClick={handleCreate} className="w-full rounded-md bg-white py-2 text-xs font-medium text-black hover:bg-gray-200 transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
