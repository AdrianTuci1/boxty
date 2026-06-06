import { useState } from 'react'
import { Cloud, XCircle, Box, Search, ChevronDown } from 'lucide-react'

interface StoppedApp {
  id: string
  name: string
  user: {
    name: string
    initials: string
    gradient: string
  }
  stoppedAt: string
  category: string
  hasSparkline: boolean
}

const mockStoppedApps: StoppedApp[] = [
  {
    id: '1',
    name: 'hermes-agent',
    user: {
      name: 'adrian-tucicovenco',
      initials: 'A',
      gradient: 'from-pink-400 to-purple-500',
    },
    stoppedAt: 'about 19 hours ago',
    category: 'Sandboxes',
    hasSparkline: true,
  },
  {
    id: '2',
    name: 'hermes-agent',
    user: {
      name: 'adrian-tucicovenco',
      initials: 'A',
      gradient: 'from-pink-400 to-purple-500',
    },
    stoppedAt: 'about 20 hours ago',
    category: 'Sandboxes',
    hasSparkline: true,
  },
  {
    id: '3',
    name: 'hermes-agent',
    user: {
      name: 'adrian-tucicovenco',
      initials: 'A',
      gradient: 'from-pink-400 to-purple-500',
    },
    stoppedAt: '1 day ago',
    category: 'Sandboxes',
    hasSparkline: true,
  },
]

function Sparkline() {
  return (
    <div className="flex items-center gap-1">
      <span className="text-gray-700 text-[11px] font-mono tracking-[0.2em] select-none">-----------------------</span>
      <div className="flex items-end gap-0.5 h-4">
        <div className="w-1 h-1 bg-pink-400/80 rounded-sm" />
        <div className="w-1 h-2 bg-pink-400/80 rounded-sm" />
        <div className="w-1 h-3 bg-pink-400/80 rounded-sm" />
        <div className="w-1 h-1 bg-pink-400/80 rounded-sm" />
      </div>
    </div>
  )
}

export default function StoppedApps() {
  const [activeTab, setActiveTab] = useState<'live' | 'stopped'>('stopped')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy] = useState('Most recent')

  const filteredApps = mockStoppedApps.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">Apps</h1>
        <button className="flex items-center gap-2 text-gray-400 text-sm hover:text-white transition-colors">
          <Box className="h-4 w-4" />
          Quickstart guide
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab('live')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'live'
              ? 'bg-[#1f1f1f] text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Cloud className="h-4 w-4" />
          Live Apps
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
            activeTab === 'live' ? 'bg-[#333] text-white' : 'bg-[#262626] text-gray-500'
          }`}>
            3
          </span>
        </button>
        <button
          onClick={() => setActiveTab('stopped')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'stopped'
              ? 'bg-[#142920]/40 text-[#34d399] border border-[#1e3f31]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <XCircle className="h-4 w-4" />
          Stopped Apps
          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
            activeTab === 'stopped' ? 'bg-[#1e3f31] text-[#34d399]' : 'bg-[#262626] text-gray-500'
          }`}>
            52
          </span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 rounded-md border border-[#262626] bg-[#161616] px-3 py-2 w-96">
          <Search className="h-4 w-4 text-gray-600 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
            placeholder="Search or filter"
          />
          <span className="text-gray-600 text-xs border border-[#333] rounded px-1.5 py-0.5">/</span>
          <ChevronDown className="h-3 w-3 text-gray-600" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Sort By:</span>
          <button className="flex items-center gap-1 text-white hover:text-gray-300 transition-colors">
            {sortBy}
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* App Cards */}
      <div className="space-y-3">
        {filteredApps.map((app) => (
          <div
            key={app.id}
            className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden hover:border-[#333] transition-colors"
          >
            {/* Top Section */}
            <div className="p-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">{app.name}</h3>
              <div className="flex items-center gap-3">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${app.user.gradient} text-[10px] font-bold text-white`}>
                  {app.user.initials}
                </div>
                <span className="text-gray-300 text-sm">{app.user.name}</span>
                <span className="text-gray-500 text-sm">{app.stoppedAt}</span>
              </div>
            </div>
            {/* Divider */}
            <div className="border-t border-[#262626]" />
            {/* Bottom Section */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-gray-500" />
                <span className="text-gray-300 text-sm">{app.category}</span>
              </div>
              {app.hasSparkline && <Sparkline />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
