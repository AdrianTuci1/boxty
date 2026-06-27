import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listSchedules, createSchedule, updateSchedule, deleteSchedule, triggerSchedule, type Schedule } from '../api/schedules'
import StatusBadge from '../components/StatusBadge'
import { X, Plus } from 'lucide-react'

export default function SchedulesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['schedules'], queryFn: listSchedules })
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    schedule_type: 'cron' as 'cron' | 'period',
    schedule_value: '',
    function_name: '',
    image: '',
    cpu: '',
    memory: '',
    gpu: '',
    timeout: '',
    secrets: '',
  })
  const qc = useQueryClient()

  const reset = () => {
    setForm({
      name: '',
      schedule_type: 'cron',
      schedule_value: '',
      function_name: '',
      image: '',
      cpu: '',
      memory: '',
      gpu: '',
      timeout: '',
      secrets: '',
    })
    setEditId(null)
    setOpen(false)
  }

  const handleSave = async () => {
    const payload: any = {
      name: form.name,
      schedule_type: form.schedule_type,
      schedule_value: form.schedule_value,
      function_name: form.function_name,
    }
    if (form.image) payload.image = form.image
    if (form.cpu) payload.cpu = Number(form.cpu)
    if (form.memory) payload.memory = Number(form.memory)
    if (form.gpu) payload.gpu = form.gpu
    if (form.timeout) payload.timeout = Number(form.timeout)
    if (form.secrets) payload.secrets = form.secrets.split(',').map((s) => s.trim())

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
      schedule_type: s.schedule_type,
      schedule_value: s.schedule_value,
      function_name: s.function_name,
      image: s.image || '',
      cpu: s.cpu ? String(s.cpu) : '',
      memory: s.memory ? String(s.memory) : '',
      gpu: s.gpu || '',
      timeout: s.timeout ? String(s.timeout) : '',
      secrets: s.secrets ? s.secrets.join(', ') : '',
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
              <th className="px-4 py-2.5 text-gray-500 font-medium">Type</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">Value</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">Function</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">Next Run</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">Status</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262626]">
            {data?.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-600 bg-[#161616]">No schedules yet.</td></tr>
            )}
            {data?.map((s) => (
              <tr key={s.schedule_id} className="bg-[#161616]">
                <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                <td className="px-4 py-3 text-gray-300">{s.schedule_type}</td>
                <td className="px-4 py-3 font-mono text-gray-300">{s.schedule_value}</td>
                <td className="px-4 py-3 font-mono text-gray-300">{s.function_name}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(s.next_run).toLocaleString()}</td>
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
              <select className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" value={form.schedule_type} onChange={(e) => setForm({ ...form, schedule_type: e.target.value as 'cron' | 'period' })}>
                <option value="cron">Cron</option>
                <option value="period">Period (seconds)</option>
              </select>
              <input className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder={form.schedule_type === 'cron' ? 'Cron expression (e.g. 0 * * * *)' : 'Period in seconds'} value={form.schedule_value} onChange={(e) => setForm({ ...form, schedule_value: e.target.value })} />
              <input className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder="Function name to run" value={form.function_name} onChange={(e) => setForm({ ...form, function_name: e.target.value })} />
              <input className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder="Image (optional)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
              <div className="flex gap-2">
                <input type="number" className="flex-1 rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder="CPU (optional)" value={form.cpu} onChange={(e) => setForm({ ...form, cpu: e.target.value })} />
                <input type="number" className="flex-1 rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder="Memory MB (optional)" value={form.memory} onChange={(e) => setForm({ ...form, memory: e.target.value })} />
              </div>
              <input className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder="GPU (optional)" value={form.gpu} onChange={(e) => setForm({ ...form, gpu: e.target.value })} />
              <input type="number" className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder="Timeout seconds (optional)" value={form.timeout} onChange={(e) => setForm({ ...form, timeout: e.target.value })} />
              <input className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder="Secrets (comma-separated, optional)" value={form.secrets} onChange={(e) => setForm({ ...form, secrets: e.target.value })} />
              <button onClick={handleSave} className="w-full rounded-md bg-white py-2 text-xs font-medium text-black hover:bg-gray-200 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
