import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApps } from '../hooks/useApps'
import type { AppModel } from '../core/models/app.model'
import { Cloud, XCircle, ScrollText, Globe, Terminal, Box } from 'lucide-react'
import { timeAgo } from '../core/utils/time-ago'
import { filterApps, sortApps } from '../core/use-cases'
import { mapAppFromApi } from '../core/models/app.model'
import type { AppFilter, FilterType } from '../core/use-cases/filter-apps.use-case'
import type { SortType } from '../core/use-cases/sort-apps.use-case'
import { SearchFilterDropdown } from '../components/SearchFilterDropdown'
import { SortDropdown } from '../components/SortDropdown'
import EmptyState from '../components/EmptyState'
import MiniBarChart from '../components/MiniBarChart'
import { generateCallCounts } from '../core/utils/call-data'

export default function DashboardPage() {
  const { workspace, environment } = useParams<{ workspace: string; environment: string }>()
  const { data: apps } = useApps(environment)
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'stopped'>('live')
  const [filterType, setFilterType] = useState<FilterType>(null)
  const [filterValue, setFilterValue] = useState<string | null>(null)
  const [sortType, setSortType] = useState<SortType>('recent')

  // useApps already returns all apps (including sandboxes) in mock mode
  const allApps = apps ?? []

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
    () => [...new Set(appsWithSandboxes.map((a) => a.name).filter(Boolean))] as string[],
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
    <div className="h-full flex flex-col">
      {/* Fixed header zone — title, filters, search */}
      <div className="shrink-0 bg-[#111111]">
        <div className="max-w-6xl mx-auto w-full px-6 pt-6 pb-4">
        <h1 className="text-[26px] font-semibold text-white tracking-tight mb-5">Apps</h1>

        {/* Filter pills row */}
        <div className="flex items-center justify-between w-full mb-4">
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

        {/* Search & Sort toolbar */}
        <div className="flex items-center justify-between w-full">
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
        </div>
      </div>

      {/* Scrollable apps list — scrollbar at viewport edge, content centered */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full px-6 pb-6 pt-4 flex flex-col gap-4">
          {sortedApps.length === 0 ? (
            <EmptyState icon={Box} title="No apps to display" subtitle="Create your first app to see it here." />
          ) : (
            sortedApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                workspace={workspace!}
                environment={environment!}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function AppCard({
  app,
  workspace,
  environment,
}: {
  app: AppModel
  workspace: string
  environment: string
}) {
  const navigate = useNavigate()
  const functions = (app.functions && app.functions.length > 0)
    ? app.functions
    : ['fastapi_app']
  const instances = app.instances ?? []
  const ownerInitial = (app.deployerName || workspace || 'A')[0].toUpperCase()
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
      className="bg-[#161616] border border-[#262626] rounded-xl shadow-sm hover:border-[#383838] hover:shadow-md cursor-pointer transition-all duration-200"
    >
      {/* Header row */}
      <div className="h-11 px-4 flex items-center justify-between bg-[#191919]/30">
        <span className="font-mono text-sm font-semibold text-gray-200 tracking-tight hover:text-white transition-colors">
          {app.name}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-[10px] font-bold text-white">
            {ownerInitial}
          </div>
          <span className="text-gray-300 text-xs font-medium">
            {app.deployerName || workspace}
          </span>
          <span className="text-gray-500 text-xs">{timeAgo(app.updatedAt)}</span>
        </div>
      </div>

      {/* Function rows or Sandbox rows */}
      {isSandbox ? (
        <div className="flex flex-col divide-y divide-[#262626]/40 border-t border-[#262626]/40 bg-[#171717]/10">
          {(instances.length > 0 ? instances : [{ name: app.name }]).map((inst: any) => (
            <div
              key={inst.id || inst.name}
              className="flex items-center justify-between hover:bg-[#1c1c1c]/40 transition-colors px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-[#1f1f1f] text-gray-400">
                  <Box className="h-3 w-3 text-gray-400" />
                </div>
                <span className="font-mono text-xs font-medium text-gray-300">
                  {inst.name || app.name}
                </span>
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="bg-amber-950/20 border border-amber-900/40 text-amber-400 font-mono text-[10px] px-1.5 py-0.5 rounded">
                    Sandbox
                  </span>
                  {inst.gpu && (
                    <span className="bg-purple-950/20 border border-purple-900/40 text-purple-400 font-mono text-[10px] px-1.5 py-0.5 rounded">
                      GPU
                    </span>
                  )}
                  {inst.cpu && (
                    <span className="bg-blue-950/20 border border-blue-900/40 text-blue-400 font-mono text-[10px] px-1.5 py-0.5 rounded">
                      {inst.cpu} CPU
                    </span>
                  )}
                </div>
              </div>
              
              {/* Responsive decorative dashed line */}
              <div className="flex-1 mx-4 border-b border-dashed border-[#262626]" />
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-gray-500">
                  {inst.status === 'stopped' ? 'STOPPED' : 'RUNNING'}
                </span>
                <span className={`h-1.5 w-1.5 rounded-full ${inst.status === 'stopped' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[#262626]/40 border-t border-[#262626]/40 bg-[#171717]/10">
          {functions.map((fn: string) => (
            <FunctionRow key={fn} fn={fn} appId={app.id} badges={getBadgesForFn(fn)} />
          ))}
        </div>
      )}
    </div>
  )
}

function FunctionRow({
  fn,
  appId,
  badges,
}: {
  fn: string
  appId: string
  badges: { label: string; variant: 'cpu' | 'gpu' }[]
}) {
  const calls = useMemo(() => generateCallCounts(`${appId}:${fn}`), [appId, fn])
  const totalCalls = useMemo(() => calls.reduce((a, b) => a + b, 0), [calls])
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center justify-between hover:bg-[#1c1c1c]/40 transition-colors px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-[#1f1f1f] text-gray-400">
          <Terminal className="h-3 w-3 text-gray-400" />
        </div>
        <span className="font-mono text-xs font-medium text-gray-300">
          {fn}
        </span>
        <div className="flex items-center gap-1.5 ml-2">
          {badges.map((badge) => (
            <span
              key={badge.label}
              className={`font-mono text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                badge.variant === 'gpu'
                  ? 'bg-purple-950/20 border-purple-900/40 text-purple-400'
                  : 'bg-blue-950/20 border-blue-900/40 text-blue-400'
              }`}
            >
              {badge.label}
            </span>
          ))}
          <span className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 font-mono text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Web Function
          </span>
        </div>
      </div>
      
      <div className="relative w-[180px] shrink-0">
        <MiniBarChart
          data={calls}
          height={32}
          className="w-full"
        />
        {isHovered && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="bg-[#1f1f1f] border border-[#262626] text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded shadow-lg">
              {totalCalls.toLocaleString()} calls
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
