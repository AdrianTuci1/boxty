import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { PanelRightClose, ChevronDown } from 'lucide-react'

const mockChartData = [
  { time: 'Sat 06', agent1: 0, agent2: 0, agent3: 0, agent4: 0 },
  { time: '03 AM', agent1: 0.2, agent2: 0.3, agent3: 0.1, agent4: 0.4 },
  { time: '06 AM', agent1: 0, agent2: 0, agent3: 0, agent4: 0 },
  { time: '09 AM', agent1: 0, agent2: 0, agent3: 0, agent4: 0 },
  { time: '12 PM', agent1: 0, agent2: 0, agent3: 0, agent4: 0 },
  { time: '03 PM', agent1: 0, agent2: 0, agent3: 0, agent4: 0 },
  { time: '06 PM', agent1: 0, agent2: 0, agent3: 0, agent4: 0 },
  { time: '09 PM', agent1: 0, agent2: 0, agent3: 0, agent4: 0 },
]

interface MetricCardProps {
  label: string
  value: number
  limit?: number
  fullWidth?: boolean
}

function MetricCard({ label, value, limit, fullWidth }: MetricCardProps) {
  return (
    <div className={`bg-[#1f1f1f] rounded-lg p-4 border border-[#262626] ${fullWidth ? 'col-span-3' : ''}`}>
      <div className="text-gray-400 text-sm">{label}</div>
      <div className="flex items-center gap-3 mt-2">
        <span className="text-3xl font-medium text-white">{value}</span>
        {limit && (
          <span className="bg-[#161616] text-gray-400 px-2 py-0.5 rounded text-xs border border-[#262626]">
            Limit: {limit}
          </span>
        )}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0)
    return (
      <div className="bg-[#1f1f1f] border border-[#262626] rounded-lg p-3 shadow-xl">
        <p className="text-white text-sm font-medium mb-2">{label} {total.toFixed(2)}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-300">hermes-agent</span>
            <span className="text-white ml-auto">{entry.value?.toFixed(2) || '0.00'}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function WorkspaceMetricsDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'usage' | 'breakdown'>('usage')
  const [resource] = useState('Containers')

  // Listen for toggle event from navbar
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev)
    window.addEventListener('toggle-workspace-metrics', handleToggle)
    return () => window.removeEventListener('toggle-workspace-metrics', handleToggle)
  }, [])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
      <div className="fixed inset-y-0 right-0 w-[480px] bg-[#111111] border-l border-[#262626] z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#262626]">
          <h2 className="text-lg font-semibold text-white">Workspace metrics</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            <PanelRightClose className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Environment Filter */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-gray-400 text-sm">Environments:</span>
            <button className="flex items-center gap-1 bg-[#161616] border border-[#262626] rounded-md px-3 py-1.5 text-sm text-white hover:border-[#333] transition-colors">
              All
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <MetricCard label="Total containers" value={0} limit={100} />
            <MetricCard label="Live sandboxes" value={0} />
            <MetricCard label="Pending sandboxes" value={0} />
            <div className="col-span-3">
              <MetricCard label="Total GPUs" value={0} limit={10} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-[#262626] mb-4">
            <button
              onClick={() => setActiveTab('usage')}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'usage' ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Usage over time
              {activeTab === 'usage' && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#34d399]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('breakdown')}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'breakdown' ? 'text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Breakdown
              {activeTab === 'breakdown' && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#34d399]" />
              )}
            </button>
          </div>

          {/* Chart Controls */}
          <div className="flex items-center justify-between mb-4">
            <button className="flex items-center gap-1 bg-[#161616] border border-[#262626] rounded-md px-3 py-1.5 text-sm text-white hover:border-[#333] transition-colors">
              Resource: {resource}
              <ChevronDown className="h-3 w-3 text-gray-500" />
            </button>
            <div className="flex items-center gap-2 bg-[#161616] border border-[#262626] rounded-md px-3 py-1.5">
              <span className="w-2 h-2 rounded-full bg-[#34d399] shrink-0" />
              <span className="bg-[#1f1f1f] text-white text-xs px-2 py-0.5 rounded">1d</span>
              <span className="text-white text-xs">Jun 5, 11:01 PM – now</span>
              <span className="flex items-center gap-1 text-gray-400 text-xs">
                EEST <ChevronDown className="h-3 w-3" />
              </span>
            </div>
          </div>

          {/* Chart */}
          {activeTab === 'usage' && (
            <div className="bg-[#161616] border border-[#262626] rounded-xl p-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChartData}>
                    <defs>
                      <linearGradient id="colorAgent1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5fb3a3" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#5fb3a3" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="colorAgent2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a8e6a3" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#a8e6a3" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="colorAgent3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e89b72" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#e89b72" stopOpacity={0.3} />
                      </linearGradient>
                      <linearGradient id="colorAgent4" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f5a9d0" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#f5a9d0" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis
                      dataKey="time"
                      stroke="#555"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 1]}
                      ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
                      stroke="#555"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="agent1"
                      stackId="1"
                      stroke="#5fb3a3"
                      fill="url(#colorAgent1)"
                      strokeWidth={1}
                    />
                    <Area
                      type="monotone"
                      dataKey="agent2"
                      stackId="1"
                      stroke="#a8e6a3"
                      fill="url(#colorAgent2)"
                      strokeWidth={1}
                    />
                    <Area
                      type="monotone"
                      dataKey="agent3"
                      stackId="1"
                      stroke="#e89b72"
                      fill="url(#colorAgent3)"
                      strokeWidth={1}
                    />
                    <Area
                      type="monotone"
                      dataKey="agent4"
                      stackId="1"
                      stroke="#f5a9d0"
                      fill="url(#colorAgent4)"
                      strokeWidth={1}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4">
                {[
                  { color: '#5fb3a3', label: 'hermes-agent' },
                  { color: '#a8e6a3', label: 'hermes-agent' },
                  { color: '#e89b72', label: 'hermes-agent' },
                  { color: '#f5a9d0', label: 'hermes-agent' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-400 text-xs">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'breakdown' && (
            <div className="text-center text-gray-500 py-12">
              Breakdown view coming soon
            </div>
          )}
        </div>
      </div>
    </>
  )
}
