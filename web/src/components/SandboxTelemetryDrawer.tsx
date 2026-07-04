import { useSearchParams, useLocation } from 'react-router-dom'
import Drawer, { useDrawerParam } from './Drawer'
import { Copy } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line } from 'recharts'

const ganttSteps = [
  { label: 'Created', duration: '', time: '10:00:00.000' },
  { label: 'Scheduled', duration: '137ms', time: '10:00:00.137', color: '#555' },
  { label: 'Started', duration: '671ms', time: '10:00:00.808', color: '#555' },
  { label: 'Running', duration: '4m 57s', time: '10:04:57.808', color: '#34d399' },
  { label: 'Terminated', duration: '', time: '10:05:02.341', color: '#555' },
]

const cpuChartData = Array.from({ length: 30 }, (_, i) => ({
  time: `${i * 10}s`,
  usage: Math.random() * 2,
  reserved: 1,
}))

const memChartData = Array.from({ length: 30 }, (_, i) => ({
  time: `${i * 10}s`,
  usage: Math.random() * 4 + 1,
  capacity: 10,
}))

const netChartData = Array.from({ length: 30 }, (_, i) => ({
  time: `${i * 10}s`,
  egress: Math.random() * 50,
  ingress: Math.random() * 80,
}))

const events = [
  { time: '10:00:00.000', event: 'Scheduled', detail: 'Container scheduled' },
  { time: '10:00:00.137', event: 'ImagePulled', detail: 'python:3.11 pulled' },
  { time: '10:00:00.671', event: 'ContainerCreated', detail: 'Container instance created' },
  { time: '10:00:00.808', event: 'Started', detail: 'Container started successfully' },
  { time: '10:04:57.808', event: 'SIGTERM', detail: 'Received signal termination' },
  { time: '10:05:02.341', event: 'Terminated', detail: 'Container exited with code 0' },
]

export function SandboxTelemetryDrawer() {
  const location = useLocation()
  const [sandboxId, close] = useDrawerParam('sandboxId')
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'logs'
  const isOpen = !!sandboxId && location.pathname.startsWith('/sandboxes')

  const setTab = (t: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('tab', t)
    setSearchParams(next, { replace: true })
  }

  return (
    <Drawer open={isOpen} onClose={close} width="w-[600px]">
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white font-mono">{sandboxId}</h2>
            <button className="text-gray-500 hover:text-white transition-colors">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="rounded border border-[#333] bg-[#222222] px-2 py-0.5 text-xs text-gray-500">Terminated</span>
        </div>

        {/* Gantt tracer */}
        <div className="space-y-2">
          {ganttSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className={`h-3 w-3 rounded-full ${i === ganttSteps.length - 1 ? 'bg-gray-500' : 'bg-mint'}`} />
                {i < ganttSteps.length - 1 && <div className="w-px flex-1 bg-[#333] min-h-[8px]" />}
              </div>
              <div className="flex items-center gap-2 flex-1">
                {step.duration && (
                  <div
                    className="h-2 rounded"
                    style={{
                      width: `${Math.max(40, (i / ganttSteps.length) * 200)}px`,
                      backgroundColor: step.color,
                      opacity: 0.3,
                    }}
                  />
                )}
                <span className="text-xs text-gray-300">{step.label}</span>
                {step.duration && <span className="text-xs text-gray-600">{step.duration}</span>}
              </div>
              <span className="text-[11px] text-gray-600 font-mono">{step.time}</span>
            </div>
          ))}
        </div>

        {/* Navigation tabs */}
        <div className="flex gap-4 border-b border-[#262626]">
          {['logs', 'metrics', 'details', 'events'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 text-xs font-medium capitalize transition-colors ${
                tab === t
                  ? 'border-b-2 border-mint text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'logs' && <LogsTab />}
        {tab === 'metrics' && <MetricsTab />}
        {tab === 'details' && <DetailsTab />}
        {tab === 'events' && <EventsTab />}
      </div>
    </Drawer>
  )
}

function LogsTab() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="flex gap-2 mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-gray-600">
            <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 10L12 14L16 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-gray-600 rotate-180">
            <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 10L12 14L16 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-sm font-medium">No logs found</p>
        <p className="text-xs text-gray-600 mt-1">There are no logs to display.</p>
      </div>
      <div className="rounded-lg bg-black p-4 font-mono text-[13px] text-green-400/70">
        <pre className="text-[#333]">[kernel] no log output from terminated sandbox</pre>
      </div>
    </div>
  )
}

function MetricsTab() {
  return (
    <div className="space-y-6">
      {/* CPU */}
      <MetricChart title="CPU Cores Used">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={cpuChartData}>
            <XAxis dataKey="time" stroke="#555" tick={{ fontSize: 10 }} />
            <YAxis stroke="#555" tick={{ fontSize: 10 }} domain={[0, 3]} />
            <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #262626', fontSize: 11 }} />
            <Area type="monotone" dataKey="usage" stroke="#34d399" fill="#34d399" fillOpacity={0.1} strokeWidth={1.5} />
            <Line type="monotone" dataKey="reserved" stroke="#555" strokeDasharray="4 4" strokeWidth={1} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </MetricChart>

      {/* Memory */}
      <MetricChart title="Memory Footprint">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={memChartData}>
            <XAxis dataKey="time" stroke="#555" tick={{ fontSize: 10 }} />
            <YAxis stroke="#555" tick={{ fontSize: 10 }} domain={[0, 12]} />
            <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #262626', fontSize: 11 }} />
            <Area type="monotone" dataKey="usage" stroke="#eab308" fill="#eab308" fillOpacity={0.1} strokeWidth={1.5} />
            <Line type="monotone" dataKey="capacity" stroke="#555" strokeDasharray="4 4" strokeWidth={1} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </MetricChart>

      {/* Network I/O */}
      <MetricChart title="Network I/O Streams">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={netChartData}>
            <XAxis dataKey="time" stroke="#555" tick={{ fontSize: 10 }} />
            <YAxis stroke="#555" tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #262626', fontSize: 11 }} />
            <Area type="monotone" dataKey="egress" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.1} strokeWidth={1.5} />
            <Area type="monotone" dataKey="ingress" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.1} strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </MetricChart>

      <div className="flex gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#a78bfa]" />Egress</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#60a5fa]" />Ingress</span>
      </div>
    </div>
  )
}

function MetricChart({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-2">{title}</p>
      <div className="h-32">{children}</div>
    </div>
  )
}

function DetailsTab() {
  return (
    <div className="space-y-3 text-xs">
      <DetailRow label="Image" value="python:3.11-slim" />
      <DetailRow label="Region" value="us-east-1 (iad)" />
      <DetailRow label="Cluster" value="boxty-prod-1" />
      <DetailRow label="Task ID" value="task-abcd1234" />
      <DetailRow label="Environment" value="main" />
      <DetailRow label="Workspace" value="john-smith" />
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#262626] py-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-mono text-gray-200">{value}</span>
    </div>
  )
}

function EventsTab() {
  return (
    <div className="space-y-3">
      {events.map((ev, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="h-2 w-2 rounded-full bg-mint mt-1" />
            {i < events.length - 1 && <div className="w-px flex-1 bg-[#262626]" />}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white">{ev.event}</span>
              <span className="text-[11px] text-gray-600 font-mono">{ev.time}</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">{ev.detail}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
