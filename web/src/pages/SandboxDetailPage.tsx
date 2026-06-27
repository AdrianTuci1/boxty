import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getSandbox, stopSandbox } from '../api/sandboxes'
import StatusBadge from '../components/StatusBadge'

export default function SandboxDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, refetch } = useQuery({ queryKey: ['sandboxes', id], queryFn: () => getSandbox(id!), enabled: !!id })

  const handleStop = async () => {
    if (!id) return
    await stopSandbox(id)
    refetch()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Sandbox {id?.slice(0, 8)}</h1>
          <p className="text-sm text-gray-500">{data?.status || 'Unknown'} · Sandbox</p>
        </div>
        <StatusBadge status={data?.status || 'stopped'} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={handleStop} className="rounded-md border border-[#262626] bg-[#1f1f1f] px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors">Stop</button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-[#262626] bg-[#161616] p-4">
          <p><strong>Status:</strong> {data?.status || 'Unknown'}</p>
          <p><strong>Image:</strong> {data?.image || 'Unknown'}</p>
          <p><strong>Workspace:</strong> {data?.workspace_id || '-'}</p>
          <p><strong>Environment:</strong> {data?.environment_id || '-'}</p>
          <p><strong>Created:</strong> {data?.created_at ? new Date(data.created_at).toLocaleString() : '-'}</p>
          <p><strong>Updated:</strong> {data?.updated_at ? new Date(data.updated_at).toLocaleString() : '-'}</p>
        </div>
      </div>



    </div>
  )
}
