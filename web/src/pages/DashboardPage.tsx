import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApps } from '../hooks/useApps'
import { useSandboxes } from '../hooks/useSandboxes'
import type { App } from '../api/apps'
import { Cloud, XCircle, Search, ScrollText, ChevronDown, Globe } from 'lucide-react'

export default function DashboardPage() {
  const { workspace, environment } = useParams<{ workspace: string; environment: string }>()
  const { data: apps } = useApps(environment)
  const { data: sandboxes } = useSandboxes()
  const [filter, setFilter] = useState<'all' | 'live' | 'stopped'>('all')

  // Only show apps that have at least one sandbox
  const appIdsWithSandboxes = useMemo(() => {
    const ids = new Set<string>()
    sandboxes?.forEach((s) => ids.add(s.app_id))
    return ids
  }, [sandboxes])

  const appsWithSandboxes = useMemo(
    () => apps?.filter((a) => appIdsWithSandboxes.has(a.id)) ?? [],
    [apps, appIdsWithSandboxes]
  )

  const liveApps = appsWithSandboxes.filter(
    (a) => a.status === 'active' || a.status === 'running'
  )
  const stoppedApps = appsWithSandboxes.filter(
    (a) => a.status !== 'active' && a.status !== 'running'
  )
  const filteredApps =
    filter === 'all' ? appsWithSandboxes : filter === 'live' ? liveApps : stoppedApps

  return (
    <div>
      {/* Page title */}
      <h1 className="text-[26px] font-semibold text-white tracking-tight mb-5">Apps</h1>

      {/* Filter pills row */}
      <div className="flex items-center justify-between w-full mb-4">
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
          <span className="text-gray-400 text-xs font-medium flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
            <ScrollText className="h-3.5 w-3.5" />
            Quickstart guide
          </span>
        </div>
      </div>

      {/* Search & Sort toolbar */}
      <div className="flex items-center justify-between w-full mb-6">
        <div className="relative w-[320px] bg-[#111111] border border-[#262626] rounded-md px-3 py-1.5 flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-gray-500 shrink-0" />
          <input
            className="bg-transparent border-0 outline-none p-0 text-xs text-white placeholder-gray-600 flex-1"
            placeholder="Search or filter"
          />
          <div className="flex items-center gap-1">
            <span className="font-mono text-gray-600 text-[11px] px-1 py-0.5 rounded border border-[#262626] leading-none">
              /
            </span>
            <ChevronDown className="h-3 w-3 text-gray-500" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-gray-500">Sort By:</span>
          <span className="text-white font-medium">Most recent</span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </div>
      </div>

      {/* App listing */}
      <div className="flex flex-col gap-4 w-full">
        {filteredApps.length === 0 && (
          <p className="text-sm text-gray-500 py-8 text-center">No apps to display.</p>
        )}
        {filteredApps.map((app) => (
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
      className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden shadow-sm cursor-pointer hover:bg-[#1a1a1a] transition-colors"
    >
      {/* Header row */}
      <div className="h-11 border-b border-[#262626]/60 px-4 flex items-center justify-between bg-[#191919]/30">
        <span className="font-mono text-sm font-semibold text-gray-200 tracking-tight">
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

      {/* Function rows */}
      <div
        className={`px-4 bg-transparent ${
          isMultiFunction ? 'py-4 flex flex-col space-y-3.5' : 'py-3 flex flex-col gap-1'
        }`}
      >
        {functions.map((fn: string) => (
          <FunctionRow key={fn} fn={fn} badges={getBadgesForFn(fn)} />
        ))}
      </div>
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
    <div className="flex items-center justify-between">
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
