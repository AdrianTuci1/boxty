import { useMemo, useState } from 'react'
import {
  Search, Filter, Settings, ChevronDown,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getAppLogs } from '../api/apps'
import { useAuth } from '../hooks/useAuth'
import { shouldUseMocks } from '../core/services/mock-decider.service'
import MiniBarChart from './MiniBarChart'

interface LogEntry {
  id: string
  timestamp: string
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'
  content: string
}

const levelStyles: Record<string, { bg: string; text: string }> = {
  DEBUG: { bg: 'bg-blue-950/30', text: 'text-blue-400' },
  INFO: { bg: 'bg-[#142920]', text: 'text-[#34d399]' },
  WARN: { bg: 'bg-yellow-950/30', text: 'text-yellow-400' },
  ERROR: { bg: 'bg-red-950/30', text: 'text-red-400' },
  FATAL: { bg: 'bg-red-950/50', text: 'text-red-300' },
}

// Mock data for rich dev/mock experience
const mockLogs: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-06-09 17:15:00',
    level: 'INFO',
    content: 'Starting fastapi_app instance...',
  },
  {
    id: 'log-2',
    timestamp: '2026-06-09 17:15:02',
    level: 'INFO',
    content: 'Loading ML model checkpoints from disk...',
  },
  {
    id: 'log-3',
    timestamp: '2026-06-09 17:15:05',
    level: 'DEBUG',
    content: 'Model loaded successfully in 3.33s. Memory usage: 1.2 GB.',
  },
  {
    id: 'log-4',
    timestamp: '2026-06-09 17:15:06',
    level: 'INFO',
    content: 'Application startup complete. Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)',
  },
  {
    id: 'log-5',
    timestamp: '2026-06-09 17:16:12',
    level: 'INFO',
    content: 'GET /api/predict - Status 200 OK - processed in 124ms',
  },
  {
    id: 'log-6',
    timestamp: '2026-06-09 17:18:45',
    level: 'WARN',
    content: 'High CPU utilization detected on container instance inst-1.',
  },
  {
    id: 'log-7',
    timestamp: '2026-06-09 17:19:02',
    level: 'DEBUG',
    content: 'Autoscaler invoked: current containers = 2, target containers = 3.',
  },
  {
    id: 'log-8',
    timestamp: '2026-06-09 17:20:11',
    level: 'INFO',
    content: 'GET /healthz - Status 200 OK - processed in 3ms',
  },
]

const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)

export default function AppLogs({ appId, appName }: { appId?: string; appName: string }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandLogs, setExpandLogs] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [range, setRange] = useState('1d')
  const [rangeOpen, setRangeOpen] = useState(false)

  const timeRangeOptions = ['5m', '15m', '1h', '4h', '1d', '2d', '1w'] as const

  const rangeLabels: Record<string, string> = {
    '5m': 'past 5 minutes',
    '15m': 'past 15 minutes',
    '1h': 'past 1 hour',
    '4h': 'past 4 hours',
    '1d': 'past 24 hours',
    '2d': 'past 2 days',
    '1w': 'past 1 week',
  }

  const { devMode } = useAuth()
  const useMocks = devMode || shouldUseMocks()

  const { data: realLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['workloads', appId, 'logs'],
    queryFn: () => getAppLogs(appId!),
    enabled: !!appId && !useMocks,
  })

  const callsData = useMemo(() => {
    if (logsLoading) return Array(24).fill(0)
    const counts = Array(24).fill(0)
    const source = useMocks ? mockLogs : (realLogs || [])
    for (const log of source) {
      const date = new Date(log.timestamp)
      if (!isNaN(date.getTime())) {
        counts[date.getHours()] += 1
      }
    }
    return counts
  }, [appName, realLogs, logsLoading, useMocks])

  const logsToRender = useMocks
    ? mockLogs
    : (realLogs || []).map((l, idx) => ({
        id: `real-log-${idx}`,
        timestamp: new Date(l.timestamp).toLocaleString(),
        level: 'INFO' as const,
        content: l.message,
      }))

  const filteredLogs = logsToRender.filter((log) =>
    log.content.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-mono text-lg font-semibold text-white">
              {appName} / <span className="text-white">App Logs</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Time nav */}
          <div className="flex items-center border border-[#262626] rounded-md bg-[#161616] overflow-hidden text-xs text-gray-400">
            <button className="px-2 py-1.5 hover:text-white hover:bg-[#1f1f1f] transition-colors">«</button>
            <button className="px-2 py-1.5 border-x border-[#262626] hover:text-white hover:bg-[#1f1f1f] transition-colors">⏸</button>
            <button className="px-2 py-1.5 hover:text-white hover:bg-[#1f1f1f] transition-colors">»</button>
          </div>
          {/* Time range */}
          <div className="relative">
            <button
              onClick={() => setRangeOpen(!rangeOpen)}
              className="flex items-center gap-2 bg-[#161616] border border-[#262626] rounded-md px-3 py-1 text-xs text-white"
            >
              <span className="w-2 h-2 rounded-full bg-[#34d399] shrink-0" />
              <span>{range}</span>
              <span className="text-gray-400">Jun 5, 10:38 PM – now</span>
              <span className="flex items-center gap-1 text-gray-400 ml-1">
                EEST <ChevronDown className={`h-3 w-3 transition-transform ${rangeOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>
            {rangeOpen && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-[#1f1f1f] border border-[#262626] rounded-lg shadow-xl z-20 py-1">
                {timeRangeOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setRange(opt); setRangeOpen(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-[#262626] transition-colors text-left ${range === opt ? 'text-white' : 'text-gray-400'}`}
                  >
                    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#1f1f1f] border border-[#333] text-white">
                      {opt}
                    </span>
                    <span className="text-gray-400">{rangeLabels[opt]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="bg-[#161616] border border-[#262626] p-1.5 rounded-md text-gray-400 hover:text-white transition-colors">
            <Search className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="mb-4">
        <div className="h-24 w-full">
          <MiniBarChart
            data={callsData}
            loading={logsLoading}
            emptyMode="hidden"
            height={96}
            className="w-full"
          />
        </div>
        <div className="flex justify-between px-1 -mt-1">
          {hours.map((h, i) => (
            <span
              key={i}
              className={`text-gray-600 font-mono text-[8px] ${i % 3 === 0 ? '' : 'opacity-0'}`}
            >
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between py-3 border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-xs text-gray-400 border border-[#333] px-3 py-1.5 rounded-md hover:text-white hover:border-[#444] transition-colors"
          >
            <Filter className="h-3.5 w-3.5" />
            Add filter
          </button>

          {/* Expand logs toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpandLogs(!expandLogs)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                expandLogs ? 'bg-[#166534]' : 'bg-[#333]'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform ${
                  expandLogs ? 'translate-x-5 bg-[#4ade80]' : 'translate-x-1 bg-gray-400'
                }`}
              />
            </button>
            <span className="text-xs text-gray-400">Expand logs</span>
          </div>
        </div>

        {/* Search logs */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search logs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 bg-[#161616] text-gray-200 text-xs rounded-lg pl-9 pr-8 py-2 border border-[#262626] focus:outline-none focus:border-[#333] placeholder:text-gray-600"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-mono bg-[#111] px-1.5 py-0.5 rounded">
            /
          </kbd>
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center py-2 border-b border-[#262626] text-xs text-gray-500">
        <span className="w-48 font-medium">Timestamp</span>
        <span className="flex-1 font-medium">Content</span>
        <button className="p-1 hover:text-white transition-colors">
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-auto">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            {/* Empty state illustration */}
            <svg width="120" height="80" viewBox="0 0 120 80" className="mb-4">
              {/* Two sad log characters */}
              <rect x="10" y="20" width="40" height="50" rx="4" fill="none" stroke="#666" strokeWidth="2" />
              <rect x="60" y="10" width="45" height="55" rx="4" fill="none" stroke="#666" strokeWidth="2" />
              {/* Eyes */}
              <circle cx="25" cy="40" r="3" fill="#666" />
              <circle cx="35" cy="40" r="3" fill="#666" />
              <circle cx="78" cy="32" r="3" fill="#666" />
              <circle cx="90" cy="32" r="3" fill="#666" />
              {/* Sad mouths */}
              <path d="M 22 48 Q 30 44 38 48" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" />
              <path d="M 75 40 Q 84 36 93 40" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" />
              {/* Lines on logs */}
              <line x1="15" y1="28" x2="45" y2="28" stroke="#666" strokeWidth="1" />
              <line x1="15" y1="34" x2="40" y2="34" stroke="#666" strokeWidth="1" />
              <line x1="65" y1="20" x2="100" y2="20" stroke="#666" strokeWidth="1" />
              <line x1="65" y1="26" x2="95" y2="26" stroke="#666" strokeWidth="1" />
            </svg>
            <p className="text-white font-medium text-sm mb-1">No logs found</p>
            <p className="text-gray-500 text-xs">There are no logs to display.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#262626]/40">
            {filteredLogs.map((log) => {
              const styles = levelStyles[log.level] || levelStyles.INFO
              return (
                <div
                  key={log.id}
                  className="flex items-start py-2 hover:bg-[#1f1f1f]/50 transition-colors"
                >
                  <span className="w-48 text-gray-500 text-xs font-mono shrink-0">
                    {log.timestamp}
                  </span>
                  <div className="flex-1 flex items-start gap-2">
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${styles.bg} ${styles.text}`}>
                      {log.level}
                    </span>
                    <span className="text-gray-300 text-xs">{log.content}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
