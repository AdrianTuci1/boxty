import { useState } from 'react'
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, LineChart,
} from 'recharts'
import { X, Copy, Clock, ChevronDown, ExternalLink } from 'lucide-react'

interface SandboxDetailSidebarProps {
  isOpen: boolean
  onClose: () => void
  sandboxId: string
}

// Mock data for charts
const cpuData = [
  { t: '04:35', used: 0.005, reserved: 8 },
  { t: ':30', used: 0.008, reserved: 8 },
]

const memoryData = [
  { t: '04:35', used: 1.8, reserved: 16 },
  { t: ':30', used: 2.32, reserved: 16 },
]

const networkData = [
  { t: '04:35', egress: 0, ingress: 0 },
  { t: ':30', egress: 0, ingress: 0 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1f1f1f] border border-[#262626] rounded-lg p-3 shadow-xl">
        <p className="text-white text-xs font-medium mb-2">Sat Jun 6, {label} AM</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-300">{entry.name}:</span>
            <span className="text-white ml-auto">{entry.value?.toFixed(2)} {entry.unit || ''}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function SandboxDetailSidebar({ isOpen, onClose, sandboxId }: SandboxDetailSidebarProps) {
  const [activeTab, setActiveTab] = useState<'Logs' | 'Details' | 'Events'>('Logs')
  const [metricsExpanded, setMetricsExpanded] = useState(true)

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 w-[560px] bg-[#111111] border-l border-[#262626] z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#262626]">
          <span className="text-xs text-gray-500">Sandbox</span>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {/* Instance ID */}
          <div className="p-4 border-b border-[#262626]">
            <div className="flex items-center gap-2">
              <h2 className="font-mono text-lg font-semibold text-white">{sandboxId}</h2>
              <button 
                className="text-gray-500 hover:text-white transition-colors"
                onClick={() => navigator.clipboard.writeText(sandboxId)}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs bg-[#262626] text-gray-300">
                <Clock className="h-3 w-3 mr-1.5" />
                Terminated
              </span>
            </div>
          </div>

          {/* Lifecycle Timeline */}
          <div className="p-4">
            <div className="bg-[#161616] border border-[#262626] rounded-xl p-5">
              {/* Labels row */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-gray-500">Created</span>
                <span className="text-[11px] text-gray-500">Scheduled</span>
                <span className="text-[11px] text-gray-500">Started</span>
                <span className="text-[11px] text-gray-500">Terminated</span>
              </div>

              {/* Timeline bar with proportional segments */}
              <div className="flex h-8 rounded-md overflow-hidden">
                <div className="flex items-center justify-center bg-[#262626] text-white text-[11px] font-medium" style={{ width: '1%' }}>
                  142ms
                </div>
                <div className="w-px bg-[#111111]" />
                <div className="flex items-center justify-center bg-[#2a2a2a] text-white text-[11px] font-medium" style={{ width: '5%' }}>
                  762ms
                </div>
                <div className="w-px bg-[#111111]" />
                <div className="flex items-center justify-center bg-[#333333] text-white text-[11px] font-medium flex-1">
                  1m 8s
                </div>
                <div className="w-px bg-[#111111]" />
                <div className="flex items-center justify-center bg-[#262626] w-8">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Timestamps row */}
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-gray-500 font-mono">04:34:35</span>
                <span className="text-[11px] text-gray-500 font-mono">04:34:36</span>
                <span className="text-[11px] text-gray-500 font-mono">04:34:36</span>
                <span className="text-[11px] text-gray-500 font-mono">04:35:44</span>
              </div>
            </div>
          </div>

          {/* Metrics Section */}
          <div className="px-4 pb-4">
            <button 
              onClick={() => setMetricsExpanded(!metricsExpanded)}
              className="flex items-center justify-between w-full mb-4"
            >
              <h3 className="text-xl font-semibold text-white">Metrics</h3>
              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${metricsExpanded ? '' : '-rotate-90'}`} />
            </button>

            {metricsExpanded && (
              <div className="grid grid-cols-2 gap-3">
                {/* CPU Chart */}
                <div className="bg-[#161616] border border-[#262626] rounded-xl p-3">
                  <h4 className="text-xs text-gray-400 text-center mb-2">CPU cores used</h4>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cpuData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey="t" stroke="#555" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#555" tick={{ fontSize: 10 }} domain={[0, 10]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="used" stroke="#a3e635" strokeWidth={2} dot={false} name="Used" />
                        <Line type="monotone" dataKey="reserved" stroke="#6b7280" strokeWidth={2} dot={false} name="Reserved" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm bg-[#a3e635]" />
                      <span className="text-[10px] text-gray-400">Used</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm bg-[#6b7280]" />
                      <span className="text-[10px] text-gray-400">Reserved</span>
                    </div>
                  </div>
                </div>

                {/* Memory Chart */}
                <div className="bg-[#161616] border border-[#262626] rounded-xl p-3">
                  <h4 className="text-xs text-gray-400 text-center mb-2">Memory used</h4>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={memoryData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey="t" stroke="#555" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#555" tick={{ fontSize: 10 }} domain={[0, 20]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="used" stroke="#facc15" strokeWidth={2} dot={false} name="Used" />
                        <Line type="monotone" dataKey="reserved" stroke="#6b7280" strokeWidth={2} dot={false} name="Reserved" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm bg-[#facc15]" />
                      <span className="text-[10px] text-gray-400">Used</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm bg-[#6b7280]" />
                      <span className="text-[10px] text-gray-400">Reserved</span>
                    </div>
                  </div>
                </div>

                {/* Network Chart */}
                <div className="bg-[#161616] border border-[#262626] rounded-xl p-3 col-span-2">
                  <h4 className="text-xs text-gray-400 text-center mb-2">Network</h4>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={networkData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                        <XAxis dataKey="t" stroke="#555" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="egress" stroke="#a855f7" strokeWidth={2} dot={false} name="Egress" />
                        <Line type="monotone" dataKey="ingress" stroke="#3b82f6" strokeWidth={2} dot={false} name="Ingress" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm bg-[#a855f7]" />
                      <span className="text-[10px] text-gray-400">Egress</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm bg-[#3b82f6]" />
                      <span className="text-[10px] text-gray-400">Ingress</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-t border-[#262626]">
            <div className="flex items-center gap-0 px-4">
              {(['Logs', 'Details', 'Events'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#34d399]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'Logs' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Logs</h3>
                  <button className="flex items-center gap-1 text-xs text-gray-400 border border-[#262626] rounded-md px-3 py-1.5 hover:text-white transition-colors">
                    View all logs
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-xs">
                    <div className="w-2 h-2 rounded-sm bg-[#a855f7] mt-1 shrink-0" />
                    <span className="text-gray-500 font-mono">Jun 06 04:35:45.107</span>
                    <span className="text-gray-300">Runner terminated.</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Details' && (
              <div className="space-y-4">
                {/* Information Section */}
                <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626]">
                    <span className="text-sm font-medium text-white">Information</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Container ID</span>
                        <Copy className="h-3.5 w-3.5 text-gray-500 cursor-pointer hover:text-white" />
                      </div>
                      <span className="text-sm text-white font-mono">ta-01KTD92N19HMG8DSJKSKAP7323</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Image ID</span>
                        <Copy className="h-3.5 w-3.5 text-gray-500 cursor-pointer hover:text-white" />
                      </div>
                      <span className="text-sm text-white font-mono">im-MkJOWR3ZF5JPyC7WtrecWp</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Readiness probe</span>
                      <span className="text-sm text-white">None</span>
                    </div>
                  </div>
                </div>

                {/* Timeout Configuration Section */}
                <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626]">
                    <span className="text-sm font-medium text-white">Timeout Configuration</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">Timeout</span>
                      <span className="text-sm text-white">1h 0m</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">Idle Timeout</span>
                      <span className="text-sm text-white">None</span>
                    </div>
                  </div>
                </div>

                {/* Resources Section */}
                <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626]">
                    <span className="text-sm font-medium text-white">Resources</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="p-4 grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">CPU request</span>
                      <span className="text-sm text-white">8 cores</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">CPU limit</span>
                      <span className="text-sm text-white">None</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">GPUs</span>
                      <span className="text-sm text-white">None</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">Memory request</span>
                      <span className="text-sm text-white">16384 MiB</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500 block mb-1">Memory limit</span>
                      <span className="text-sm text-white">None</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Events' && (
              <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#262626]">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Event</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626]">
                    {[
                      { event: 'Created', timestamp: 'Jun 6, 04:34:35.931' },
                      { event: 'Scheduled', timestamp: 'Jun 6, 04:34:36.073' },
                      { event: 'Started', timestamp: 'Jun 6, 04:34:36.835' },
                      { event: 'Terminated', timestamp: 'Jun 6, 04:35:44.992' },
                    ].map((item, index) => (
                      <tr key={index} className="hover:bg-[#1a1a1a] transition-colors">
                        <td className="px-4 py-3 text-sm text-white">{item.event}</td>
                        <td className="px-4 py-3 text-sm text-gray-400 font-mono">{item.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
