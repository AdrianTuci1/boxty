import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import type { Sandbox } from '../api/sandboxes'

export default function SandboxTable({ sandboxes }: { sandboxes: Sandbox[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border dark:border-gray-800">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          <tr>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Started</th>
            <th className="px-4 py-2">CPU</th>
            <th className="px-4 py-2">Memory</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-gray-800">
          {sandboxes.map((s) => (
            <tr key={s.id} className="bg-white dark:bg-gray-900">
              <td className="px-4 py-2 font-mono"><Link to={`/sandboxes/${s.id}`} className="text-indigo-600 hover:underline dark:text-indigo-400">{s.id.slice(0, 8)}</Link></td>
              <td className="px-4 py-2"><StatusBadge status={s.status} /></td>
              <td className="px-4 py-2">{s.started_at ? new Date(s.started_at).toLocaleString() : '-'}</td>
              <td className="px-4 py-2">{s.cpu_avg_pct ?? '-'}%</td>
              <td className="px-4 py-2">{s.memory_avg_mb ?? '-'} MB</td>
              <td className="px-4 py-2"><Link to={`/sandboxes/${s.id}`} className="text-indigo-600 hover:underline dark:text-indigo-400">View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
