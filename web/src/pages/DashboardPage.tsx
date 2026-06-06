import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApps } from '../hooks/useApps'
import type { App } from '../api/apps'
import { Cloud, XCircle, ScrollText, Globe } from 'lucide-react'
import { mockApps, mockSandboxApps } from '../core/mocks/apps.mock'
import { timeAgo } from '../core/utils/time-ago'
import { filterApps, sortApps } from '../core/use-cases'
import { mapAppFromApi } from '../core/models/app.model'
import type { AppFilter, FilterType } from '../core/use-cases/filter-apps.use-case'
import type { SortType } from '../core/use-cases/sort-apps.use-case'
import { SearchFilterDropdown } from '../components/SearchFilterDropdown'
import { SortDropdown } from '../components/SortDropdown'

export default function DashboardPage() {
  const { workspace, environment } = useParams<{ workspace: string; environment: string }>()
  const { data: apps } = useApps(environment)
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'stopped'>('live')
  const [filterType, setFilterType] = useState<FilterType>(null)
  const [filterValue, setFilterValue] = useState<string | null>(null)
  const [sortType, setSortType] = useState<SortType>('recent')

  // Combine real apps with mock apps
  const allApps = useMemo(() => {
    const combined = [...(apps ?? [])]
    // Add mock apps if not already present
    mockApps.forEach((mockApp) => {
      if (!combined.find((a) => a.id === mockApp.id)) {
        combined.push(mockApp as unknown as App)
      }
    })
    // Add mock sandbox apps if not already present
    mockSandboxApps.forEach((mockApp) => {
      if (!combined.find((a) => a.id === mockApp.id)) {
        combined.push(mockApp as unknown as App)
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

  // Unique values for filter submenus
  const deployers = useMemo(
    () => [...new Set(appsWithSandboxes.map((a) => a.deployer_name).filter(Boolean))] as string[],
    [appsWithSandboxes]
  )
  const tags = useMemo(
    () => [...new Set(appsWithSandboxes.map((a) => a.status).filter(Boolean))],
    [appsWithSandboxes]
  )

  // Apply filter + sort via core use-cases
  const appFilter: AppFilter = {
    status: filterStatus,
    filterType,
    filterValue,
  }

  const sortedApps = useMemo(() => {
    const models = appsWithSandboxes.map((a: any) => mapAppFromApi(a))
    const filtered = filterApps(models, appFilter)
    return sortApps(filtered, sortType)
  }, [appsWithSandboxes, appFilter, sortType])

  return (
    <div className="flex flex-col h-full">
      {/* Page title - fixed */}
      <h1 className="text-[26px] font-semibold text-white tracking-tight mb-5 shrink-0">Apps</h1>

      {/* Filter pills row - fixed */}
      <div className="flex items-center justify-between w-full mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('live')}
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterStatus === 'live'
                ? 'bg-[#142920] border border-[#1e3f31] text-[#34d399]'
                : 'bg-[#161616] border border-[#262626] text-gray-400 hover:text-gray-200 cursor-pointer'
            }`}
          >
            <Cloud className="h-3.5 w-3.5" />
            Live Apps
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] ${
                filterStatus === 'live'
                  ? 'bg-[#1b3a2b] text-[#34d399]'
                  : 'bg-[#222222] text-gray-500'
              }`}
            >
              {liveApps.length}
            </span>
          </button>
          <button
            onClick={() => setFilterStatus('stopped')}
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
              filterStatus === 'stopped'
                ? 'bg-[#142920] border border-[#1e3f31] text-[#34d399]'
                : 'bg-[#161616] border border-[#262626] text-gray-400 hover:text-gray-200'
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            Stopped Apps
            <span
              className={`px-1.5 py-0.5 rounded-full text-[11px] ${
                filterStatus === 'stopped'
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
        <SortDropdown sortType={sortType} onSelect={setSortType} />
      </div>

      {/* App listing - scrollable */}
      <div className="flex flex-col gap-4 w-full overflow-y-auto flex-1 min-h-0">
        {sortedApps.length === 0 && (
          <p className="text-sm text-gray-500 py-8 text-center">No apps to display.</p>
        )}
        {sortedApps.map((app) => (
          <AppCard
            key={app.id}
            app={app as unknown as App}
            workspace={workspace!}
            environment={environment!}
          />
        ))}
      </div>
    </div>
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
