import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface DetailSectionProps {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}

function DetailSection({ title, children, action }: DetailSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-white">{title}</h3>
          {action}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
        />
      </button>
      {isExpanded && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  )
}

interface DetailFieldProps {
  label: string
  value: string
}

function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div>
      <p className="text-[11px] text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-white">{value}</p>
    </div>
  )
}

function DetailGrid({ children, columns = 3 }: { children: React.ReactNode; columns?: number }) {
  return (
    <div className={`grid grid-cols-${columns} gap-4`}>
      {children}
    </div>
  )
}

export default function FunctionDetails() {
  return (
    <div className="mt-6 space-y-3">
      {/* Autoscaling */}
      <DetailSection
        title="Autoscaling"
        action={
          <button className="text-[11px] text-gray-400 border border-[#333] px-2 py-0.5 rounded hover:text-white hover:border-[#444] transition-colors">
            Edit
          </button>
        }
      >
        <DetailGrid columns={3}>
          <DetailField label="Min containers" value="None" />
          <DetailField label="Max containers" value="None" />
          <DetailField label="Buffer containers" value="None" />
        </DetailGrid>
        <div className="mt-4">
          <DetailField label="Scaledown window" value="60 secs" />
        </div>
      </DetailSection>

      {/* Resources */}
      <DetailSection title="Resources">
        <DetailGrid columns={3}>
          <DetailField label="GPUs" value="None" />
          <DetailField label="CPU request" value="4 cores" />
          <DetailField label="Ephemeral disk" value="None" />
          <DetailField label="CPU limit" value="Default" />
          <DetailField label="Memory request" value="16384 MiB" />
          <DetailField label="Memory limit" value="None" />
        </DetailGrid>
      </DetailSection>

      {/* Scheduling */}
      <DetailSection title="Scheduling">
        <DetailGrid columns={3}>
          <DetailField label="Region" value="Default" />
          <DetailField label="Cloud" value="Default" />
          <DetailField label="Non-preemptible" value="False" />
        </DetailGrid>
      </DetailSection>

      {/* Execution */}
      <DetailSection title="Execution">
        <DetailGrid columns={3}>
          <DetailField label="Timeout" value="300 secs" />
          <DetailField label="Max retries" value="None" />
        </DetailGrid>
      </DetailSection>

      {/* Secrets */}
      <DetailSection title="Secrets">
        <div className="border border-[#262626] rounded-lg overflow-hidden">
          <div className="flex bg-[#111] text-gray-500 text-[11px] px-3 py-2 border-b border-[#262626]">
            <span className="flex-1">Name</span>
            <span className="flex-1">Keys</span>
          </div>
          <div className="flex px-3 py-3">
            <span className="flex-1 font-mono text-xs text-gray-300">sentry-r2-secrets</span>
            <div className="flex-1 space-y-0.5">
              <p className="font-mono text-xs text-gray-400">GEMINI_API_KEY</p>
              <p className="font-mono text-xs text-gray-400">R2_ACCESS_KEY_ID</p>
              <p className="font-mono text-xs text-gray-400">R2_BUCKET_DATA</p>
              <p className="font-mono text-xs text-gray-400">R2_ENDPOINT</p>
              <p className="font-mono text-xs text-gray-400">R2_SECRET_ACCESS_KEY</p>
            </div>
          </div>
        </div>
      </DetailSection>
    </div>
  )
}
