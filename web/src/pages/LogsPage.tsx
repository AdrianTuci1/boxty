import { Activity } from 'lucide-react'

interface LogEntry {
  id: string
  name: string
  status: 'deployed' | 'stopped'
  created: string
  createdISO: string
  stopped: string
  stoppedISO: string
  isActive: boolean
}

const MOCK_LOGS: LogEntry[] = [
  {
    id: '1',
    name: 'hermes-agent',
    status: 'deployed',
    created: '31 minutes ago',
    createdISO: new Date(Date.now() - 31 * 60000).toISOString(),
    stopped: 'Currently running',
    stoppedISO: '',
    isActive: true,
  },
  {
    id: '2',
    name: 'dental-tooth-segmentation',
    status: 'deployed',
    created: 'about 1 month ago',
    createdISO: new Date(Date.now() - 30 * 86400000).toISOString(),
    stopped: 'Currently idle',
    stoppedISO: '',
    isActive: false,
  },
  {
    id: '3',
    name: 'statsparrot-pne',
    status: 'deployed',
    created: 'about 1 month ago',
    createdISO: new Date(Date.now() - 30 * 86400000).toISOString(),
    stopped: 'Currently idle',
    stoppedISO: '',
    isActive: false,
  },
  {
    id: '4',
    name: 'statsparrot-analytics-worker',
    status: 'deployed',
    created: 'about 1 month ago',
    createdISO: new Date(Date.now() - 30 * 86400000).toISOString(),
    stopped: 'Currently idle',
    stoppedISO: '',
    isActive: false,
  },
  {
    id: '5',
    name: 'hermes-agent',
    status: 'stopped',
    created: 'about 1 hour ago',
    createdISO: new Date(Date.now() - 60 * 60000).toISOString(),
    stopped: '37 minutes ago',
    stoppedISO: new Date(Date.now() - 37 * 60000).toISOString(),
    isActive: false,
  },
  {
    id: '6',
    name: 'hermes-agent',
    status: 'stopped',
    created: 'about 6 hours ago',
    createdISO: new Date(Date.now() - 6 * 3600000).toISOString(),
    stopped: 'about 1 hour ago',
    stoppedISO: new Date(Date.now() - 60 * 60000).toISOString(),
    isActive: false,
  },
  {
    id: '7',
    name: 'hermes-agent',
    status: 'stopped',
    created: '1 day ago',
    createdISO: new Date(Date.now() - 86400000).toISOString(),
    stopped: 'about 6 hours ago',
    stoppedISO: new Date(Date.now() - 6 * 3600000).toISOString(),
    isActive: false,
  },
  {
    id: '8',
    name: 'hermes-agent',
    status: 'stopped',
    created: '1 day ago',
    createdISO: new Date(Date.now() - 86400000).toISOString(),
    stopped: '1 day ago',
    stoppedISO: new Date(Date.now() - 86400000).toISOString(),
    isActive: false,
  },
]

const HEADERS = ['', 'Name', 'State', 'Created', 'Stopped', '']

export default function LogsPage() {
  return (
    <div>
      {/* Page header */}
      <h1 className="text-[26px] font-semibold text-white tracking-tight mb-1">Logs</h1>
      <span className="text-gray-400 text-xs font-medium block mb-4">
        These are all running and recently stopped Modal apps.
      </span>

      {/* Runtime history table */}
      <div className="bg-[#161616]/30 border border-[#262626] rounded-xl overflow-hidden w-full">
        <table className="w-full">
          <thead>
            <tr className="bg-[#161616] border-b border-[#262626]">
              {HEADERS.map((h, i) => (
                <th
                  key={h || i}
                  className="text-gray-400 text-xs font-medium p-3 text-left"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_LOGS.map((entry) => {
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
                  {/* Activity indicator */}
                  <td className="p-3 w-5">
                    {entry.isActive && (
                      <Activity className="w-3.5 h-3.5 text-[#34d399]" />
                    )}
                  </td>
                  {/* Name */}
                  <td className="p-3">
                    <span className={`font-mono font-medium ${nameColor}`}>
                      {entry.name}
                    </span>
                  </td>
                  {/* State */}
                  <td className={`p-3 ${stateColor}`}>{entry.status}</td>
                  {/* Created */}
                  <td className={`p-3 font-mono ${timeColor}`}>{entry.created}</td>
                  {/* Stopped */}
                  <td className={`p-3 ${timeColor}`}>{entry.stopped}</td>
                  {/* Action */}
                  <td className="p-3">
                    {!isTerminated && (
                      <button className="bg-[#161616] border border-[#2d2d2d] text-white hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/50 text-[11px] font-medium px-2.5 py-1 rounded transition-all">
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
    </div>
  )
}
