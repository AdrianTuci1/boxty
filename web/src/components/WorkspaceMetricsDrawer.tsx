import Drawer, { useDrawerParam } from './Drawer'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const chartData = [
  { time: '00:00', containers: 0, gpu: 0 },
  { time: '06:00', containers: 1, gpu: 0 },
  { time: '12:00', containers: 2, gpu: 1 },
  { time: '18:00', containers: 1, gpu: 0 },
  { time: '23:59', containers: 0, gpu: 0 },
]

export function WorkspaceMetricsDrawer() {
  const [drawer, close] = useDrawerParam('drawer')
  const isOpen = drawer === 'workspace-metrics'

  return (
    <Drawer open={isOpen} onClose={close} width="w-[500px]">
      <div className="p-5 space-y-6">
        <h2 className="text-base font-semibold text-white">Workspace Metrics</h2>

        {/* Matrix cards */}
        <div className="grid grid-cols-2 gap-3">
          <MetricBlock label="Total containers" value="0" limit="Limit: 100" />
          <MetricBlock label="Total GPUs" value="0" limit="Limit: 10" />
          <MetricBlock label="Live sandboxes" value="0" limit="" />
          <MetricBlock label="Pending sandboxes" value="0" limit="" />
        </div>

        {/* Area chart */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">Resource Utilization</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="containers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#555" tick={{ fontSize: 11 }} />
                <YAxis stroke="#555" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1f1f1f', border: '1px solid #262626', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#ccc' }}
                />
                <Area type="monotone" dataKey="containers" stroke="#34d399" fill="url(#containers)" strokeWidth={2} />
                <Area type="monotone" dataKey="gpu" stroke="#fbbf24" fill="url(#gpu)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#34d399]" />Containers</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#fbbf24]" />GPU</span>
          </div>
        </div>
      </div>
    </Drawer>
  )
}

function MetricBlock({ label, value, limit }: { label: string; value: string; limit: string }) {
  return (
    <div className="rounded-lg bg-[#111111] p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {limit && <p className="text-[11px] text-gray-500 mt-1">{limit}</p>}
    </div>
  )
}
