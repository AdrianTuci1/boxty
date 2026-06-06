import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApps } from '../hooks/useApps'
import type { App } from '../api/apps'
import { Cloud, XCircle, Search, ScrollText, ChevronDown, Globe, ChevronRight, Check, ArrowLeft } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

type FilterType = 'deployer' | 'tag' | null
type SortType = 'recent' | 'alphabetical' | 'newest' | 'oldest' | 'activity'

// Mock apps for display
const mockApps: App[] = [
  {
    id: 'app-1',
    name: 'hermes-agent',
    environment_id: 'main',
    status: 'active',
    type: 'function',
    deployer_name: 'adrian-tucicovenco',
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-06T08:30:00Z',
    functions: ['fastapi_app', 'web_endpoint', 'background_task'],
    instances: [
      { id: 'inst-1', app_id: 'app-1', name: 'fastapi_app', cpu: 1, memory: 512, gpu: null, min_containers: 0, max_containers: 10, scaledown_window: 60, running_containers: 2, status: 'running', created_at: '2026-06-01T10:00:00Z' },
      { id: 'inst-2', app_id: 'app-1', name: 'web_endpoint', cpu: 0.5, memory: 256, gpu: null, min_containers: 0, max_containers: 5, scaledown_window: 60, running_containers: 1, status: 'running', created_at: '2026-06-01T10:00:00Z' },
      { id: 'inst-3', app_id: 'app-1', name: 'background_task', cpu: 0.5, memory: 256, gpu: null, min_containers: 0, max_containers: 3, scaledown_window: 60, running_containers: 0, status: 'stopped', created_at: '2026-06-01T10:00:00Z' },
    ],
  },
  {
    id: 'app-2',
    name: 'data-processor',
    environment_id: 'main',
    status: 'active',
    type: 'function',
    deployer_name: 'adrian-tucicovenco',
    created_at: '2026-06-03T14:00:00Z',
    updated_at: '2026-06-05T16:45:00Z',
    functions: ['process_data', 'generate_report'],
    instances: [
      { id: 'inst-4', app_id: 'app-2', name: 'process_data', cpu: 2, memory: 1024, gpu: null, min_containers: 0, max_containers: 5, scaledown_window: 60, running_containers: 1, status: 'running', created_at: '2026-06-03T14:00:00Z' },
      { id: 'inst-5', app_id: 'app-2', name: 'generate_report', cpu: 1, memory: 512, gpu: null, min_containers: 0, max_containers: 3, scaledown_window: 60, running_containers: 0, status: 'stopped', created_at: '2026-06-03T14:00:00Z' },
    ],
  },
  {
    id: 'app-3',
    name: 'ml-inference',
    environment_id: 'main',
    status: 'stopped',
    type: 'function',
    deployer_name: 'adrian-tucicovenco',
    created_at: '2026-05-20T09:00:00Z',
    updated_at: '2026-06-02T11:20:00Z',
    functions: ['predict', 'train_model'],
    instances: [
      { id: 'inst-6', app_id: 'app-3', name: 'predict', cpu: 4, memory: 8192, gpu: 'T4', min_containers: 0, max_containers: 2, scaledown_window: 120, running_containers: 0, status: 'stopped', created_at: '2026-05-20T09:00:00Z' },
      { id: 'inst-7', app_id: 'app-3', name: 'train_model', cpu: 8, memory: 16384, gpu: 'A100', min_containers: 0, max_containers: 1, scaledown_window: 300, running_containers: 0, status: 'stopped', created_at: '2026-05-20T09:00:00Z' },
    ],
  },
]

// Mock sandbox apps
const mockSandboxApps: App[] = [
  {
    id: 'sandbox-app-1',
    name: 'hermes-agent-sandbox',
    environment_id: 'main',
    status: 'active',
    type: 'sandbox',
    deployer_name: 'adrian-tucicovenco',
    created_at: '2026-06-05T10:00:00Z',
    updated_at: '2026-06-06T04:34:00Z',
  },
]

export default function DashboardPage() {
  const { workspace, environment } = useParams<{ workspace: string; environment: string }>()
  const { data: apps } = useApps(environment)
  const [filter, setFilter] = useState<'all' | 'live' | 'stopped'>('live')
  const [filterType, setFilterType] = useState<FilterType>(null)
  const [filterValue, setFilterValue] = useState<string | null>(null)
  const [sortType, setSortType] = useState<SortType>('recent')

  // Combine real apps with mock apps
  const allApps = useMemo(() => {
    const combined = [...(apps ?? [])]
    // Add mock apps if not already present
    mockApps.forEach((mockApp) => {
      if (!combined.find((a) => a.id === mockApp.id)) {
        combined.push(mockApp)
      }
    })
    // Add mock sandbox apps if not already present
    mockSandboxApps.forEach((mockApp) => {
      if (!combined.find((a) => a.id === mockApp.id)) {
        combined.push(mockApp)
      }
    })
    return combined
  }, [apps])

  // Use all apps directly without sandbox filtering
  const appsWithSandboxes = allApps

  const liveApps = appsWithSandboxes.filter(
    (a) => a.status === 'active' || a.status === 'running'
  )
  const stoppedApps = appsWithSandboxes.filter(
    (a) => a.status !== 'active' && a.status !== 'running'
  )
  const statusFiltered =
    filter === 'all' ? appsWithSandboxes : filter === 'live' ? liveApps : stoppedApps

  // Unique values for filter submenus
  const deployers = useMemo(
    () => [...new Set(appsWithSandboxes.map((a) => a.deployer_name).filter(Boolean))] as string[],
    [appsWithSandboxes]
  )
  const tags = useMemo(
    () => [...new Set(appsWithSandboxes.map((a) => a.status).filter(Boolean))],
    [appsWithSandboxes]
  )

  // Apply search filter
  const filteredApps = useMemo(() => {
    let result = statusFiltered
    if (filterType === 'deployer' && filterValue) {
      result = result.filter((a) => a.deployer_name === filterValue)
    }
    if (filterType === 'tag' && filterValue) {
      result = result.filter((a) => a.status === filterValue)
    }
    return result
  }, [statusFiltered, filterType, filterValue])

  // Apply sorting
  const sortedApps = useMemo(() => {
    const sorted = [...filteredApps]
    switch (sortType) {
      case 'alphabetical':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'newest':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'activity':
        sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        break
      case 'recent':
      default:
        sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        break
    }
    return sorted
  }, [filteredApps, sortType])

  const sortLabels: Record<SortType, string> = {
    recent: 'Most recent',
    alphabetical: 'Alphabetical',
    newest: 'Newest',
    oldest: 'Oldest',
    activity: 'Activity',
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page title - fixed */}
      <h1 className="text-[26px] font-semibold text-white tracking-tight mb-5 shrink-0">Apps</h1>

      {/* Filter pills row - fixed */}
      <div className="flex items-center justify-between w-full mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('live')}
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === 'live'
                ? 'bg-[#142920] border border-[#1e3f31] text-[#34d399]'
                : 'bg-[#161616] border border-[#262626] text-gray-400 hover:text-gray-200 cursor-pointer'
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            Live Apps
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] ${
                filter === 'live'
                  ? 'bg-[#1b3a2b] text-[#34d399]'
                  : 'bg-[#222222] text-gray-500'
              }`}
            >
              {liveApps.length}
            </span>
          </button>
          <button
            onClick={() => setFilter('stopped')}
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
              filter === 'stopped'
                ? 'bg-[#142920] border border-[#1e3f31] text-[#34d399]'
                : 'bg-[#161616] border border-[#262626] text-gray-400 hover:text-gray-200'
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            Stopped Apps
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] ${
                filter === 'stopped'
                  ? 'bg-[#1b3a2b] text-[#34d399]'
                  : 'bg-[#222222] text-gray-500'
              }`}
            >
              {stoppedApps.length}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs font-medium flex items-center gap-1.5">
            <ScrollText className="h-3.5 w-3.5" />
            Quickstart guide
          </span>
        </div>
      </div>

      {/* Search & Sort toolbar - fixed */}
      <div className="flex items-center justify-between w-full mb-6 shrink-0">
        <SearchFilterDropdown
          filterType={filterType}
          filterValue={filterValue}
          deployers={deployers}
          tags={tags}
          onSelectFilter={(type, value) => {
            setFilterType(type)
            setFilterValue(value)
          }}
          onClear={() => {
            setFilterType(null)
            setFilterValue(null)
          }}
        />
        <SortDropdown sortType={sortType} sortLabels={sortLabels} onSelect={setSortType} />
      </div>

      {/* App listing - scrollable */}
      <div className="flex flex-col gap-4 w-full overflow-y-auto flex-1 min-h-0">
        {sortedApps.length === 0 && (
          <p className="text-sm text-gray-500 py-8 text-center">No apps to display.</p>
        )}
        {sortedApps.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            workspace={workspace!}
            environment={environment!}
          />
        ))}
      </div>
    </div>
  )
}

function SearchFilterDropdown({
  filterType,
  filterValue,
  deployers,
  tags,
  onSelectFilter,
  onClear,
}: {
  filterType: FilterType
  filterValue: string | null
  deployers: string[]
  tags: string[]
  onSelectFilter: (type: FilterType, value: string | null) => void
  onClear: () => void
}) {
  const filterLabel = filterType === 'deployer' ? 'deployed by' : filterType === 'tag' ? 'tag' : null
  const [submenu, setSubmenu] = useState<FilterType>(null)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const items: { label: string; key: FilterType }[] = [
    { label: 'Last deployed by', key: 'deployer' },
    { label: 'Tag', key: 'tag' },
  ]

  const dataMap: Record<string, string[]> = { deployer: deployers, tag: tags }
  const currentItems = submenu ? dataMap[submenu] || [] : []
  const filteredItems = currentItems.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setSubmenu(null)
      setSearch('')
    }
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          onClick={() => setOpen(true)}
          className={`w-[320px] bg-[#111111] border border-[#262626] rounded-md px-3 py-1.5 flex items-center gap-2 hover:border-[#3a3a3a] transition-colors ${
            filterType ? 'border-[#34d399]/30 ring-1 ring-[#34d399]/20' : ''
          }`}
        >
          <Search className="h-3.5 w-3.5 text-gray-500 shrink-0" />
          {filterType ? (
            <>
              <span className="text-xs text-gray-500 flex-1 text-left">
                Filter: <span className="text-gray-300">{filterLabel}</span>
                {filterValue && (
                  <span className="text-[#34d399] ml-0.5">{filterValue}</span>
                )}
              </span>
              <XCircle
                className="h-3 w-3 text-gray-500 hover:text-gray-300 shrink-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onClear()
                }}
              />
            </>
          ) : (
            <>
              <span className="text-xs text-gray-600 flex-1 text-left">Search or filter</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-gray-600 text-[11px] px-1 py-0.5 rounded border border-[#262626] leading-none">
                  /
                </span>
                <ChevronDown className="h-3 w-3 text-gray-500" />
              </div>
            </>
          )}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="start"
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="w-[320px] bg-[#1a1a1a] border border-[#262626] rounded-lg py-1 shadow-xl z-50 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
        >
          {submenu ? (
            <>
              {/* Back + Search header */}
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#262626]">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSubmenu(null)
                    setSearch('')
                  }}
                  className="text-gray-400 hover:text-white transition-colors shrink-0"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <Search className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-0 outline-none p-0 text-xs text-white placeholder-gray-600 flex-1"
                  placeholder={`Filter ${submenu}s...`}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
              {/* Items list */}
              <div className="max-h-[240px] overflow-y-auto">
                {filteredItems.map((item) => (
                  <div
                    key={item}
                    onClick={() => {
                      onSelectFilter(submenu, item)
                      setOpen(false)
                      setSubmenu(null)
                      setSearch('')
                    }}
                    className="text-xs text-gray-300 px-3 py-1.5 cursor-pointer hover:bg-[#262626] hover:text-white flex items-center justify-between outline-none rounded-sm mx-1"
                  >
                    <span className="capitalize">{item}</span>
                    {filterType === submenu && filterValue === item && (
                      <Check className="h-3 w-3 text-[#34d399]" />
                    )}
                  </div>
                ))}
                {filteredItems.length === 0 && (
                  <div className="text-xs text-gray-500 px-3 py-2 text-center">
                    No results
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {items.map(({ label, key }) => (
                <div
                  key={key}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSubmenu(key)
                    setSearch('')
                  }}
                  className="text-xs text-gray-300 px-3 py-1.5 cursor-pointer hover:bg-[#262626] hover:text-white flex items-center justify-between outline-none rounded-sm mx-1"
                >
                  <span>{label}</span>
                  {filterType === key && filterValue && (
                    <span className="text-gray-500 text-[11px]">{filterValue}</span>
                  )}
                  <ChevronRight className="h-3 w-3 text-gray-500" />
                </div>
              ))}
              {filterType && (
                <>
                  <div className="h-px bg-[#262626] my-1" />
                  <div
                    onClick={() => {
                      onClear()
                      setOpen(false)
                    }}
                    className="text-xs text-gray-400 px-3 py-1.5 cursor-pointer hover:bg-[#262626] hover:text-white outline-none rounded-sm mx-1"
                  >
                    Clear filter
                  </div>
                </>
              )}
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function SortDropdown({
  sortType,
  sortLabels,
  onSelect,
}: {
  sortType: SortType
  sortLabels: Record<SortType, string>
  onSelect: (type: SortType) => void
}) {
  const sortOptions: SortType[] = ['recent', 'alphabetical', 'newest', 'oldest', 'activity']

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity">
          <span className="text-gray-500">Sort By:</span>
          <span className="text-white font-medium">{sortLabels[sortType]}</span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className="bg-[#1a1a1a] border border-[#262626] rounded-lg py-1 min-w-[160px] shadow-xl z-50"
        >
          {sortOptions.map((option) => (
            <DropdownMenu.Item
              key={option}
              onClick={() => onSelect(option)}
              className="text-xs text-gray-300 px-3 py-1.5 cursor-pointer hover:bg-[#262626] hover:text-white flex items-center justify-between outline-none rounded-sm mx-1"
            >
              <span>{sortLabels[option]}</span>
              {sortType === option && <Check className="h-3 w-3 text-[#34d399]" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function AppCard({
  app,
  workspace,
  environment,
}: {
  app: App
  workspace: string
  environment: string
}) {
  const navigate = useNavigate()
  const functions = app.functions ?? app.endpoints ?? ['fastapi_app']
  const instances = app.instances ?? []
  const ownerInitial = (app.deployer_name || workspace || 'A')[0].toUpperCase()
  const isMultiFunction = functions.length > 1
  const isSandbox = app.type === 'sandbox'

  const getBadgesForFn = (fn: string) => {
    const instance = instances.find((i) => i.name === fn)
    const badges: { label: string; variant: 'cpu' | 'gpu' }[] = []
    if (instance?.gpu) {
      badges.push({ label: 'T4 GPU', variant: 'gpu' })
    } else {
      badges.push({ label: 'CPU', variant: 'cpu' })
    }
    return badges
  }

  return (
    <div
      onClick={() => navigate(`/apps/${workspace}/${environment}/${app.id}`)}
      className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden shadow-sm cursor-pointer transition-colors"
    >
      {/* Header row */}
      <div className="h-11 border-b border-[#262626]/60 px-4 flex items-center justify-between bg-[#191919]/30">
        <span className="font-mono text-sm font-semibold text-gray-200 tracking-tight hover:text-white transition-colors">
          {app.name}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-[10px] font-bold text-white">
            {ownerInitial}
          </div>
          <span className="text-gray-300 text-xs font-medium">
            {app.deployer_name || workspace}
          </span>
          <span className="text-gray-500 text-xs">{timeAgo(app.updated_at)}</span>
        </div>
      </div>

      {/* Function rows or Sandbox row */}
      {isSandbox ? (
        <div className="flex items-center justify-between hover:bg-[#1f1f1f] transition-colors px-4 py-3">
          <div className="flex items-center">
            <span className="font-mono text-xs text-gray-300 pl-4 relative before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:border before:border-gray-600 before:rounded-full">
              {app.name}
            </span>
            <div className="flex items-center gap-1.5 ml-4">
              <span className="bg-[#1f1f1f] border border-[#2d2d2d] text-gray-400 font-mono text-[11px] px-1.5 py-0.5 rounded">
                Sandbox
              </span>
            </div>
          </div>
          <span className="text-gray-700 text-[11px] font-mono tracking-[0.2em] select-none">
            -----------------------
          </span>
        </div>
      ) : (
        <div
          className={`bg-transparent flex flex-col ${
            isMultiFunction ? 'space-y-3.5' : 'gap-1'
          }`}
        >
          {functions.map((fn: string) => (
            <FunctionRow key={fn} fn={fn} badges={getBadgesForFn(fn)} />
          ))}
        </div>
      )}
    </div>
  )
}

function FunctionRow({
  fn,
  badges,
}: {
  fn: string
  badges: { label: string; variant: 'cpu' | 'gpu' }[]
}) {
  return (
    <div className="flex items-center justify-between hover:bg-[#1f1f1f] transition-colors px-4 py-3">
      <div className="flex items-center">
        <span className="font-mono text-xs text-gray-300 pl-4 relative before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:border before:border-gray-600 before:rounded-full">
          {fn}
        </span>
        <div className="flex items-center gap-1.5 ml-4">
          {badges.map((badge) => (
            <span
              key={badge.label}
              className="bg-[#1f1f1f] border border-[#2d2d2d] text-gray-400 font-mono text-[11px] px-1.5 py-0.5 rounded"
            >
              {badge.label}
            </span>
          ))}
          <span className="bg-[#1f1f1f] border border-[#2d2d2d] text-gray-400 font-mono text-[11px] px-1.5 py-0.5 rounded flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Web Function
          </span>
        </div>
      </div>
      <span className="text-gray-700 text-[11px] font-mono tracking-[0.2em] select-none">
        -----------------------
      </span>
    </div>
  )
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `about ${months} month${months > 1 ? 's' : ''} ago`
}
