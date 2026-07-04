import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listSchedules, createSchedule, updateSchedule, deleteSchedule, triggerSchedule, type Schedule } from '../api/schedules'
import { listApps } from '../api/apps'
import { useAuth } from '../hooks/useAuth'
import StatusBadge from '../components/StatusBadge'
import { X, Plus } from 'lucide-react'

export default function SchedulesPage() {
  const { devMode } = useAuth()
  const [workspaceId] = useState('ws-1')
  const [environmentId] = useState('env-1')
  const { data: schedules, isLoading } = useQuery({ 
    queryKey: ['schedules', workspaceId, environmentId], 
    queryFn: () => listSchedules(workspaceId, environmentId),
    enabled: !!workspaceId && !!environmentId,
  })
  const { data: apps } = useQuery({
    queryKey: ['apps', workspaceId, environmentId],
    queryFn: () => listApps(workspaceId, environmentId),
    enabled: devMode,
  })
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    workload_id: '',
    cron_expression: '',
    interval_seconds: '',
  })
  const qc = useQueryClient()

  const reset = () => {
    setForm({
      name: '',
      workload_id: '',
      cron_expression: '',
      interval_seconds: '',
    })
    setEditId(null)
    setOpen(false)
  }

  const handleSave = async () => {
    const payload: any = {
      name: form.name,
      workspace_id: workspaceId,
      environment_id: environmentId,
      owner_id: 'user-1', // TODO: get from auth context
      workload_id: form.workload_id,
    }
    if (form.cron_expression) payload.cron_expression = form.cron_expression
    if (form.interval_seconds) payload.interval_seconds = Number(form.interval_seconds)

    if (editId) {
      await updateSchedule(editId, payload)
    } else {
      await createSchedule(payload)
    }
    reset()
    qc.invalidateQueries({ queryKey: ['schedules'] })
  }

  const handleEdit = (s: Schedule) => {
    setEditId(s.schedule_id)
    setForm({
      name: s.name,
      workload_id: s.workload_id,
      cron_expression: s.cron_expression || '',
      interval_seconds: s.interval_seconds ? String(s.interval_seconds) : '',
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete schedule?')) return
    await deleteSchedule(id)
    qc.invalidateQueries({ queryKey: ['schedules'] })
  }

  const handleTrigger = async (id: string) => {
    await triggerSchedule(id)
  }

  return (
    <div className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Schedules</h1>
        <button onClick={() => { reset(); setOpen(true); }} className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-200 transition-colors">
          <Plus className="h-3.5 w-3.5" />
          New Schedule
        </button>
      </div>
      {isLoading && <p className="text-sm text-gray-500">Loading...</p>}
      <div className="overflow-x-auto rounded-xl border border-[#262626]">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="bg-[#111111] border-b border-[#262626]">
              <th className="px-4 py-2.5 text-gray-500 font-medium">Name</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">Workload</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">Cron</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">Interval</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">Next Run</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">Status</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262626]">
            {schedules?.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-600 bg-[#161616]">No schedules yet.</td></tr>
            )}
            {schedules?.map((s) => (
              <tr key={s.schedule_id} className="bg-[#161616]">
                <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                <td className="px-4 py-3 font-mono text-gray-300">{s.workload_id}</td>
                <td className="px-4 py-3 font-mono text-gray-300">{s.cron_expression || '-'}</td>
                <td className="px-4 py-3 text-gray-300">{s.interval_seconds ? `${s.interval_seconds}s` : '-'}</td>
                <td className="px-4 py-3 text-gray-500">{s.next_run_at ? new Date(s.next_run_at).toLocaleString() : '-'}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => handleEdit(s)} className="text-xs text-mint hover:underline">Edit</button>
                  <button onClick={() => handleTrigger(s.schedule_id)} className="text-xs text-mint hover:underline">Trigger</button>
                  <button onClick={() => handleDelete(s.schedule_id)} className="text-xs text-red-400 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={reset}>
          <div className="w-full max-w-lg rounded-xl border border-[#262626] bg-[#161616] p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">{editId ? 'Edit Schedule' : 'New Schedule'}</h3>
              <button onClick={reset} className="text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <select className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" value={form.workload_id} onChange={(e) => setForm({ ...form, workload_id: e.target.value })}>
                <option value="">Select workload</option>
                {apps?.map((app) => (
                  <option key={app.id} value={app.id}>{app.name}</option>
                ))}
              </select>
              <input className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder="Cron expression (e.g. 0 * * * *)" value={form.cron_expression} onChange={(e) => setForm({ ...form, cron_expression: e.target.value })} />
              <input type="number" className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder="Interval in seconds (alternative to cron)" value={form.interval_seconds} onChange={(e) => setForm({ ...form, interval_seconds: e.target.value })} />
              <button onClick={handleSave} className="w-full rounded-md bg-white py-2 text-xs font-medium text-black hover:bg-gray-200 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}