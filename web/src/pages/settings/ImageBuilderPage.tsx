import { Box } from 'lucide-react'
import EmptyState from '../../components/EmptyState'

export default function ImageBuilderPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white tracking-tight">Image Builder Version</h1>
      <p className="text-gray-400 text-xs font-medium mt-1.5">Control the image builder version for your workspace.</p>
      <div className="mt-6">
        <EmptyState
          icon={Box}
          title="Image builder version"
          subtitle="No image builder configuration to display yet."
        />
      </div>
    </div>
  )
}
