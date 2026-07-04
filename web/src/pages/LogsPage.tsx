import { useParams } from 'react-router-dom'
import { Activity, ScrollText } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useApps } from '../hooks/useApps'
import { stopApp } from '../api/apps'
import type { App } from '../api/apps'
import EmptyState from '../components/EmptyState'

function formatRelativeTime(date: string | undefined): string {
  if (!date) return 'Currently running'
  const now = Date.now()
  const then = new Date(date).getTime()
  const diff = now - then
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`
  return `${Math.floor(diff / 86400000)} days ago`
}

function deriveStatus(app: App): 'deployed' | 'stopped' {
  return app.status === 'stopped' || app.status === 'error' ? 'stopped' : 'deployed'
}

export default function LogsPage() {
  const { environment } = useParams<{ workspace: string; environment: string }>()
  const { data, isLoading } = useApps(environment)
  const qc = useQueryClient()

  const entries = (data || []).map((app) => ({
    id: app.id,
    name: app.name,
    status: deriveStatus(app),
    created: formatRelativeTime(app.created_at),
    stopped: app.status === 'stopped' ? formatRelativeTime(app.updated_at) : 'Currently running',
    isActive: app.status !== 'stopped' && app.status !== 'error',
  }))

  return (
    <div className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-6">
      <h1 className="text-[26px] font-semibold text-white tracking-tight mb-1">Logs</h1>
      <span className="text-gray-400 text-xs font-medium block mb-4">
        These are all running and recently stopped Modal apps.
      </span>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : entries.length === 0 ? (
        <EmptyState icon={ScrollText} title="No apps found" subtitle="Running and recently stopped apps will appear here." />
      ) : (
        <div className="bg-[#161616]/30 border border-[#262626] rounded-xl overflow-hidden w-full">
          <table className="w-full">
            <thead>
              <tr className="bg-[#161616] border-b border-[#262626]">
                <th className="text-gray-400 text-xs font-medium p-3 text-left w-5" />
                <th className="text-gray-400 text-xs font-medium p-3 text-left">Name</th>
                <th className="text-gray-400 text-xs font-medium p-3 text-left">State</th>
                <th className="text-gray-400 text-xs font-medium p-3 text-left">Created</th>
                <th className="text-gray-400 text-xs font-medium p-3 text-left">Stopped</th>
                <th className="text-gray-400 text-xs font-medium p-3 text-left" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isTerminated = entry.status === 'stopped'
                const nameColor = entry.isActive
                  ? 'text-white'
                  : isTerminated
                    ? 'text-gray-400'
                    : 'text-gray-200'
                const stateColor = isTerminated ? 'text-gray-500' : 'text-gray-300'
                const timeColor = isTerminated ? 'text-gray-500' : 'text-gray-400'

                return (
                  <tr
                    key={entry.id}
                    className="h-11 border-b border-[#262626]/40 last:border-b-0 text-xs font-sans tracking-wide hover:bg-[#1f1f1f]/50 transition-colors"
                  >
                    <td className="p-3 w-5">
                      {entry.isActive && (
                        <Activity className="w-3.5 h-3.5 text-[#34d399]" />
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`font-mono font-medium ${nameColor}`}>
                        {entry.name}
                      </span>
                    </td>
                    <td className={`p-3 ${stateColor}`}>{entry.status}</td>
                    <td className={`p-3 font-mono ${timeColor}`}>{entry.created}</td>
                    <td className={`p-3 ${timeColor}`}>{entry.stopped}</td>
                    <td className="p-3">
                      {!isTerminated && (
                        <button
                          onClick={async () => {
                            await stopApp(entry.id)
                            qc.invalidateQueries({ queryKey: ['apps'] })
                          }}
                          className="bg-[#161616] border border-[#2d2d2d] text-white hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/50 text-[11px] font-medium px-2.5 py-1 rounded transition-all"
                        >
                          Stop now
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  )
}
