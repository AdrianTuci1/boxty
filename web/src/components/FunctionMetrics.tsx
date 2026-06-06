import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'

interface MetricData {
  t: string
  value1: number
  value2: number
}

interface MetricCardProps {
  title: string
  data: MetricData[]
  line1Color: string
  line2Color: string
  line1Label: string
  line2Label: string
  yAxisFormatter?: (value: number) => string
}

function MetricCard({ title, data, line1Color, line2Color, line1Label, line2Label, yAxisFormatter }: MetricCardProps) {
  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl p-4">
      <h3 className="text-sm font-medium text-white text-center mb-3">{title}</h3>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
            <XAxis
              dataKey="t"
              stroke="#555"
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke="#555"
              tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#6b7280' }}
              tickFormatter={yAxisFormatter || ((v: number) => `${v}`)}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ background: '#1f1f1f', border: '1px solid #262626', fontSize: 11 }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Line type="monotone" dataKey="value1" stroke={line1Color} strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="value2" stroke={line2Color} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: line1Color }} />
          <span className="text-xs text-gray-400">{line1Label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: line2Color }} />
          <span className="text-xs text-gray-400">{line2Label}</span>
        </div>
      </div>
    </div>
  )
}

// Generate mock data for the last 24 hours
function generateMockData(): MetricData[] {
  const data: MetricData[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const t = new Date(now.getTime() - (11 - i) * 2 * 60 * 60 * 1000)
    const hour = t.getHours()
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    const timeStr = i % 3 === 0 ? `${displayHour} ${ampm}` : ''
    data.push({
      t: timeStr,
      value1: Math.random() * 0.5,
      value2: Math.random() * 0.3,
    })
  }
  return data
}

export default function FunctionMetrics() {
  const containerData = useMemo(() => generateMockData(), [])
  const cpuData = useMemo(() => generateMockData(), [])
  const memoryData = useMemo(() => generateMockData(), [])
  const networkData = useMemo(() => generateMockData(), [])

  return (
    <div className="mt-6 grid grid-cols-2 gap-4">
      <MetricCard
        title="Containers"
        data={containerData}
        line1Color="#fdba74"
        line2Color="#92400e"
        line1Label="Live"
        line2Label="Total"
      />
      <MetricCard
        title="CPU"
        data={cpuData}
        line1Color="#a3e635"
        line2Color="#6b7280"
        line1Label="Used"
        line2Label="Reserved"
      />
      <MetricCard
        title="Memory"
        data={memoryData}
        line1Color="#facc15"
        line2Color="#6b7280"
        line1Label="Used"
        line2Label="Reserved"
        yAxisFormatter={(v: number) => `${v}G`}
      />
      <MetricCard
        title="Network"
        data={networkData}
        line1Color="#a78bfa"
        line2Color="#60a5fa"
        line1Label="Egress"
        line2Label="Ingress"
        yAxisFormatter={(v: number) => `${v}/s`}
      />
    </div>
  )
}
