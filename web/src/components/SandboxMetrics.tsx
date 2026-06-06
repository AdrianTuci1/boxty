import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend,
} from 'recharts'
import { ChevronDown, Pause, Filter, Info, Clock } from 'lucide-react'

const hours = ['Sat 06', '03 AM', '06 AM', '09 AM', '12 PM', '03 PM', '06 PM', '09 PM']

const summaryData = [
  { t: 'Sat 06', value: 0 },
  { t: '03 AM', value: 0 },
  { t: '04 AM', value: 1.2 },
  { t: '05 AM', value: 0.8 },
  { t: '06 AM', value: 0 },
  { t: '09 AM', value: 0 },
  { t: '12 PM', value: 0 },
  { t: '03 PM', value: 0 },
  { t: '06 PM', value: 0 },
  { t: '09 PM', value: 0 },
]

const cpuData = [
  { t: '00', used: 0.2, reserved: 0.5 },
  { t: '04', used: 0.8, reserved: 1.0 },
  { t: '08', used: 0.1, reserved: 0.5 },
  { t: '12', used: 0.3, reserved: 0.5 },
  { t: '16', used: 0.1, reserved: 0.5 },
  { t: '20', used: 0.2, reserved: 0.5 },
]

const memoryData = [
  { t: '00', used: 128, reserved: 512 },
  { t: '04', used: 512, reserved: 1024 },
  { t: '08', used: 64, reserved: 512 },
  { t: '12', used: 256, reserved: 512 },
  { t: '16', used: 64, reserved: 512 },
  { t: '20', used: 128, reserved: 512 },
]

const networkData = [
  { t: '00', egress: 10, ingress: 5 },
  { t: '04', egress: 50, ingress: 30 },
  { t: '08', egress: 5, ingress: 2 },
  { t: '12', egress: 20, ingress: 10 },
  { t: '16', egress: 5, ingress: 3 },
  { t: '20', egress: 15, ingress: 8 },
]

const lifetimeData = [
  { t: '00', p50: 30, p90: 60, p99: 120 },
  { t: '04', p50: 45, p90: 90, p99: 180 },
  { t: '08', p50: 20, p90: 40, p99: 80 },
  { t: '12', p50: 35, p90: 70, p99: 140 },
  { t: '16', p50: 25, p90: 50, p99: 100 },
  { t: '20', p50: 40, p90: 80, p99: 160 },
]

const startupData = [
  { t: '00', p50: 500, p90: 1000, p99: 2000 },
  { t: '04', p50: 800, p90: 1500, p99: 3000 },
  { t: '08', p50: 400, p90: 800, p99: 1600 },
  { t: '12', p50: 600, p90: 1200, p99: 2400 },
  { t: '16', p50: 450, p90: 900, p99: 1800 },
  { t: '20', p50: 700, p90: 1400, p99: 2800 },
]

// Mock sandbox instances data
const sandboxInstances = [
  {
    id: '1',
    createdAt: 'Jun 6, 2026, 04:34:35',
    timeToStarted: '904ms',
    lifetime: '1m 8s',
    status: 'Terminated',
  },
  {
    id: '2',
    createdAt: 'Jun 6, 2026, 04:04:43',
    timeToStarted: '1.12s',
    lifetime: '8m 58s',
    status: 'Terminated',
  },
]

interface MetricCardProps {
  value: string
  label: string
}

function MetricCard({ value, label }: MetricCardProps) {
  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl p-6 text-center">
      <div className="text-3xl font-semibold text-white">{value}</div>
      <div className="text-sm text-gray-500 mt-2">{label}</div>
    </div>
  )
}

interface ChartCardProps {
  title: string
  children: React.ReactNode
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-3">{title}</h3>
      {children}
    </div>
  )
}

export default function SandboxMetrics({ appName }: { appName: string }) {
  const [activeTab, setActiveTab] = useState<'Metrics' | 'Sandboxes'>('Metrics')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-mono text-lg font-semibold text-white">
              {appName} / <span className="text-white">Sandboxes</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Time nav */}
          <div className="flex items-center border border-[#262626] rounded-md bg-[#161616] overflow-hidden text-xs text-gray-400">
            <button className="px-2 py-1.5 hover:text-white hover:bg-[#1f1f1f] transition-colors">«</button>
            <button className="px-2 py-1.5 border-x border-[#262626] hover:text-white hover:bg-[#1f1f1f] transition-colors">
              <Pause className="h-3 w-3" />
            </button>
            <button className="px-2 py-1.5 hover:text-white hover:bg-[#1f1f1f] transition-colors">»</button>
          </div>
          {/* Time range */}
          <div className="flex items-center gap-2 bg-[#161616] border border-[#262626] rounded-md px-3 py-1 text-xs text-white">
            <span className="w-2 h-2 rounded-full bg-[#a3e635] shrink-0" />
            <span className="bg-[#262626] px-1.5 py-0.5 rounded text-gray-400">1d</span>
            <span>Jun 5, 10:42 PM – now</span>
            <span className="flex items-center gap-1 text-gray-400 ml-1">
              EEST <ChevronDown className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard value="0" label="Concurrent sandboxes" />
        <MetricCard value="2" label="Total sandboxes created" />
        <MetricCard value="0.000023" label="Average sandboxes created per second" />
      </div>

      {/* Summary Chart */}
      <div className="mb-6">
        <p className="text-xs text-gray-400 font-medium mb-2">Sandboxes created</p>
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={summaryData}>
              <defs>
                <linearGradient id="sandboxFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f472b6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f472b6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="t"
                stroke="#555"
                tick={{ fontSize: 10, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#262626' }}
                tickLine={false}
              />
              <YAxis
                stroke="#555"
                tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#4b5563' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #262626', fontSize: 11 }} />
              <Area type="monotone" dataKey="value" stroke="#f472b6" fill="url(#sandboxFill)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between px-8 -mt-1">
          {hours.map((h) => (
            <span key={h} className="text-gray-500 font-mono text-[10px]">{h}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="h-10 border-b border-[#262626] flex items-center justify-between mb-4">
        <div className="flex items-center gap-5 h-full">
          {(['Metrics', 'Sandboxes'] as const).map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative h-full flex items-center text-xs font-medium transition-colors ${
                  isActive ? 'text-white font-semibold' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
                {isActive && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#a3e635]" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'Metrics' && (
        <div className="grid grid-cols-2 gap-4 overflow-auto">
          <ChartCard title="Sandboxes">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="t" stroke="#555" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #262626' }} />
                  <Bar dataKey="value" fill="#fbbf24" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="CPU">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cpuData}>
                  <defs>
                    <linearGradient id="cpuUsed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#84cc16" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#84cc16" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="t" stroke="#555" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #262626' }} />
                  <Legend />
                  <Area type="monotone" dataKey="used" stroke="#84cc16" fill="url(#cpuUsed)" name="Used" />
                  <Area type="monotone" dataKey="reserved" stroke="#6b7280" fill="none" strokeDasharray="3 3" name="Reserved" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Memory">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={memoryData}>
                  <defs>
                    <linearGradient id="memUsed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#facc15" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#facc15" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="t" stroke="#555" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #262626' }} />
                  <Legend />
                  <Area type="monotone" dataKey="used" stroke="#facc15" fill="url(#memUsed)" name="Used" />
                  <Area type="monotone" dataKey="reserved" stroke="#6b7280" fill="none" strokeDasharray="3 3" name="Reserved" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Network">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={networkData}>
                  <defs>
                    <linearGradient id="egressFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c084fc" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#c084fc" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ingressFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="t" stroke="#555" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #262626' }} />
                  <Legend />
                  <Area type="monotone" dataKey="egress" stroke="#c084fc" fill="url(#egressFill)" name="Egress" />
                  <Area type="monotone" dataKey="ingress" stroke="#60a5fa" fill="url(#ingressFill)" name="Ingress" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Lifetime">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lifetimeData}>
                  <defs>
                    <linearGradient id="p50Fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f472b6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f472b6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="t" stroke="#555" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #262626' }} />
                  <Legend />
                  <Area type="monotone" dataKey="p50" stroke="#f472b6" fill="url(#p50Fill)" name="p50" />
                  <Area type="monotone" dataKey="p90" stroke="#a855f7" fill="none" strokeDasharray="3 3" name="p90" />
                  <Area type="monotone" dataKey="p99" stroke="#c084fc" fill="none" strokeDasharray="5 5" name="p99" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Time to Started">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={startupData}>
                  <defs>
                    <linearGradient id="startupFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#93c5fd" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="t" stroke="#555" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #262626' }} />
                  <Legend />
                  <Area type="monotone" dataKey="p50" stroke="#93c5fd" fill="url(#startupFill)" name="p50" />
                  <Area type="monotone" dataKey="p90" stroke="#3b82f6" fill="none" strokeDasharray="3 3" name="p90" />
                  <Area type="monotone" dataKey="p99" stroke="#60a5fa" fill="none" strokeDasharray="5 5" name="p99" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      )}

      {activeTab === 'Sandboxes' && (
        <div className="flex flex-col h-full">
          {/* Add Filter Button */}
          <button className="mb-4 inline-flex items-center rounded-lg border border-[#262626] bg-transparent px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-[#1f1f1f] hover:text-white w-fit">
            <Filter className="h-4 w-4 mr-2" />
            Add filter
          </button>

          {/* Table Container */}
          <div className="overflow-hidden rounded-lg border border-[#262626]">
            <table className="w-full">
              {/* Table Header */}
              <thead>
                <tr className="border-b border-[#262626] bg-[#161616]">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400">
                    Created (EEST)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400">
                    <span className="inline-flex items-center">
                      Time to Started
                      <Info className="h-3 w-3 ml-1 text-gray-500" />
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400">
                    <span className="inline-flex items-center">
                      Lifetime
                      <Info className="h-3 w-3 ml-1 text-gray-500" />
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400">
                    Status
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-[#262626] bg-[#111111]">
                {sandboxInstances.map((instance) => (
                  <tr
                    key={instance.id}
                    className="transition-colors hover:bg-[#1a1a1a]"
                  >
                    <td className="px-6 py-4 text-sm text-gray-300 font-mono">
                      {instance.createdAt}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 font-mono">
                      {instance.timeToStarted}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 font-mono">
                      {instance.lifetime}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs bg-[#262626] text-gray-300">
                        <Clock className="h-3 w-3 mr-1.5" />
                        {instance.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Message */}
          <p className="mt-6 text-center text-sm italic text-gray-500">
            Change the time interval to see more results.
          </p>
        </div>
      )}
    </div>
  )
}
