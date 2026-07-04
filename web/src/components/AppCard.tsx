import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import type { App } from '../api/apps'

export default function AppCard({ app }: { app: App }) {
  return (
    <div className="rounded-xl border border-[#262626] bg-[#161616] p-4 transition hover:bg-[#1a1a1a]">
      <div className="flex items-center justify-between">
        <Link to={`/apps/${app.id}`} className="text-sm font-semibold text-white hover:text-mint transition-colors">
          {app.name}
        </Link>
        <StatusBadge status={app.status} />
      </div>
      <p className="mt-1 text-xs text-gray-500">{app.endpoint_name || 'No URL'}</p>
      <p className="mt-2 text-[11px] text-gray-600">Updated {new Date(app.updated_at).toLocaleDateString()}</p>
    </div>
  )
}
