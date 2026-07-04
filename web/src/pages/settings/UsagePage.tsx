import { useState } from 'react'

const tabs = ['Overview', 'Usage', 'Credits', 'Plans'] as const

export default function UsagePage() {
  const [activeTab, setActiveTab] = useState<string>('Overview')

  return (
    <div>
      {/* Breadcrumb header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white flex items-center gap-1.5">
          john-smith <span className="text-gray-500">/</span> Usage &amp; Billing
        </h1>
        <div className="flex items-center gap-2">
          <button className="rounded-md border border-[#262626] bg-[#1f1f1f] px-3 py-1.5 text-xs text-gray-200 hover:text-white transition-colors">
            View invoices ↗
          </button>
          <button className="rounded-md border border-[#262626] bg-[#1f1f1f] px-3 py-1.5 text-xs text-gray-200 hover:text-white transition-colors">
            Manage payment details ↗
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="h-10 border-b border-[#262626] flex items-center gap-5 w-full mt-4">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`relative h-full flex items-center text-xs font-medium transition-colors ${
              t === activeTab ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t}
            {t === activeTab && (
              <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#34d399]" />
            )}
          </button>
        ))}
      </div>

      {/* Cost Summary Card */}
      <div className="bg-[#161616] border border-[#262626] rounded-xl p-5 mt-4 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Cost Summary</h3>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <button className="hover:text-gray-300 transition-colors">&lt;</button>
            Billing Cycle: Jun 1 – Jul 1, 2026
            <button className="hover:text-gray-300 transition-colors">&gt;</button>
          </div>
        </div>

        <div className="flex items-start justify-between w-full pt-2">
          {/* Left metrics */}
          <div className="space-y-3">
            <div>
              <span className="text-gray-400 text-sm">Total Spend: </span>
              <span className="font-bold text-white text-lg tracking-tight">$0.00</span>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Total Usage: </span>
              <span className="text-gray-300 text-xs">$21.96</span>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Credits Applied: </span>
              <span className="font-mono text-xs text-gray-500">$-21.96</span>
            </div>
          </div>

          {/* Right breakdown */}
          <div className="w-64">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Usage Breakdown: $21.96</span>
              <button className="text-xs text-[#34d399] hover:underline">View details ↗</button>
            </div>
            <div className="h-2 w-full rounded-full bg-[#262626] overflow-hidden">
              <div className="h-full w-full rounded-full bg-[#34d399]" />
            </div>
            <p className="text-xs text-gray-500 mt-1.5">• Deployed Apps $21.96</p>
          </div>
        </div>
      </div>

      {/* Bottom split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="rounded-xl border border-[#262626] bg-[#161616] p-5">
          <h3 className="text-sm font-semibold text-white mb-2">Current Plan</h3>
          <p className="text-xs text-gray-400 mb-4">Starter plan with $30.00 included compute credits per month.</p>
          <div className="flex gap-2">
            <button className="text-xs text-[#34d399] hover:underline">Manage plan ↗</button>
            <button className="text-xs text-[#34d399] hover:underline">View credits ↗</button>
          </div>
        </div>
        <div className="rounded-xl border border-[#262626] bg-[#161616] p-5">
          <h3 className="text-sm font-semibold text-white mb-2">Usage Limit</h3>
          <p className="text-xs text-gray-400 mb-3">This workspace can use up to $100 per billing period. Running apps will stop when usage reaches this limit.</p>
          <ul className="text-xs text-gray-500 space-y-1 mb-4">
            <li>• When usage reaches $50, you'll be charged $20</li>
          </ul>
          <button className="rounded-md border border-[#262626] bg-[#111111] px-4 py-2 text-xs text-gray-300 hover:text-white transition-colors">
            Set a budget
          </button>
        </div>
      </div>
    </div>
  )
}
