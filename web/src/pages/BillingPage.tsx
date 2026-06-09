import { useQuery } from '@tanstack/react-query'
import { getBalance, listUsage, createCheckoutSession } from '../api/billing'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function BillingPage() {
  const { data: balance } = useQuery({ queryKey: ['balance'], queryFn: getBalance })
  const { data: usage } = useQuery({ queryKey: ['usage'], queryFn: listUsage })

  const chartData = usage?.map((u) => ({
    date: u.date,
    cost: u.cost,
    cpu: u.cpu_hours,
    gpu: u.gpu_hours,
  })) ?? []

  const handleBuy = async () => {
    const res = await createCheckoutSession()
    if (res.checkout_url) {
      window.location.href = res.checkout_url
    } else if (res.dev_mode) {
      alert(`Dev mode: ${res.credits_added} credits added`)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-6 space-y-6">
      <h1 className="text-xl font-bold text-white">Billing</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricBlock title="Credit Balance" value={balance ? `${balance.credits} ${balance.currency}` : '...'} />
        <MetricBlock title="Total Usage Cost" value={`$${usage?.reduce((s, u) => s + u.cost, 0) ?? 0}`} />
        <button onClick={handleBuy} className="rounded-md bg-white py-2.5 text-xs font-medium text-black hover:bg-gray-200 transition-colors self-end">Buy Credits</button>
      </div>
      <div className="rounded-xl border border-[#262626] bg-[#161616] p-4">
        <h4 className="text-xs text-gray-400 mb-3">Usage History</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 10 }} />
              <YAxis stroke="#555" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #262626', fontSize: 11 }} />
              <Bar dataKey="cpu" fill="#34d399" name="CPU hours" radius={[3,3,0,0]} />
              <Bar dataKey="gpu" fill="#e879f9" name="GPU hours" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#262626]">
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr className="bg-[#111111] border-b border-[#262626]">
              <th className="px-4 py-2.5 text-gray-500 font-medium">Date</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">CPU Hours</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">GPU Hours</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">Storage GB</th>
              <th className="px-4 py-2.5 text-gray-500 font-medium">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262626]">
            {usage?.map((u) => (
              <tr key={u.date} className="bg-[#161616]">
                <td className="px-4 py-3 text-gray-300">{u.date}</td>
                <td className="px-4 py-3 text-gray-300">{u.cpu_hours}</td>
                <td className="px-4 py-3 text-gray-300">{u.gpu_hours}</td>
                <td className="px-4 py-3 text-gray-300">{u.storage_gb}</td>
                <td className="px-4 py-3 text-white font-medium">${u.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  )
}

function MetricBlock({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[#262626] bg-[#161616] p-4">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}
