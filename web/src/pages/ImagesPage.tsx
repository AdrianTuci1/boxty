import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listImages, buildImage, deleteImage } from '../api/images'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'

export default function ImagesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['images'], queryFn: listImages })
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [base, setBase] = useState('')
  const [commands, setCommands] = useState('')
  const qc = useQueryClient()

  const handleBuild = async () => {
    await buildImage({ name, base_image: base, commands: commands.split('\n').filter(Boolean) })
    setName('')
    setBase('')
    setCommands('')
    setOpen(false)
    qc.invalidateQueries({ queryKey: ['images'] })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete image?')) return
    await deleteImage(id)
    qc.invalidateQueries({ queryKey: ['images'] })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Images</h1>
        <button onClick={() => setOpen(true)} className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">Build Image</button>
      </div>
      {isLoading && <p>Loading...</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((img) => (
          <div key={img.id} className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{img.name}</h3>
              <StatusBadge status={img.status} />
            </div>
            <p className="mt-1 text-xs text-gray-500">{img.image_url}</p>
            <p className="mt-2 text-xs text-gray-400">{new Date(img.created_at).toLocaleString()}</p>
            <button onClick={() => handleDelete(img.id)} className="mt-2 text-sm text-red-600 hover:underline dark:text-red-400">Delete</button>
          </div>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Build Image">
        <input className="mb-2 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="mb-2 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Base Image" value={base} onChange={(e) => setBase(e.target.value)} />
        <textarea className="mb-3 w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" placeholder="Commands (one per line)" rows={4} value={commands} onChange={(e) => setCommands(e.target.value)} />
        <button onClick={handleBuild} className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700">Build</button>
      </Modal>
    </div>
  )
}
