import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getWorkspace } from '../api/workspaces'
import { listEnvironments, createEnvironment, deleteEnvironment, type Environment } from '../api/environments'
import { listApps } from '../api/apps'
import AppCard from '../components/AppCard'
import { X } from 'lucide-react'

export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: workspace } = useQuery({ queryKey: ['workspaces', id], queryFn: () => getWorkspace(id!), enabled: !!id })
  const { data: environments } = useQuery<Environment[]>({
    queryKey: ['environments', id],
    queryFn: () => listEnvironments(id!),
    enabled: !!id,
  })
  const [activeEnv, setActiveEnv] = useState<string | null>(null)
  const { data: apps } = useQuery({ queryKey: ['apps', activeEnv], queryFn: () => listApps(activeEnv || undefined), enabled: !!activeEnv })

  const [open, setOpen] = useState(false)
  const [envName, setEnvName] = useState('')
  const qc = useQueryClient()

  const handleCreateEnv = async () => {
    if (!id || !envName) return
    await createEnvironment({ workspace_id: id, name: envName })
    setEnvName('')
    setOpen(false)
    qc.invalidateQueries({ queryKey: ['environments', id] })
  }

  const handleDeleteEnv = async (envId: string) => {
    if (!confirm('Delete environment?')) return
    await deleteEnvironment(envId)
    qc.invalidateQueries({ queryKey: ['environments', id] })
  }

  return (
    <div className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-6 space-y-4">
      <h1 className="text-xl font-bold text-white">{workspace?.name ?? 'Workspace'}</h1>
      <div className="flex items-center gap-2 flex-wrap">
        {environments?.map((env) => (
          <div key={env.environment_id} className="flex items-center gap-1">
            <button
              onClick={() => setActiveEnv(env.environment_id)}
              className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                activeEnv === env.environment_id
                  ? 'bg-[#142920] text-[#34d399] border-[#1e3f31]'
                  : 'bg-[#1f1f1f] text-gray-400 border-[#333] hover:text-white'
              }`}
            >
              {env.name}
            </button>
            <button
              onClick={() => handleDeleteEnv(env.environment_id)}
              className="text-gray-600 hover:text-red-400 text-xs px-1"
            >
              ×
            </button>
          </div>
        ))}
        <button onClick={() => setOpen(true)} className="rounded-md border border-[#333] bg-[#1f1f1f] px-3 py-1 text-xs text-gray-400 hover:text-white transition-colors">+ Environment</button>
      </div>
      {activeEnv ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {apps?.map((app) => <AppCard key={app.id} app={app} />) ?? <p className="text-sm text-gray-500">No apps in this environment.</p>}
        </div>
      ) : (
        <p className="text-sm text-gray-600">Select an environment to view apps.</p>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-[#262626] bg-[#161616] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">New Environment</h3>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder="Name" value={envName} onChange={(e) => setEnvName(e.target.value)} />
              <button onClick={handleCreateEnv} className="w-full rounded-md bg-white py-2 text-xs font-medium text-black hover:bg-gray-200 transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
