import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import type { Sandbox } from '../api/sandboxes'

export default function SandboxTable({ sandboxes }: { sandboxes: Sandbox[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#262626]">
      <table className="min-w-full text-left text-xs">
        <thead>
          <tr className="bg-[#111111] border-b border-[#262626]">
            <th className="px-4 py-2.5 text-gray-500 font-medium">ID</th>
            <th className="px-4 py-2.5 text-gray-500 font-medium">Status</th>
            <th className="px-4 py-2.5 text-gray-500 font-medium">Image</th>
            <th className="px-4 py-2.5 text-gray-500 font-medium">CPU Cores</th>
            <th className="px-4 py-2.5 text-gray-500 font-medium">Memory</th>
            <th className="px-4 py-2.5 text-gray-500 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#262626]">
          {sandboxes.map((s) => (
            <tr key={s.id} className="bg-[#161616] hover:bg-[#1e1e1e] transition-colors cursor-default">
              <td className="px-4 py-3 font-mono"><Link to={`/sandboxes/${s.id}`} className="text-mint hover:underline">{s.id.slice(0, 8)}</Link></td>
              <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
              <td className="px-4 py-3 text-gray-500">{s.image}</td>
              <td className="px-4 py-3 text-gray-300">{s.resources?.cpu_cores ?? '-'}</td>
              <td className="px-4 py-3 text-gray-300">{s.resources?.memory_mb ?? '-'} MB</td>
              <td className="px-4 py-3"><Link to={`/sandboxes/${s.id}`} className="text-mint hover:underline">View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
