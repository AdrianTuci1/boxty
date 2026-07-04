import { Globe } from 'lucide-react'
import EmptyState from '../../components/EmptyState'

export default function DomainsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white tracking-tight">Domains</h1>
      <p className="text-gray-400 text-xs font-medium mt-1.5">Manage custom domains for your workspace.</p>
      <div className="mt-6">
        <EmptyState
          icon={Globe}
          title="No custom domains yet"
          subtitle="Add custom domains to expose functions on your own URLs."
        />
      </div>
    </div>
  )
}
