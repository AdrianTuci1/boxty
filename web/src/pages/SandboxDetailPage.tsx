import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getSandbox, stopSandbox, execSandbox, forwardPort, snapshotSandbox, getSandboxMetrics } from '../api/sandboxes'
import StatusBadge from '../components/StatusBadge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { X } from 'lucide-react'

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
          <h1 className="text-xl font-bold text-white">Sandbox {id?.slice(0, 8)}</h1>
          <p className="text-sm text-gray-500">{data?.url || 'No URL'} · <Link to={`/apps/${data?.app_id}`} className="text-mint hover:underline">App</Link></p>
        </div>
        <StatusBadge status={data?.status || 'stopped'} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={handleStop} className="rounded-md border border-[#262626] bg-[#1f1f1f] px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors">Stop</button>
        <button onClick={() => setExecOpen(true)} className="rounded-md border border-[#262626] bg-[#1f1f1f] px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors">Exec</button>
        <button onClick={() => setForwardOpen(true)} className="rounded-md border border-[#262626] bg-[#1f1f1f] px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors">Forward Port</button>
        <button onClick={handleSnapshot} className="rounded-md border border-[#262626] bg-[#1f1f1f] px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors">Snapshot</button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded-xl border border-[#262626] bg-[#161616] p-4">
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

      <div className="rounded-xl border border-[#262626] bg-black p-4 font-mono text-[13px] text-green-400/70">
        <pre className="max-h-96 overflow-auto">{logs || '[waiting for logs...]'}</pre>
      </div>

      {/* Exec Modal */}
      {execOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setExecOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-[#262626] bg-[#161616] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Exec Command</h3>
              <button onClick={() => setExecOpen(false)} className="text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder="command" value={cmd} onChange={(e) => setCmd(e.target.value)} />
              <button onClick={handleExec} className="w-full rounded-md bg-white py-2 text-xs font-medium text-black hover:bg-gray-200 transition-colors">Run</button>
              {execResult && <pre className="mt-2 max-h-48 overflow-auto rounded-md border border-[#262626] bg-[#111111] p-3 text-xs text-gray-300">{execResult}</pre>}
            </div>
          </div>
        </div>
      )}

      {/* Forward Port Modal */}
      {forwardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setForwardOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-[#262626] bg-[#161616] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Forward Port</h3>
              <button onClick={() => setForwardOpen(false)} className="text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input type="number" className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" value={port} onChange={(e) => setPort(Number(e.target.value))} />
              <button onClick={handleForward} className="w-full rounded-md bg-white py-2 text-xs font-medium text-black hover:bg-gray-200 transition-colors">Forward</button>
              {forwardUrl && <p className="mt-2 text-xs text-gray-300">URL: <a href={forwardUrl} target="_blank" rel="noreferrer" className="text-mint hover:underline">{forwardUrl}</a></p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
