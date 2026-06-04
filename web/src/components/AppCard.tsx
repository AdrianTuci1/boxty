import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import type { App } from '../api/apps'

export default function AppCard({ app }: { app: App }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <Link to={`/apps/${app.id}`} className="text-lg font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
          {app.name}
        </Link>
        <StatusBadge status={app.status} />
      </div>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{app.url || 'No URL'}</p>
      <p className="mt-2 text-xs text-gray-400">Updated {new Date(app.updated_at).toLocaleDateString()}</p>
    </div>
  )
}
