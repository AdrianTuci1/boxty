import { useState } from 'react'
import { Filter, Info, CheckCircle, XCircle } from 'lucide-react'

interface SandboxInstance {
  id: string
  created: string
  timeToStarted: string
  lifetime: string
  status: 'Running' | 'Terminated' | 'Failed'
}

const mockInstances: SandboxInstance[] = [
  {
    id: 'sb-001',
    created: 'Jun 6, 2026, 04:34:35',
    timeToStarted: '904ms',
    lifetime: '1m 8s',
    status: 'Terminated',
  },
  {
    id: 'sb-002',
    created: 'Jun 6, 2026, 04:04:43',
    timeToStarted: '1.12s',
    lifetime: '8m 58s',
    status: 'Terminated',
  },
  {
    id: 'sb-003',
    created: 'Jun 6, 2026, 03:45:12',
    timeToStarted: '2.3s',
    lifetime: '15m 22s',
    status: 'Running',
  },
  {
    id: 'sb-004',
    created: 'Jun 6, 2026, 03:30:00',
    timeToStarted: '1.5s',
    lifetime: '30m 10s',
    status: 'Failed',
  },
]

const statusStyles: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  Running: { bg: 'bg-[#142920]', text: 'text-[#34d399]', icon: CheckCircle },
  Terminated: { bg: 'bg-[#1a1a1a]', text: 'text-gray-400', icon: CheckCircle },
  Failed: { bg: 'bg-red-950/30', text: 'text-red-400', icon: XCircle },
}

export default function SandboxInstances() {
  const [instances] = useState<SandboxInstance[]>(mockInstances)
  const [showFilters, setShowFilters] = useState(false)

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
    </div>
  )
}
