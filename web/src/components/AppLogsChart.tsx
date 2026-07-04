import { useMemo, useState } from 'react'
import { Search, ChevronDown, Copy, ExternalLink } from 'lucide-react'
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

export interface AppLogsChartProps {
  appId?: string
  appName: string
  /** Optional subtitle shown next to the app name. */
  subtitle?: string
  /** Optional endpoint URL shown below the app name. */
  endpointUrl?: string
}

export default function AppLogsChart({ appId, appName, subtitle, endpointUrl }: AppLogsChartProps) {
  const { devMode } = useAuth()
  const useMocks = devMode || shouldUseMocks()
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

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-mono text-lg font-semibold text-white">
              {appName}
              {subtitle && <span className="text-white"> / {subtitle}</span>}
            </h1>
          </div>
          {endpointUrl && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-400 font-mono">{endpointUrl}</span>
              <button
                onClick={() => navigator.clipboard.writeText(endpointUrl)}
                className="text-gray-500 hover:text-white transition-colors"
                aria-label="Copy endpoint URL"
              >
                <Copy className="h-3 w-3" />
              </button>
              <a
                href={endpointUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors"
                aria-label="Open endpoint URL"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
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

      {/* Chart */}
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
  )
}
