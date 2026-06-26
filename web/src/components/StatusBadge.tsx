export default function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    running: 'bg-[#142920] text-[#34d399] border border-[#1e3f31]',
    stopped: 'bg-[#1f1f1f] text-gray-400 border border-[#333]',
    snapshotted: 'bg-blue-950/30 text-blue-400 border border-blue-900/50',
    active: 'bg-[#142920] text-[#34d399] border border-[#1e3f31]',
    deploying: 'bg-yellow-950/30 text-yellow-400 border border-yellow-900/50',
    ready: 'bg-[#142920] text-[#34d399] border border-[#1e3f31]',
    building: 'bg-yellow-950/30 text-yellow-400 border border-yellow-900/50',
    failed: 'bg-red-950/30 text-red-400 border border-red-900/50',
    available: 'bg-[#142920] text-[#34d399] border border-[#1e3f31]',
    attached: 'bg-blue-950/30 text-blue-400 border border-blue-900/50',
    paused: 'bg-[#1f1f1f] text-gray-400 border border-[#333]',
  }
  const cls = map[status] || map.stopped
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {status}
    </span>
  )
}
