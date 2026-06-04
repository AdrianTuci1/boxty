import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getWorkspace } from '../api/workspaces'
import { listEnvironments, createEnvironment, type Environment } from '../api/environments'
import { listApps } from '../api/apps'
import AppCard from '../components/AppCard'
import Modal from '../components/Modal'

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
    await createEnvironment(id, envName)
    setEnvName('')
    setOpen(false)
    qc.invalidateQueries({ queryKey: ['environments', id] })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{workspace?.name ?? 'Workspace'}</h1>
      <div className="flex items-center gap-2">
        {environments?.map((env) => (
          <button
            key={env.id}
            onClick={() => setActiveEnv(env.id)}
            className={`rounded px-3 py-1 text-sm ${activeEnv === env.id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}
          >
            {env.name}
          </button>
        ))}
        <button onClick={() => setOpen(true)} className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200">+ Environment</button>
      </div>
      {activeEnv ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps?.map((app) => <AppCard key={app.id} app={app} />) ?? <p className="text-sm text-gray-500">No apps in this environment.</p>}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Select an environment to view apps.</p>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="New Environment">
        <input className="mb-3 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Name" value={envName} onChange={(e) => setEnvName(e.target.value)} />
        <button onClick={handleCreateEnv} className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700">Create</button>
      </Modal>
    </div>
  )
}
