import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  subtitle?: string
}

export default function EmptyState({ icon: Icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl p-8 flex flex-col items-center justify-center text-center">
      <div className="h-10 w-10 rounded-full bg-[#1f1f1f] flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-gray-500" />
      </div>
      <p className="text-sm font-medium text-white">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1 max-w-sm">{subtitle}</p>}
    </div>
  )
}
