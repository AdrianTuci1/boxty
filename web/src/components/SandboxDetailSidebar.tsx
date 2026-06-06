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
            <div className="bg-[#161616] border border-[#262626] rounded-xl p-6">
              <div className="relative flex items-center justify-between py-4">
                {/* Timeline bar */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-[#262626] rounded-full">
                  <div className="h-full bg-[#34d399] rounded-full" style={{ width: '100%' }} />
                </div>
                
                {/* Timeline nodes */}
                {[
                  { label: 'Created', duration: '142ms', time: '04:34:35' },
                  { label: 'Scheduled', duration: '762ms', time: '04:34:36' },
                  { label: 'Started', duration: '1m 8s', time: '04:34:36' },
                  { label: 'Terminated', duration: '', time: '04:35:44' },
                ].map((stage, index, arr) => (
                  <div key={stage.label} className="flex flex-col items-center relative z-10">
                    {/* Label above */}
                    <span className="text-[10px] text-gray-500 mb-3">{stage.label}</span>
                    
                    {/* Node dot */}
                    <div className={`w-3 h-3 rounded-full border-2 ${
                      index === arr.length - 1 ? 'bg-[#111111] border-[#34d399]' : 'bg-[#34d399] border-[#34d399]'
                    }`} />
                    
                    {/* Duration below */}
                    {stage.duration && (
                      <span className="text-[10px] text-white mt-2">{stage.duration}</span>
                    )}
                    
                    {/* Time below */}
                    <span className="text-[10px] text-gray-500">{stage.time}</span>
                  </div>
                ))}
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
              <div className="text-center text-gray-500 py-8">
                Details coming soon
              </div>
            )}

            {activeTab === 'Events' && (
              <div className="text-center text-gray-500 py-8">
                Events coming soon
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
