import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FunctionCall {
  id: string
  route: string
  enqueued: string
  started: string
  startup: string
  execution: string
  status: 'success' | 'error' | 'pending' | 'running'
}

const statusOptions = ['Any', 'success', 'error', 'pending', 'running']

function classNames(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export default function FunctionCallsTable() {
  const [statusFilter, setStatusFilter] = useState('Any')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Mock data - replace with actual API call
  const calls: FunctionCall[] = []

  const filteredCalls = statusFilter === 'Any'
    ? calls
    : calls.filter((c) => c.status === statusFilter)

  const statusColors: Record<string, string> = {
    success: 'text-[#34d399]',
    error: 'text-red-400',
    pending: 'text-yellow-400',
    running: 'text-blue-400',
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
            <span className="text-gray-400">Status:</span>
            <span>{statusFilter}</span>
            <ChevronDown className={classNames('h-3 w-3 text-gray-500 transition-transform', isDropdownOpen && 'rotate-180')} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-[#1f1f1f] border border-[#262626] rounded-md shadow-lg z-10 min-w-[120px]">
              {statusOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setStatusFilter(opt)
                    setIsDropdownOpen(false)
                  }}
                  className={classNames(
                    'w-full text-left px-3 py-2 text-xs transition-colors',
                    statusFilter === opt
                      ? 'text-white bg-[#262626]'
                      : 'text-gray-400 hover:text-white hover:bg-[#262626]'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="flex items-center gap-1.5 bg-red-950/10 border border-red-900/40 text-red-400 text-xs font-medium px-2.5 py-1 rounded-md hover:bg-red-950/30 transition-all cursor-pointer">
          <span className="text-sm leading-none">⨂</span> Clear queue
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#262626]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#161616] text-gray-400 text-xs border-b border-[#262626]">
              <th className="px-4 py-3 text-left font-medium">Route</th>
              <th className="px-4 py-3 text-left font-medium">Enqueued (EEST)</th>
              <th className="px-4 py-3 text-left font-medium">Started (EEST)</th>
              <th className="px-4 py-3 text-left font-medium">
                <span className="flex items-center gap-1">
                  Startup
                  <span className="text-gray-500 cursor-help" title="Time spent initializing the function container">ℹ</span>
                </span>
              </th>
              <th className="px-4 py-3 text-left font-medium">Execution</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredCalls.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="bg-[#161616]/30 font-mono text-xs text-gray-500 py-8 text-center"
                >
                  No matching function calls found.
                </td>
              </tr>
            ) : (
              filteredCalls.map((call) => (
                <tr
                  key={call.id}
                  className="border-b border-[#262626]/50 hover:bg-[#1f1f1f]/50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-gray-300">{call.route}</td>
                  <td className="px-4 py-3 text-gray-400">{call.enqueued}</td>
                  <td className="px-4 py-3 text-gray-400">{call.started}</td>
                  <td className="px-4 py-3 text-gray-400">{call.startup}</td>
                  <td className="px-4 py-3 text-gray-400">{call.execution}</td>
                  <td className="px-4 py-3">
                    <span className={classNames('text-xs font-medium', statusColors[call.status] || 'text-gray-400')}>
                      {call.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Empty state hint */}
      {filteredCalls.length === 0 && (
        <p className="text-gray-500 text-xs italic text-center w-full mt-4">
          Change the time interval to see more results.
        </p>
      )}
    </div>
  )
}
