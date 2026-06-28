import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { getAppLogs } from '../api/apps'

interface LogEntry {
  timestamp: string
  level: string
  message: string
}

const statusOptions = ['Any', 'info', 'error', 'warning', 'debug']

function classNames(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export default function FunctionCallsTable({ appId }: { appId: string }) {
  const [statusFilter, setStatusFilter] = useState('Any')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const { data: logs, isLoading } = useQuery({
    queryKey: ['apps', appId, 'logs'],
    queryFn: () => getAppLogs(appId),
    enabled: !!appId,
  })

  const calls: LogEntry[] = logs || []

  const filteredCalls = statusFilter === 'Any'
    ? calls
    : calls.filter((c) => c.level === statusFilter)

  const statusColors: Record<string, string> = {
    info: 'text-[#34d399]',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    debug: 'text-blue-400',
  }

  return (
    <div className="mt-6">
      {/* Filter Row */}
      <div className="flex items-center justify-between py-3">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1 text-gray-300 text-xs font-medium hover:text-white transition-colors"
          >
            <span className="text-gray-400">Level:</span>
            <span>{statusFilter}</span>
            <ChevronDown className={classNames('h-3 w-3 text-gray-500 transition-transform', isDropdownOpen && 'rotate-180')} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-32 bg-[#1f1f1f] border border-[#262626] rounded-lg shadow-xl z-10 py-1">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status)
                    setIsDropdownOpen(false)
                  }}
                  className={classNames(
                    'w-full text-left px-3 py-1.5 text-xs hover:bg-[#262626] transition-colors',
                    status === statusFilter ? 'text-white' : 'text-gray-400'
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : filteredCalls.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">No logs yet.</p>
      ) : (
        <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
          <div className="flex bg-[#111111]/40 border-b border-[#262626] px-4 py-2.5 text-[11px] font-semibold tracking-wider text-gray-500">
            <span className="w-32">Timestamp</span>
            <span className="w-20">Level</span>
            <span className="flex-1">Message</span>
          </div>
          {filteredCalls.map((call, i) => (
            <div key={i} className="flex items-center px-4 py-3 border-b border-[#262626]/40 hover:bg-[#1f1f1f]/20 transition-colors text-xs">
              <span className="w-32 text-gray-400 font-mono">{new Date(call.timestamp).toLocaleString()}</span>
              <span className={classNames('w-20 font-medium', statusColors[call.level] || 'text-gray-400')}>
                {call.level}
              </span>
              <span className="flex-1 text-gray-300 font-mono">{call.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
