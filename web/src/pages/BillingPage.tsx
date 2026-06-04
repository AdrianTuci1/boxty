import { useQuery } from '@tanstack/react-query'
import { getBalance, listUsage, createCheckoutSession } from '../api/billing'
import MetricsCard from '../components/MetricsCard'
import ChartCard from '../components/ChartCard'
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
    window.location.href = res.url
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricsCard title="Credit Balance" value={balance ? `${balance.credits} ${balance.currency}` : '...'} />
        <MetricsCard title="Total Usage Cost" value={`$${usage?.reduce((s, u) => s + u.cost, 0) ?? 0}`} />
        <div className="flex items-center">
          <button onClick={handleBuy} className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700">Buy Credits</button>
        </div>
      </div>
      <ChartCard title="Usage History">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="cpu" fill="#6366f1" name="CPU hours" />
            <Bar dataKey="gpu" fill="#10b981" name="GPU hours" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <div className="overflow-x-auto rounded-lg border dark:border-gray-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">CPU Hours</th><th className="px-4 py-2">GPU Hours</th><th className="px-4 py-2">Storage GB</th><th className="px-4 py-2">Cost</th></tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-800">
            {usage?.map((u) => (
              <tr key={u.date} className="bg-white dark:bg-gray-900">
                <td className="px-4 py-2">{u.date}</td>
                <td className="px-4 py-2">{u.cpu_hours}</td>
                <td className="px-4 py-2">{u.gpu_hours}</td>
                <td className="px-4 py-2">{u.storage_gb}</td>
                <td className="px-4 py-2">${u.cost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
