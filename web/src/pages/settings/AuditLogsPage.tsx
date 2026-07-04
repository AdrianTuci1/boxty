import { ClipboardList } from 'lucide-react'
import EmptyState from '../../components/EmptyState'

export default function AuditLogsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white tracking-tight">Audit Logs</h1>
      <p className="text-gray-400 text-xs font-medium mt-1.5">Review activity across your workspace.</p>
      <div className="mt-6">
        <EmptyState
          icon={ClipboardList}
          title="No audit logs yet"
          subtitle="Workspace activity will be recorded here."
        />
      </div>
    </div>
  )
}
