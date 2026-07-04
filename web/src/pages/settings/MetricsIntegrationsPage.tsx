import { BarChart3 } from 'lucide-react'
import EmptyState from '../../components/EmptyState'

export default function MetricsIntegrationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white tracking-tight">Metrics Integrations</h1>
      <p className="text-gray-400 text-xs font-medium mt-1.5">Connect metrics providers to your workspace.</p>
      <div className="mt-6">
        <EmptyState
          icon={BarChart3}
          title="No metrics integrations yet"
          subtitle="Connect Datadog, Prometheus, or other providers to see metrics here."
        />
      </div>
    </div>
  )
}
