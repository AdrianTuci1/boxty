import { FileCog } from 'lucide-react'
import EmptyState from '../../components/EmptyState'

export default function ProxiesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white tracking-tight">Proxies</h1>
      <p className="text-gray-400 text-xs font-medium mt-1.5">Manage egress proxies for your workspace.</p>
      <div className="mt-6">
        <EmptyState
          icon={FileCog}
          title="No proxies configured"
          subtitle="Proxies will appear here once added to the workspace."
        />
      </div>
    </div>
  )
}
