import { type ReactNode } from 'react'

export default function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#262626] bg-[#161616] p-4">
      <h4 className="mb-3 text-xs font-medium text-gray-400">{title}</h4>
      <div className="h-64">{children}</div>
    </div>
  )
}
