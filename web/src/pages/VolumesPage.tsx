import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listVolumes, createVolume, deleteVolume, mountVolume, unmountVolume } from '../api/volumes'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'

export default function VolumesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['volumes'], queryFn: listVolumes })
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [size, setSize] = useState(10)
  const [mountOpen, setMountOpen] = useState(false)
  const [mountForm, setMountForm] = useState({ volumeId: '', sandboxId: '', mountPath: '/data' })
  const qc = useQueryClient()

  const handleCreate = async () => {
    await createVolume({ name, size_gb: size })
    setName('')
    setSize(10)
    setOpen(false)
    qc.invalidateQueries({ queryKey: ['volumes'] })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete volume?')) return
    await deleteVolume(id)
    qc.invalidateQueries({ queryKey: ['volumes'] })
  }

  const handleMount = async () => {
    await mountVolume(mountForm.volumeId, mountForm.sandboxId, mountForm.mountPath)
    setMountOpen(false)
    qc.invalidateQueries({ queryKey: ['volumes'] })
  }

  const handleUnmount = async (id: string) => {
    await unmountVolume(id)
    qc.invalidateQueries({ queryKey: ['volumes'] })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Volumes</h1>
        <button onClick={() => setOpen(true)} className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">Create Volume</button>
      </div>
      {isLoading && <p>Loading...</p>}
      <div className="overflow-x-auto rounded-lg border dark:border-gray-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800"><tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Size</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Created</th><th className="px-4 py-2">Actions</th></tr></thead>
          <tbody className="divide-y dark:divide-gray-800">
            {data?.map((v) => (
              <tr key={v.id} className="bg-white dark:bg-gray-900">
                <td className="px-4 py-2">{v.name}</td>
                <td className="px-4 py-2">{v.size_gb} GB</td>
                <td className="px-4 py-2"><StatusBadge status={v.status} /></td>
                <td className="px-4 py-2">{new Date(v.created_at).toLocaleString()}</td>
                <td className="px-4 py-2">
                  <button onClick={() => { setMountForm({ ...mountForm, volumeId: v.id }); setMountOpen(true); }} className="mr-2 text-indigo-600 hover:underline dark:text-indigo-400">Mount</button>
                  <button onClick={() => handleUnmount(v.id)} className="mr-2 text-indigo-600 hover:underline dark:text-indigo-400">Unmount</button>
                  <button onClick={() => handleDelete(v.id)} className="text-red-600 hover:underline dark:text-red-400">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Create Volume">
        <input className="mb-2 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="number" className="mb-3 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Size GB" value={size} onChange={(e) => setSize(Number(e.target.value))} />
        <button onClick={handleCreate} className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700">Create</button>
      </Modal>
      <Modal open={mountOpen} onClose={() => setMountOpen(false)} title="Mount Volume">
        <input className="mb-2 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Sandbox ID" value={mountForm.sandboxId} onChange={(e) => setMountForm({ ...mountForm, sandboxId: e.target.value })} />
        <input className="mb-3 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Mount Path" value={mountForm.mountPath} onChange={(e) => setMountForm({ ...mountForm, mountPath: e.target.value })} />
        <button onClick={handleMount} className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700">Mount</button>
      </Modal>
    </div>
  )
}
