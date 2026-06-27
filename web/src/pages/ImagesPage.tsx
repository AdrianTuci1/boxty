import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listImages, buildImage, deleteImage } from '../api/images'
import StatusBadge from '../components/StatusBadge'
import { X, Plus } from 'lucide-react'

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
    <div className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Images</h1>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-200 transition-colors">
          <Plus className="h-3.5 w-3.5" />
          Build Image
        </button>
      </div>
      {isLoading && <p className="text-sm text-gray-500">Loading...</p>}
      {(!data || data.length === 0) && !isLoading && (
        <p className="text-sm text-gray-600 py-8 text-center">No images yet.</p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((img) => (
          <div key={img.image_id} className="rounded-xl border border-[#262626] bg-[#161616] p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">{img.name}</h3>
              <StatusBadge status={img.status} />
            </div>
            <p className="text-xs text-gray-500 font-mono">{img.base_image}</p>
            <p className="mt-2 text-[11px] text-gray-600">{new Date(img.created_at).toLocaleString()}</p>
            <button onClick={() => handleDelete(img.image_id)} className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors">Delete</button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-[#262626] bg-[#161616] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Build Image</h3>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <input className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder="Base Image" value={base} onChange={(e) => setBase(e.target.value)} />
              <textarea className="w-full rounded-md border border-[#262626] bg-[#111111] px-3 py-2 text-xs text-white outline-none" placeholder="Commands (one per line)" rows={4} value={commands} onChange={(e) => setCommands(e.target.value)} />
              <button onClick={handleBuild} className="w-full rounded-md bg-white py-2 text-xs font-medium text-black hover:bg-gray-200 transition-colors">Build</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
