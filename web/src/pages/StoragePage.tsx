import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HardDrive, Database, FileText, ArrowUpDown, Search } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

const filterPills = [
  { label: 'Volumes', count: 4, active: true },
  { label: 'Queues', count: 0, active: false },
  { label: 'Dicts', count: 0, active: false },
] as const

const exampleVolumes = [
  { name: 'thunder-cache', created: 'about 1 month ago', size: '12.6 GiB' },
  { name: 'thunder-checkpoints', created: 'about 2 months ago', size: '9.0 GiB' },
  { name: 'dental-data-storage', created: 'about 1 month ago', size: '602.3 MiB' },
  { name: 'sentinel-ml-checkpoints', created: 'about 1 month ago', size: '41.1 MiB' },
]

export default function StoragePage() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('Volumes')
  const [sortBy, setSortBy] = useState('Size')
  const [search, setSearch] = useState('')

  const filtered = exampleVolumes.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-2">
        <h1 className="text-[26px] font-semibold text-white tracking-tight">Storage</h1>
        <div className="flex items-center bg-[#111111] border border-[#262626] rounded-md px-3 py-1.5 w-[280px] justify-between text-gray-500 text-xs">
          <input
            className="bg-transparent outline-none text-gray-500 text-xs placeholder:text-gray-600 flex-1"
            placeholder="Search volumes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="h-3.5 w-3.5 shrink-0" />
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-gray-400 text-xs font-medium mb-5 block">
        Persist and communicate data created or processed by your Modal Apps.
      </p>

      {/* Filter pills + Sort */}
      <div className="flex items-center justify-between w-full mb-4">
        <div className="flex items-center gap-2">
          {filterPills.map((pill) => {
            const isActive = pill.label === activeFilter
            return (
              <button
                key={pill.label}
                onClick={() => setActiveFilter(pill.label)}
                className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#142920] border border-[#1e3f31] text-[#34d399]'
                    : 'bg-[#161616] border border-[#262626] text-gray-400 font-medium'
                }`}
              >
                {pill.label === 'Volumes' && <HardDrive className="h-3 w-3" />}
                {pill.label === 'Queues' && <Database className="h-3 w-3" />}
                {pill.label === 'Dicts' && <FileText className="h-3 w-3" />}
                {pill.label}
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[11px] ${
                    isActive
                      ? 'bg-[#1b3a2b] text-[#34d399]'
                      : 'bg-[#222222] text-gray-500'
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Sort */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span className="text-gray-500">Sort:</span>
              <span className="text-white font-medium">{sortBy}</span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[120px] rounded-lg border border-[#262626] bg-[#1f1f1f] p-1 shadow-2xl"
              sideOffset={4}
            >
              {['Size', 'Name', 'Created'].map((opt) => (
                <DropdownMenu.Item
                  key={opt}
                  onClick={() => setSortBy(opt)}
                  className={`flex cursor-pointer items-center rounded-md px-3 py-2 text-xs outline-none hover:bg-[#262626] ${
                    sortBy === opt ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {opt}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Context banner */}
      <p className="text-gray-400 text-xs font-medium mb-4 block">
        Total volumes in the environment: 22.2 GiB. Volume size refreshes once per day.
      </p>

      {/* Table */}
      <div className="w-full bg-[#161616]/30 border border-[#262626] rounded-xl overflow-hidden">
        <div className="flex bg-[#161616] text-gray-400 text-xs font-medium p-3 border-b border-[#262626]">
          <span className="flex-1">Name</span>
          <span className="w-40">Created</span>
          <span className="w-28">Size</span>
          <span className="w-20" />
        </div>

        {filtered.map((vol) => (
          <div
            key={vol.name}
            className="flex items-center px-4 py-3.5 border-b border-[#262626]/40 last:border-b-0 hover:bg-[#1f1f1f]/60 transition-all"
          >
            <div className="flex-1">
              <button
                onClick={() => navigate(`/storage/${vol.name}`)}
                className="font-mono font-semibold text-white text-xs hover:text-[#34d399] transition-colors"
              >
                {vol.name}
              </button>
            </div>
            <span className="w-40 text-gray-400 text-xs">{vol.created}</span>
            <span className="w-28 text-gray-300 font-mono text-xs">{vol.size}</span>
            <div className="w-20">
              <button className="text-xs text-gray-500 border border-gray-800/40 px-2 py-0.5 rounded hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/50 transition-all">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
