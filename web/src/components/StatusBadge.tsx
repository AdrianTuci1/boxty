import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export default function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    running: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    stopped: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    snapshotted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    deploying: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    ready: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    building: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    attached: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    paused: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', map[status] || map.stopped)}>
      {status}
    </span>
  )
}
