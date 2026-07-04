import { Info } from 'lucide-react'
import EmptyState from './EmptyState'
export default function FunctionDetails() {
  return (
    <EmptyState
      icon={Info}
      title="No details yet"
      subtitle="Function details will appear here once the function is configured."
    />
  )
}
