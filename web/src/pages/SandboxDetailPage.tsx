import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getSandbox, stopSandbox, execSandbox, forwardPort, snapshotSandbox, getSandboxMetrics } from '../api/sandboxes'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function SandboxDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, refetch } = useQuery({ queryKey: ['sandboxes', id], queryFn: () => getSandbox(id!), enabled: !!id })
  useQuery({ queryKey: ['sandboxes', id, 'metrics'], queryFn: () => getSandboxMetrics(id!), enabled: !!id })

  const [execOpen, setExecOpen] = useState(false)
  const [cmd, setCmd] = useState('')
  const [execResult, setExecResult] = useState('')
  const [forwardOpen, setForwardOpen] = useState(false)
  const [port, setPort] = useState(8080)
  const [forwardUrl, setForwardUrl] = useState('')
  const [logs, setLogs] = useState('')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!id) return
    const ws = new WebSocket(`wss://api.boxty.dev/ws/${id}`)
    wsRef.current = ws
    ws.onmessage = (ev) => setLogs((prev) => prev + ev.data + '\n')
    return () => ws.close()
  }, [id])

  const handleStop = async () => {
    if (!id) return
    await stopSandbox(id)
    refetch()
  }

  const handleExec = async () => {
    if (!id || !cmd) return
    const res = await execSandbox(id, cmd)
    setExecResult(`${res.stdout}\n${res.stderr}`)
  }

  const handleForward = async () => {
    if (!id) return
    const res = await forwardPort(id, port)
    setForwardUrl(res.url)
  }

  const handleSnapshot = async () => {
    if (!id) return
    await snapshotSandbox(id)
    refetch()
  }

  const cpuData = data ? [{ name: 'CPU', max: data.cpu_max_pct ?? 0, avg: data.cpu_avg_pct ?? 0 }] : []
  const memData = data ? [{ name: 'Memory', max: data.memory_max_mb ?? 0, avg: data.memory_avg_mb ?? 0 }] : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sandbox {id?.slice(0, 8)}</h1>
          <p className="text-sm text-gray-500">{data?.url || 'No URL'} · <Link to={`/apps/${data?.app_id}`} className="text-indigo-600 hover:underline dark:text-indigo-400">App</Link></p>
        </div>
        <StatusBadge status={data?.status || 'stopped'} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={handleStop} className="rounded bg-yellow-500 px-3 py-2 text-sm text-white hover:bg-yellow-600">Stop</button>
        <button onClick={() => setExecOpen(true)} className="rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700">Exec</button>
        <button onClick={() => setForwardOpen(true)} className="rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700">Forward Port</button>
        <button onClick={handleSnapshot} className="rounded bg-gray-200 px-3 py-2 text-sm text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200">Snapshot</button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p><strong>Started:</strong> {data?.started_at ? new Date(data.started_at).toLocaleString() : '-'}</p>
          <p><strong>Finished:</strong> {data?.finished_at ? new Date(data.finished_at).toLocaleString() : '-'}</p>
          <p><strong>Boot:</strong> {data?.boot_duration_ms ? `${data.boot_duration_ms}ms` : '-'}</p>
          <p><strong>Network RX:</strong> {data?.network_rx_bytes ?? 0} bytes</p>
          <p><strong>Network TX:</strong> {data?.network_tx_bytes ?? 0} bytes</p>
          {data?.gpu_util_pct !== undefined && <p><strong>GPU:</strong> {data.gpu_util_pct}% · {data.gpu_memory_mb} MB</p>}
        </div>
        <div className="space-y-4">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cpuData}>
                <XAxis dataKey="name" /><YAxis /><Tooltip />
                <Bar dataKey="max" fill="#6366f1" name="Max" />
                <Bar dataKey="avg" fill="#a5b4fc" name="Avg" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memData}>
                <XAxis dataKey="name" /><YAxis /><Tooltip />
                <Bar dataKey="max" fill="#10b981" name="Max" />
                <Bar dataKey="avg" fill="#6ee7b7" name="Avg" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-black p-4 font-mono text-sm text-green-400 dark:border-gray-800">
        <pre className="max-h-96 overflow-auto">{logs || '[waiting for logs...]'}</pre>
      </div>

      <Modal open={execOpen} onClose={() => setExecOpen(false)} title="Exec Command">
        <input className="mb-2 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" placeholder="command" value={cmd} onChange={(e) => setCmd(e.target.value)} />
        <button onClick={handleExec} className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700">Run</button>
        {execResult && <pre className="mt-2 max-h-48 overflow-auto rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">{execResult}</pre>}
      </Modal>

      <Modal open={forwardOpen} onClose={() => setForwardOpen(false)} title="Forward Port">
        <input type="number" className="mb-2 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" value={port} onChange={(e) => setPort(Number(e.target.value))} />
        <button onClick={handleForward} className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700">Forward</button>
        {forwardUrl && <p className="mt-2 text-sm">URL: <a href={forwardUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline dark:text-indigo-400">{forwardUrl}</a></p>}
      </Modal>
    </div>
  )
}
