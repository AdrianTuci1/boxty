import { Link } from 'react-router-dom'
import MetricsCard from '../components/MetricsCard'
import SandboxTable from '../components/SandboxTable'
import ChartCard from '../components/ChartCard'
import { useSandboxes } from '../hooks/useSandboxes'
import { useApps } from '../hooks/useApps'
import { useWorkspaces } from '../hooks/useWorkspaces'
import { getBalance } from '../api/billing'
import { useQuery } from '@tanstack/react-query'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const { data: sandboxes, isLoading: sbLoading } = useSandboxes()
  const { data: apps, isLoading: appLoading } = useApps()
  const { data: workspaces } = useWorkspaces()
  const { data: balance } = useQuery({ queryKey: ['balance'], queryFn: getBalance })

  const activeSandboxes = sandboxes?.filter((s) => s.status === 'running').length ?? 0
  const activeApps = apps?.filter((a) => a.status === 'active').length ?? 0

  const chartData = [
    { t: '00:00', cpu: 20 },
    { t: '04:00', cpu: 35 },
    { t: '08:00', cpu: 50 },
    { t: '12:00', cpu: 45 },
    { t: '16:00', cpu: 60 },
    { t: '20:00', cpu: 30 },
    { t: '23:59', cpu: 25 },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricsCard title="Active Sandboxes" value={sbLoading ? '...' : activeSandboxes} />
        <MetricsCard title="Active Apps" value={appLoading ? '...' : activeApps} />
        <MetricsCard title="Workspaces" value={workspaces?.length ?? 0} />
        <MetricsCard title="Credit Balance" value={balance ? `${balance.credits} ${balance.currency}` : '...'} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="CPU Usage (24h)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="cpu" stroke="#6366f1" fill="url(#cpu)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Link to="/workspaces" className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">New Workspace</Link>
            <Link to="/apps" className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">New App</Link>
            <Link to="/billing" className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">Billing</Link>
          </div>
          <h3 className="text-sm font-medium">Recent Sandboxes</h3>
          {sandboxes && sandboxes.length > 0 ? (
            <SandboxTable sandboxes={sandboxes.slice(0, 5)} />
          ) : (
            <p className="text-sm text-gray-500">No sandboxes yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
