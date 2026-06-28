import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Filter, Info, CheckCircle, XCircle } from 'lucide-react'
import { listApps } from '../api/apps'

interface SandboxInstance {
  id: string
  created: string
  timeToStarted: string
  lifetime: string
  status: 'Running' | 'Terminated' | 'Failed'
}

const statusStyles: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  Running: { bg: 'bg-[#142920]', text: 'text-[#34d399]', icon: CheckCircle },
  Terminated: { bg: 'bg-[#1a1a1a]', text: 'text-gray-400', icon: CheckCircle },
  Failed: { bg: 'bg-red-950/30', text: 'text-red-400', icon: XCircle },
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export default function SandboxInstances() {
  const [showFilters, setShowFilters] = useState(false)

  const { data: apps, isLoading } = useQuery({
    queryKey: ['apps', 'sandboxes'],
    queryFn: () => listApps(),
  })

  const sandboxes = (apps || []).filter((app) => app.kind === 'sandbox')

  const instances: SandboxInstance[] = sandboxes.map((app) => {
    const created = new Date(app.created_at)
    const updated = new Date(app.updated_at)
    const lifetime = updated.getTime() - created.getTime()

    return {
      id: app.id,
      created: created.toLocaleString(),
      timeToStarted: '—',
      lifetime: formatDuration(lifetime),
      status: app.status === 'running' ? 'Running' : app.status === 'stopped' ? 'Terminated' : 'Failed',
    }
  })

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between py-3 border-b border-[#262626] mb-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 text-xs text-gray-400 border border-[#333] px-3 py-1.5 rounded-md hover:text-white hover:border-[#444] transition-colors"
        >
          <Filter className="h-3.5 w-3.5" />
          Add filter
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-hidden rounded-lg border border-[#262626]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#161616] text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium text-xs">Created (EEST)</th>
                  <th className="px-4 py-3 font-medium text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      Time to Started
                      <Info className="h-3.5 w-3.5 text-gray-600" />
                    </span>
                  </th>
                  <th className="px-4 py-3 font-medium text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      Lifetime
                      <Info className="h-3.5 w-3.5 text-gray-600" />
                    </span>
                  </th>
                  <th className="px-4 py-3 font-medium text-xs">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] bg-[#111111]">
                {instances.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-600 text-xs">
                      No sandbox instances.
                    </td>
                  </tr>
                )}
                {instances.map((instance) => {
                  const style = statusStyles[instance.status]
                  const Icon = style.icon
                  return (
                    <tr key={instance.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-4 py-3 text-gray-300 text-xs font-mono">{instance.created}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs font-mono">{instance.timeToStarted}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs font-mono">{instance.lifetime}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full ${style.bg} px-3 py-1 text-xs ${style.text}`}>
                          <Icon className="h-3 w-3" />
                          {instance.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm italic text-gray-600">
            Change the time interval to see more results.
          </p>
        </>
      )}
    </div>
  )
}
