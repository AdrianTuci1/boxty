import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getApp, getAppMetrics, getAppUsage, getAppDeployments, stopApp, deployApp, deleteApp, type AppUsage } from '../api/apps'
import { listSandboxes } from '../api/sandboxes'
import StatusBadge from '../components/StatusBadge'
import SandboxTable from '../components/SandboxTable'
import ChartCard from '../components/ChartCard'
import Modal from '../components/Modal'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'

export default function AppDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const appQ = useQuery({ queryKey: ['apps', id], queryFn: () => getApp(id!), enabled: !!id })
  const metricsQ = useQuery({ queryKey: ['apps', id, 'metrics'], queryFn: () => getAppMetrics(id!), enabled: !!id })
  const usageQ = useQuery<AppUsage>({ queryKey: ['apps', id, 'usage'], queryFn: () => getAppUsage(id!, 'day'), enabled: !!id })
  const deploymentsQ = useQuery({ queryKey: ['apps', id, 'deployments'], queryFn: () => getAppDeployments(id!), enabled: !!id })
  const sandboxesQ = useQuery({ queryKey: ['sandboxes'], queryFn: listSandboxes })

  const [tab, setTab] = useState<'overview' | 'sandboxes' | 'deployments' | 'metrics' | 'usage' | 'logs'>('overview')
  const [deployOpen, setDeployOpen] = useState(false)
  const [deployForm, setDeployForm] = useState({ image: '', cpu: 1, memory: 512, gpu: 0 })

  const appSandboxes = sandboxesQ.data?.filter((s) => s.app_id === id) ?? []

  const handleStop = async () => {
    if (!id) return
    await stopApp(id)
    appQ.refetch()
  }

  const handleDeploy = async () => {
    if (!id) return
    await deployApp(id, deployForm)
    setDeployOpen(false)
    appQ.refetch()
    deploymentsQ.refetch()
  }

  const handleDelete = async () => {
    if (!id || !confirm('Delete this app?')) return
    await deleteApp(id)
    navigate('/apps')
  }

  const metrics = metricsQ.data
  const chartData = metrics
    ? metrics.timestamps.map((t, i) => ({
        t,
        cpu: metrics.cpu[i] ?? 0,
        memory: metrics.memory[i] ?? 0,
        network_rx: metrics.network_rx[i] ?? 0,
        network_tx: metrics.network_tx[i] ?? 0,
      }))
    : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{appQ.data?.name ?? 'App'}</h1>
          <p className="text-sm text-gray-500">{appQ.data?.url || 'No URL'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleStop} className="rounded bg-yellow-500 px-3 py-2 text-sm text-white hover:bg-yellow-600">Stop</button>
          <button onClick={() => setDeployOpen(true)} className="rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700">Deploy</button>
          <button onClick={handleDelete} className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700">Delete</button>
        </div>
      </div>
      <div className="flex gap-2 border-b dark:border-gray-800">
        {(['overview','sandboxes','deployments','metrics','usage','logs'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm capitalize ${tab === t ? 'border-b-2 border-indigo-600 font-medium' : 'text-gray-500'}`}>{t}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <p><strong>Status:</strong> <StatusBadge status={appQ.data?.status || 'stopped'} /></p>
            <p><strong>Image:</strong> {appQ.data?.image_url || '-'}</p>
            <p><strong>Created:</strong> {appQ.data?.created_at ? new Date(appQ.data.created_at).toLocaleString() : '-'}</p>
            <p><strong>Usage (today):</strong> CPU {usageQ.data?.cpu_hours ?? '-'}h · GPU {usageQ.data?.gpu_hours ?? '-'}h · Cost ${usageQ.data?.total_cost ?? '-'}</p>
          </div>
          <ChartCard title="CPU over time">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis dataKey="t" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="cpu" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {tab === 'sandboxes' && (
        <div>
          <h3 className="mb-2 text-lg font-semibold">Sandboxes</h3>
          <SandboxTable sandboxes={appSandboxes} />
        </div>
      )}

      {tab === 'deployments' && (
        <div className="overflow-x-auto rounded-lg border dark:border-gray-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr><th className="px-4 py-2">Version</th><th className="px-4 py-2">Image</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Time</th></tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {deploymentsQ.data?.map((d) => (
                <tr key={d.id} className="bg-white dark:bg-gray-900">
                  <td className="px-4 py-2">{d.version}</td>
                  <td className="px-4 py-2">{d.image}</td>
                  <td className="px-4 py-2"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-2">{new Date(d.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'metrics' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="CPU">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis dataKey="t" /><YAxis /><Tooltip />
                <Area type="monotone" dataKey="cpu" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Memory">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis dataKey="t" /><YAxis /><Tooltip />
                <Area type="monotone" dataKey="memory" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Network RX">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis dataKey="t" /><YAxis /><Tooltip />
                <Area type="monotone" dataKey="network_rx" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Network TX">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis dataKey="t" /><YAxis /><Tooltip />
                <Area type="monotone" dataKey="network_tx" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {tab === 'usage' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900"><p className="text-sm text-gray-500">CPU Hours</p><p className="text-2xl font-bold">{usageQ.data?.cpu_hours ?? 0}</p></div>
            <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900"><p className="text-sm text-gray-500">GPU Hours</p><p className="text-2xl font-bold">{usageQ.data?.gpu_hours ?? 0}</p></div>
            <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900"><p className="text-sm text-gray-500">Total Cost</p><p className="text-2xl font-bold">${usageQ.data?.total_cost ?? 0}</p></div>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className="rounded-lg border bg-black p-4 font-mono text-sm text-green-400 dark:border-gray-800">
          <p>[logs] Aggregated logs will appear here via WebSocket.</p>
        </div>
      )}

      <Modal open={deployOpen} onClose={() => setDeployOpen(false)} title="Deploy App">
        <label className="block text-sm">Image</label>
        <input className="mb-2 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={deployForm.image} onChange={(e) => setDeployForm({ ...deployForm, image: e.target.value })} />
        <label className="block text-sm">CPU</label>
        <input type="number" className="mb-2 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={deployForm.cpu} onChange={(e) => setDeployForm({ ...deployForm, cpu: Number(e.target.value) })} />
        <label className="block text-sm">Memory (MB)</label>
        <input type="number" className="mb-2 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={deployForm.memory} onChange={(e) => setDeployForm({ ...deployForm, memory: Number(e.target.value) })} />
        <label className="block text-sm">GPU</label>
        <input type="number" className="mb-3 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={deployForm.gpu} onChange={(e) => setDeployForm({ ...deployForm, gpu: Number(e.target.value) })} />
        <button onClick={handleDeploy} className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700">Deploy</button>
      </Modal>
    </div>
  )
}
