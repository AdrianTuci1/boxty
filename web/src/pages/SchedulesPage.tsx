import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listSchedules, createSchedule, updateSchedule, deleteSchedule, triggerSchedule, type Schedule } from '../api/schedules'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'

export default function SchedulesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['schedules'], queryFn: listSchedules })
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', cron: '', period_seconds: '' })
  const qc = useQueryClient()

  const reset = () => {
    setForm({ name: '', cron: '', period_seconds: '' })
    setEditId(null)
    setOpen(false)
  }

  const handleSave = async () => {
    const payload = {
      name: form.name,
      cron: form.cron || undefined,
      period_seconds: form.period_seconds ? Number(form.period_seconds) : undefined,
    }
    if (editId) {
      await updateSchedule(editId, payload)
    } else {
      await createSchedule(payload)
    }
    reset()
    qc.invalidateQueries({ queryKey: ['schedules'] })
  }

  const handleEdit = (s: Schedule) => {
    setEditId(s.id)
    setForm({ name: s.name, cron: s.cron || '', period_seconds: s.period_seconds ? String(s.period_seconds) : '' })
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Schedules</h1>
        <button onClick={() => { reset(); setOpen(true); }} className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">New Schedule</button>
      </div>
      {isLoading && <p>Loading...</p>}
      <div className="overflow-x-auto rounded-lg border dark:border-gray-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800"><tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Schedule</th><th className="px-4 py-2">Next Run</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Actions</th></tr></thead>
          <tbody className="divide-y dark:divide-gray-800">
            {data?.map((s) => (
              <tr key={s.id} className="bg-white dark:bg-gray-900">
                <td className="px-4 py-2">{s.name}</td>
                <td className="px-4 py-2">{s.cron || `${s.period_seconds}s`}</td>
                <td className="px-4 py-2">{new Date(s.next_run).toLocaleString()}</td>
                <td className="px-4 py-2"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-2">
                  <button onClick={() => handleEdit(s)} className="mr-2 text-indigo-600 hover:underline dark:text-indigo-400">Edit</button>
                  <button onClick={() => handleTrigger(s.id)} className="mr-2 text-indigo-600 hover:underline dark:text-indigo-400">Trigger</button>
                  <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline dark:text-red-400">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={reset} title={editId ? 'Edit Schedule' : 'New Schedule'}>
        <input className="mb-2 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="mb-2 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Cron (optional)" value={form.cron} onChange={(e) => setForm({ ...form, cron: e.target.value })} />
        <input type="number" className="mb-3 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Period seconds (optional)" value={form.period_seconds} onChange={(e) => setForm({ ...form, period_seconds: e.target.value })} />
        <button onClick={handleSave} className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700">Save</button>
      </Modal>
    </div>
  )
}
