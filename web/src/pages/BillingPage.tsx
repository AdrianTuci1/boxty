import { useQuery } from '@tanstack/react-query'
import { getBalance, listUsage, addCredits } from '../api/billing'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function BillingPage() {
  const userId = 'demo-user'

  const { data: balance } = useQuery({
    queryKey: ['balance', userId],
    queryFn: () => getBalance(userId),
  })
  const { data: usage } = useQuery({
    queryKey: ['usage', userId],
    queryFn: () => listUsage(undefined, userId),
  })

  const chartData = usage?.map((u) => ({
    date: u.created_at.slice(0, 10),
    cost: u.incremental_cost_usd,
    cpu: u.cpu_seconds / 3600,
    gpu: u.gpu_seconds / 3600,
  })) ?? []

  const handleBuy = async () => {
    const res = await addCredits(userId, 10)
    alert(`Added $${res.amount_usd}. New balance: $${res.new_balance_usd}`)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full p-6 space-y-6">
        <h1 className="text-xl font-bold text-white">Billing</h1>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricBlock title="Credit Balance" value={balance ? `$${balance.balance_usd.toFixed(2)}` : '...'} />
          <MetricBlock title="Total Spend" value={`$${balance?.total_spend_usd?.toFixed(2) ?? '0.00'}`} />
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
                <th className="px-4 py-2.5 text-gray-500 font-medium">CPU Seconds</th>
                <th className="px-4 py-2.5 text-gray-500 font-medium">RAM GB-sec</th>
                <th className="px-4 py-2.5 text-gray-500 font-medium">GPU Seconds</th>
                <th className="px-4 py-2.5 text-gray-500 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {usage?.map((u) => (
                <tr key={u.usage_id} className="bg-[#161616]">
                  <td className="px-4 py-3 text-gray-300">{u.created_at.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-gray-300">{u.cpu_seconds}</td>
                  <td className="px-4 py-3 text-gray-300">{u.ram_gb_seconds}</td>
                  <td className="px-4 py-3 text-gray-300">{u.gpu_seconds}</td>
                  <td className="px-4 py-3 text-white font-medium">${u.incremental_cost_usd.toFixed(4)}</td>
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
      <p className="text-lg font-semibold text-white mt-1">{value}</p>
    </div>
  )
}
