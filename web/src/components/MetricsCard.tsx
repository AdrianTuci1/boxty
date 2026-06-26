export default function MetricsCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <div className="rounded-xl border border-[#262626] bg-[#161616] p-4">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
      {subtitle && <p className="mt-1 text-[11px] text-gray-500">{subtitle}</p>}
    </div>
  )
}
