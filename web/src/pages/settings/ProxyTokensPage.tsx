import { KeyRound } from 'lucide-react'
import EmptyState from '../../components/EmptyState'

export default function ProxyTokensPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white tracking-tight">Proxy Auth Tokens</h1>
      <p className="text-gray-400 text-xs font-medium mt-1.5">Manage tokens used by proxy authentication.</p>
      <div className="mt-6">
        <EmptyState
          icon={KeyRound}
          title="No proxy tokens yet"
          subtitle="Proxy auth tokens will appear here once created."
        />
      </div>
    </div>
  )
}
