import { useState } from 'react'
import { Cloud, XCircle, FileText, Search, ChevronDown, Box } from 'lucide-react'

interface StoppedApp {
  id: string
  name: string
  user: {
    name: string
    initial: string
  }
  stoppedAt: string
  category: string | null
  hasSparkline: boolean
}

const mockApps: StoppedApp[] = [
  {
    id: '1',
    name: 'hermes-agent',
    user: { name: 'adrian-tucicovenco', initial: 'A' },
    stoppedAt: 'about 19 hours ago',
    category: 'Sandboxes',
    hasSparkline: true,
  },
  {
    id: '2',
    name: 'hermes-agent',
    user: { name: 'adrian-tucicovenco', initial: 'A' },
    stoppedAt: 'about 19 hours ago',
    category: 'Sandboxes',
    hasSparkline: true,
  },
  {
    id: '3',
    name: 'hermes-agent',
    user: { name: 'adrian-tucicovenco', initial: 'A' },
    stoppedAt: 'about 20 hours ago',
    category: 'Sandboxes',
    hasSparkline: true,
  },
  {
    id: '4',
    name: 'hermes-agent',
    user: { name: 'adrian-tucicovenco', initial: 'A' },
    stoppedAt: '1 day ago',
    category: 'Sandboxes',
    hasSparkline: true,
  },
  {
    id: '5',
    name: 'hermes-agent',
    user: { name: 'adrian-tucicovenco', initial: 'A' },
    stoppedAt: '1 day ago',
    category: null,
    hasSparkline: false,
  },
]

const sortOptions = ['Most recent', 'Name', 'Size'] as const

export default function StoppedApps() {
  const [activeTab, setActiveTab] = useState<'live' | 'stopped'>('stopped')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<string>('Most recent')
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const filteredApps = mockApps.filter((app) =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[26px] font-semibold text-white tracking-tight">Apps</h1>
        <a
          href="#"
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <FileText className="h-3.5 w-3.5" />
          Quickstart guide
        </a>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setActiveTab('live')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'live'
              ? 'bg-[#142920]/40 text-[#34d399] border border-[#1e3f31]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Cloud className="h-4 w-4" />
          Live Apps
          <span
            className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'live'
                ? 'bg-[#1b3a2b] text-[#34d399]'
                : 'bg-[#222] text-gray-500'
            }`}
          >
            3
          </span>
        </button>
        <button
          onClick={() => setActiveTab('stopped')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'stopped'
              ? 'bg-[#142920]/40 text-[#34d399] border border-[#1e3f31]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <XCircle className="h-4 w-4" />
          Stopped Apps
          <span
            className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'stopped'
                ? 'bg-[#1b3a2b] text-[#34d399]'
                : 'bg-[#222] text-gray-500'
            }`}
          >
            52
          </span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 bg-[#161616] border border-[#262626] rounded-lg px-3 py-2 w-80">
          <Search className="h-3.5 w-3.5 text-gray-600 shrink-0" />
          <input
            className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-gray-600"
            placeholder="Search or filter"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="text-gray-600 text-xs">/</span>
          <ChevronDown className="h-3 w-3 text-gray-600" />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-gray-500">Sort By:</span>
            <span className="text-white">{sortBy}</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showSortDropdown && (
            <>
              <div className="fixed inset-0" onClick={() => setShowSortDropdown(false)} />
              <div className="absolute right-0 mt-2 w-44 bg-[#1f1f1f] border border-[#262626] rounded-lg shadow-2xl z-10">
                {sortOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSortBy(opt)
                      setShowSortDropdown(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-xs first:rounded-t-lg last:rounded-b-lg transition-colors ${
                      sortBy === opt
                        ? 'bg-[#262626] text-white'
                        : 'text-gray-400 hover:bg-[#262626] hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* App Cards */}
      <div className="space-y-3 overflow-auto">
        {filteredApps.map((app) => (
          <div
            key={app.id}
            className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden hover:border-[#333] transition-colors"
          >
            {/* Upper section */}
            <div className="flex items-center justify-between px-4 py-3">
              <h3 className="text-sm font-semibold text-white">{app.name}</h3>
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-[10px] font-bold text-white">
                  {app.user.initial}
                </div>
                <span className="text-gray-400 text-xs">{app.user.name}</span>
                <span className="text-gray-600 text-xs">{app.stoppedAt}</span>
              </div>
            </div>

            {/* Lower section */}
            {(app.category || app.hasSparkline) && (
              <div className="flex items-center justify-between px-4 py-2 border-t border-[#262626]/50">
                <div className="flex items-center gap-1.5">
                  {app.category && (
                    <>
                      <Box className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-gray-400 text-xs">{app.category}</span>
                    </>
                  )}
                </div>
                {app.hasSparkline && (
                  <div className="relative h-8 w-24">
                    <div className="absolute bottom-1 left-0 right-0 border-t border-dashed border-[#333]" />
                    <div
                      className="absolute bottom-1 left-1/2 w-1.5 -translate-x-1/2 rounded-t bg-pink-500/80"
                      style={{ height: '60%' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
