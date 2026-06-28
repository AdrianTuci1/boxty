import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, Copy, Plus } from 'lucide-react'
import { listWorkspaces, createWorkspace, deleteWorkspace } from '../../api/workspaces'

export default function WorkspacesListPage() {
  const { data, isLoading } = useQuery({ queryKey: ['workspaces'], queryFn: () => listWorkspaces() })
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const qc = useQueryClient()

  const handleCreate = async () => {
    if (!newName) return
    await createWorkspace({ owner_id: 'default', name: newName })
    setNewName('')
    setShowNew(false)
    qc.invalidateQueries({ queryKey: ['workspaces'] })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete workspace?')) return
    await deleteWorkspace(id)
    qc.invalidateQueries({ queryKey: ['workspaces'] })
  }

  const workspaces = data || []

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Workspaces</h1>
          <span className="text-gray-400 text-xs font-medium mt-1.5 block">Manage your workspace memberships.</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-gray-400 text-xs font-medium hover:text-white transition-colors">
            <FileText className="h-3.5 w-3.5" />
            Docs
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="bg-[#1f1f1f] hover:bg-[#262626] border border-[#262626] text-white text-xs px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Workspace
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        /* Table */
        <div className="rounded-xl border border-[#262626] bg-[#161616] overflow-hidden">
          {/* Header */}
          <div className="flex bg-[#111111]/40 border-b border-[#262626] px-4 py-2.5 text-[11px] font-semibold tracking-wider text-gray-500">
            <span className="flex-1">Organization</span>
            <span className="w-32">Role</span>
            <span className="w-40" />
          </div>

          {workspaces.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-600 text-xs">No workspaces yet.</div>
          )}

          {workspaces.map((ws) => (
            <div key={ws.workspace_id} className="flex items-center px-4 py-3 border-b border-[#262626]/40 hover:bg-[#1f1f1f]/20 transition-colors">
              <div className="flex-1 flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-yellow-400 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                  {ws.name[0]?.toUpperCase() || 'W'}
                </div>
                <span className="text-white text-xs font-medium">{ws.name}</span>
                {ws.is_default && (
                  <span className="bg-[#222222] text-gray-400 text-[10px] px-1.5 py-0.2 rounded-md border border-[#2d2d2d] ml-1.5">
                    personal
                  </span>
                )}
              </div>
              <span className="w-32 text-gray-400 text-xs">Owner</span>
              <div className="w-40 flex items-center gap-1.5 justify-end">
                <button onClick={() => navigator.clipboard.writeText(ws.workspace_id)} className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs px-2.5 py-1 rounded transition-colors">
                  <Copy className="h-3 w-3" />
                  Copy ID
                </button>
                <button
                  onClick={() => handleDelete(ws.workspace_id)}
                  className="border border-red-950/40 text-red-400 text-xs px-2.5 py-1 rounded hover:bg-red-950/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Workspace Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-md rounded-xl border border-[#262626] bg-[#161616] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-white mb-4">New Workspace</h3>
            <input
              className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none mb-4"
              placeholder="Workspace name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <button
              onClick={handleCreate}
              className="w-full rounded-md bg-white py-2 text-xs font-medium text-black hover:bg-gray-200 transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
