import { type ReactNode } from 'react'

export default function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h4>
      <div className="h-64">{children}</div>
    </div>
  )
}
