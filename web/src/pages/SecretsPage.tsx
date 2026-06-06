import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { listSecrets, deleteSecret } from '../api/secrets'
import { Plus } from 'lucide-react'

export default function SecretsPage() {
  const { workspace, environment } = useParams<{ workspace: string; environment: string }>()
  const { data, isLoading } = useQuery({ queryKey: ['secrets'], queryFn: listSecrets })
  const navigate = useNavigate()
  const qc = useQueryClient()

  const handleDelete = async (id: string) => {
    if (!confirm('Delete secret?')) return
    await deleteSecret(id)
    qc.invalidateQueries({ queryKey: ['secrets'] })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Secrets</h1>
        <button onClick={() => navigate(`/secrets/${workspace}/${environment}/create`)} className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-gray-200 transition-colors">
          <Plus className="h-3.5 w-3.5" />
          New Secret
        </button>
      </div>
      {isLoading && <p className="text-sm text-gray-500">Loading...</p>}
      <div className="overflow-x-auto rounded-xl border border-[#262626]">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="bg-[#111111] border-b border-[#262626]">
              <th className="px-4 py-2.5 text-gray-500 font-medium">Name</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">Created</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262626]">
            {data?.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-600 bg-[#161616]">No secrets yet.</td></tr>
            )}
            {data?.map((s) => (
              <tr key={s.id} className="bg-[#161616]">
                <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(s.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300 text-xs transition-colors">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
