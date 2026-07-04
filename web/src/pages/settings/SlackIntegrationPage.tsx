import { MessageSquare } from 'lucide-react'
import EmptyState from '../../components/EmptyState'

export default function SlackIntegrationPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white tracking-tight">Slack Integration</h1>
      <p className="text-gray-400 text-xs font-medium mt-1.5">Send notifications to a Slack channel.</p>
      <div className="mt-6">
        <EmptyState
          icon={MessageSquare}
          title="Slack not connected"
          subtitle="Connect a Slack workspace to receive alerts and notifications."
        />
      </div>
    </div>
  )
}
