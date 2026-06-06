import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getApp, getAppMetrics, getAppDeployments } from '../api/apps'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import {
  Copy, Search, ExternalLink,
  ChevronDown, MoreHorizontal,
  Calendar, ChevronLeft, ChevronRight, Star, Activity,
} from 'lucide-react'
import FunctionCallsTable from '../components/FunctionCallsTable'
import FunctionMetrics from '../components/FunctionMetrics'
import FunctionDetails from '../components/FunctionDetails'
import FunctionFiles from '../components/FunctionFiles'
import AppLogs from '../components/AppLogs'
import SandboxMetrics from '../components/SandboxMetrics'
import { mockSandboxNames } from '../core/mocks/sandboxes.mock'
import { timeAgo } from '../core/utils/time-ago'

const appNavItems = ['Overview', 'Deployment History', 'Usage'] as const
const functionSubTabs = ['Function Calls', 'Containers', 'Metrics', 'Details', 'Files'] as const
const hours = ['03 AM', '06 AM', '09 AM', '12 PM', '03 PM', '06 PM', '09 PM', 'Fri 05', '03 AM']

// Mock usage chart data
const usageChartData = [
  { date: 'Jun 07', cost: 0 },
  { date: 'Jun 14', cost: 0 },
  { date: 'Jun 21', cost: 0 },
  { date: 'Jun 28', cost: 0 },
]

function classNames(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export default function AppDetailPage() {
  const { workspace, appId } = useParams<{
    workspace: string
    environment: string
    appId: string
  }>()

  const appQ = useQuery({ queryKey: ['apps', appId], queryFn: () => getApp(appId!), enabled: !!appId })
  const deploymentsQ = useQuery({ queryKey: ['apps', appId, 'deployments'], queryFn: () => getAppDeployments(appId!), enabled: !!appId })
  const metricsQ = useQuery({ queryKey: ['apps', appId, 'metrics'], queryFn: () => getAppMetrics(appId!), enabled: !!appId })

  const [navTab, setNavTab] = useState<string>('Overview')
  const [selectedFunction, setSelectedFunction] = useState<string>('')
  const [selectedSandbox, setSelectedSandbox] = useState<string>('')
  const [functionTab, setFunctionTab] = useState<string>('Function Calls')
  const [showDeployments, setShowDeployments] = useState(true)

  const app = appQ.data
  const functions = app?.functions ?? app?.endpoints ?? ['fastapi_app']
  const sandboxes = (app as any)?.sandboxes ?? mockSandboxNames
  const instances = app?.instances ?? []

  // Auto-select first function when in Overview and functions exist
  useEffect(() => {
    if (navTab === 'Overview' && functions.length > 0 && !selectedFunction) {
      setSelectedFunction(functions[0])
      setNavTab(functions[0])
    }
  }, [functions, selectedFunction, navTab])

  const fn = selectedFunction || functions[0]
  const activeInstance = instances.find((i) => i.name === fn)
  const appName = app?.name ?? 'App'
  const liveContainers = activeInstance?.running_containers ?? 0

  const ownerName = app?.deployer_name || workspace || 'adrian-tucicovenco'
  const ownerInitial = ownerName[0].toUpperCase()

  const endpointUrl = app?.url
    ? app.url
    : `https://${workspace}--${appName}-${fn}.modal.run`

  const metrics = metricsQ.data
  const chartData = useMemo(() => {
    if (!metrics) return []
    return metrics.timestamps.map((t, i) => ({
      t,
      cpu: metrics.cpu[i] ?? 0,
      memory: metrics.memory[i] ?? 0,
      network_rx: metrics.network_rx[i] ?? 0,
      network_tx: metrics.network_tx[i] ?? 0,
    }))
  }, [metrics])

  const deployments = useMemo(() => {
    if (!deploymentsQ.data) return []
    return [...deploymentsQ.data].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [deploymentsQ.data])

  // Check if we're in function view mode
  const isFunctionView = functions.includes(navTab)
  const isSandboxView = sandboxes.includes(navTab)

  // Auto-select first sandbox when in sandbox view
  useEffect(() => {
    if (isSandboxView && sandboxes.length > 0 && !selectedSandbox) {
      setSelectedSandbox(sandboxes[0])
    }
  }, [isSandboxView, sandboxes, selectedSandbox])

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-[#262626] bg-[#111111] p-3 flex flex-col gap-3 overflow-y-auto">
        {isFunctionView ? (
          /* Function Sidebar */
          <>
            <div className="space-y-1">
              {['Overview', 'App Logs', 'Deployment History', 'Usage'].map((item) => (
                <button
                  key={item}
                  onClick={() => setNavTab(item)}
                  className={classNames(
                    'w-full rounded-md px-3 py-2 text-left text-xs font-medium transition-colors',
                    navTab === item ? 'bg-[#1f1f1f] text-white' : 'text-gray-400 hover:text-white'
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="h-px bg-[#262626]" />
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 rounded-md border border-[#262626] bg-transparent px-3 py-1.5 mb-2">
                <Search className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                <input className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-gray-600" placeholder="Search functions" />
              </div>
              <div className="space-y-1">
                {functions.map((fName: string) => {
                  const inst = instances.find((i) => i.name === fName)
                  const isActive = fn === fName
                  return (
                    <button
                      key={fName}
                      onClick={() => {
                        setSelectedFunction(fName)
                        setNavTab(fName)
                      }}
                      className={classNames(
                        'w-full text-left rounded-lg p-2.5 transition-colors',
                        isActive
                          ? 'bg-[#142920]/40 border border-[#1e3f31] border-l-2 border-l-[#34d399]'
                          : 'bg-transparent border border-transparent hover:bg-[#1a1a1a]'
                      )}
                    >
                      <div className={classNames('font-mono text-xs font-semibold', isActive ? 'text-[#34d399]' : 'text-gray-300')}>
                        {fName}
                      </div>
                      <div className="text-gray-400 text-[10px] font-mono mt-1">
                        Containers: {inst?.running_containers ?? 0} live
                        <span className="mx-1 text-gray-700">-</span>
                        Calls: 0 running
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        ) : isSandboxView ? (
          /* Sandbox Sidebar */
          <>
            <div className="space-y-1">
              {['Sandboxes', 'Deployment History', 'App Logs', 'Usage'].map((item) => (
                <button
                  key={item}
                  onClick={() => setNavTab(item)}
                  className={classNames(
                    'w-full rounded-md px-3 py-2 text-left text-xs font-medium transition-colors',
                    navTab === item ? 'bg-[#1f1f1f] text-white' : 'text-gray-400 hover:text-white'
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="h-px bg-[#262626]" />
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 rounded-md border border-[#262626] bg-transparent px-3 py-1.5 mb-2">
                <Search className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                <input className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-gray-600" placeholder="Search sandboxes" />
              </div>
              <div className="space-y-1">
                {sandboxes.map((sName: string) => {
                  const isActive = selectedSandbox === sName
                  return (
                    <button
                      key={sName}
                      onClick={() => {
                        setSelectedSandbox(sName)
                        setNavTab(sName)
                      }}
                      className={classNames(
                        'w-full text-left rounded-lg p-2.5 transition-colors',
                        isActive
                          ? 'bg-[#142920]/40 border border-[#1e3f31] border-l-2 border-l-[#34d399]'
                          : 'bg-transparent border border-transparent hover:bg-[#1a1a1a]'
                      )}
                    >
                      <div className={classNames('font-mono text-xs font-semibold', isActive ? 'text-[#34d399]' : 'text-gray-300')}>
                        {sName}
                      </div>
                      <div className="text-gray-400 text-[10px] font-mono mt-1">
                        Sandbox
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          /* Default Sidebar (Overview) */
          <>
            <div className="space-y-1">
              {appNavItems.map((item) => (
                <button
                  key={item}
                  onClick={() => setNavTab(item)}
                  className={classNames(
                    'w-full rounded-md px-3 py-2 text-left text-xs font-medium transition-colors',
                    navTab === item ? 'bg-[#1f1f1f] text-white' : 'text-gray-400 hover:text-white'
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="h-px bg-[#262626]" />
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 rounded-md border border-[#262626] bg-transparent px-3 py-1.5 mb-2">
                <Search className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                <input className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-gray-600" placeholder="Search functions" />
              </div>
              <div className="space-y-1">
                {functions.map((fName: string) => {
                  const inst = instances.find((i) => i.name === fName)
                  const isActive = fn === fName
                  return (
                    <button
                      key={fName}
                      onClick={() => {
                        setSelectedFunction(fName)
                        setNavTab(fName)
                      }}
                      className={classNames(
                        'w-full text-left rounded-lg p-2.5 transition-colors',
                        isActive
                          ? 'bg-[#142920]/40 border border-[#1e3f31] border-l-2 border-l-[#34d399]'
                          : 'bg-transparent border border-transparent hover:bg-[#1a1a1a]'
                      )}
                    >
                      <div className={classNames('font-mono text-xs font-semibold', isActive ? 'text-[#34d399]' : 'text-gray-300')}>
                        {fName}
                      </div>
                      <div className="text-gray-400 text-[10px] font-mono mt-1">
                        Containers: {inst?.running_containers ?? 0} live
                        <span className="mx-1 text-gray-700">-</span>
                        Calls: 0 running
                      </div>
                    </button>
                  )
                })}
              </div>
              {sandboxes.length > 0 && (
                <>
                  <div className="h-px bg-[#262626] my-2" />
                  <div className="space-y-1">
                    {sandboxes.map((sName: string) => {
                      const isActive = selectedSandbox === sName
                      return (
                        <button
                          key={sName}
                          onClick={() => {
                            setSelectedSandbox(sName)
                            setNavTab(sName)
                          }}
                          className={classNames(
                            'w-full text-left rounded-lg p-2.5 transition-colors',
                            isActive
                              ? 'bg-[#142920]/40 border border-[#1e3f31] border-l-2 border-l-[#34d399]'
                              : 'bg-transparent border border-transparent hover:bg-[#1a1a1a]'
                          )}
                        >
                          <div className={classNames('font-mono text-xs font-semibold', isActive ? 'text-[#34d399]' : 'text-gray-300')}>
                            {sName}
                          </div>
                          <div className="text-gray-400 text-[10px] font-mono mt-1">
                            Sandbox
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* ==================== OVERVIEW ==================== */}
          {navTab === 'Overview' && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-mono text-xl font-semibold text-white">{appName}</h1>
                    <button className="text-gray-500 hover:text-gray-300 transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-gray-500 text-xs">Deployed by</span>
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-[8px] font-bold text-white">
                      {ownerInitial}
                    </div>
                    <span className="text-gray-300 text-xs">{ownerName}</span>
                    <span className="text-gray-600 text-xs mx-0.5">·</span>
                    <span className="text-gray-500 text-xs">{app?.updated_at ? timeAgo(app.updated_at) : ''}</span>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 border border-red-900/50 text-red-400 text-xs font-medium px-3 py-1.5 rounded-md hover:bg-red-950/20 transition-colors">
                  <span className="text-sm leading-none">⨂</span> Stop app
                </button>
              </div>

              {/* Functions Section */}
              <h2 className="text-base font-semibold text-white mt-6 mb-3">Functions</h2>
              <div className="space-y-3">
                {functions.map((fName: string) => (
                  <button
                    key={fName}
                    onClick={() => {
                      setSelectedFunction(fName)
                      setNavTab(fName)
                    }}
                    className="w-full bg-[#161616] border border-[#262626] rounded-xl p-4 flex items-center justify-between hover:border-[#34d399]/30 transition-colors text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-white">{fName}</span>
                        <span className="bg-[#222222] text-gray-400 text-[11px] font-mono px-1.5 py-0.5 rounded">Inactive</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">CPU function</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-mono text-xs">No activity</span>
                      <span className="text-gray-700 text-[11px] font-mono tracking-[0.2em] select-none">-----------------------</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ==================== DEPLOYMENT HISTORY ==================== */}
          {navTab === 'Deployment History' && (
            <>
              {/* Header */}
              <div>
                <h1 className="text-xl font-semibold text-white">{appName} / Deployment History</h1>
                <p className="text-xs text-gray-400 mt-1">
                  See our documentation on{' '}
                  <a href="#" className="text-gray-400 underline underline-offset-2 hover:text-white transition-colors">
                    managing deployments
                  </a>{' '}
                  for more information.
                </p>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-[#262626] mt-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#161616] text-gray-400 text-xs">
                      <th className="p-3 text-left font-medium">Version</th>
                      <th className="p-3 text-left font-medium">Time deployed (EEST)</th>
                      <th className="p-3 text-left font-medium">Client version</th>
                      <th className="p-3 text-left font-medium">Deployed by</th>
                      <th className="p-3 text-left font-medium">Tag</th>
                      <th className="p-3 text-left font-medium">Commit</th>
                      <th className="p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {deployments.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-600 bg-[#161616]/30">
                          No deployments yet.
                        </td>
                      </tr>
                    )}
                    {deployments.map((d, idx) => {
                      const isLatest = idx === 0
                      const versionNum = deployments.length - idx
                      return (
                        <tr
                          key={d.id}
                          className="border-b border-[#262626]/50 hover:bg-[#1f1f1f]/50 transition-colors"
                        >
                          <td className="px-3 py-2.5">
                            <span className="text-white font-mono text-xs">v{versionNum}</span>
                          </td>
                          <td className="px-3 py-2.5 text-gray-300 font-mono text-xs">
                            {new Date(d.created_at).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', second: '2-digit',
                            })}
                          </td>
                          <td className="px-3 py-2.5 text-gray-400 font-mono text-xs">
                            1.2.6
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-[8px] font-bold text-white">
                                {ownerInitial}
                              </div>
                              <span className="text-gray-300 text-xs">{ownerName}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-gray-400 text-xs" />
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400 font-mono text-xs">1fd73e8</span>
                              <Copy className="h-3 w-3 text-gray-600" />
                              <Star className="h-3 w-3 text-gray-500" />
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            {!isLatest && (
                              <button className="text-[11px] text-gray-600 border border-gray-800/40 px-2 py-0.5 rounded hover:text-gray-400 transition-colors">
                                Rollback
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ==================== FUNCTION VIEW (replaces App Logs) ==================== */}
          {isFunctionView && (
            <>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="font-mono text-lg font-semibold text-white">{appName} / {fn}</h1>
                    <button className="text-gray-500 hover:text-gray-300 transition-colors">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="bg-[#1a1a1a] border border-[#262626] text-gray-400 text-[11px] px-2 py-0.5 rounded-full">
                      Containers: {liveContainers} live
                    </span>
                    <span className="bg-[#1a1a1a] border border-[#262626] text-gray-400 text-[11px] px-2 py-0.5 rounded-full">
                      Calls: 0 running
                    </span>
                  </div>
                  <a
                    href={endpointUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-400 text-xs font-mono underline-offset-2 hover:text-white transition-colors flex items-center gap-1 mt-1.5"
                  >
                    {endpointUrl}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center border border-[#262626] rounded-md bg-[#161616] overflow-hidden text-xs text-gray-400">
                    <button className="px-2 py-1.5 hover:text-white hover:bg-[#1f1f1f] transition-colors">«</button>
                    <button className="px-2 py-1.5 border-x border-[#262626] hover:text-white hover:bg-[#1f1f1f] transition-colors">||</button>
                    <button className="px-2 py-1.5 hover:text-white hover:bg-[#1f1f1f] transition-colors">»</button>
                  </div>
                  <div className="flex items-center gap-2 bg-[#161616] border border-[#262626] rounded-md px-3 py-1 text-xs text-white">
                    <span className="w-2 h-2 rounded-full bg-[#34d399] shrink-0" />
                    <span>1d &nbsp;Jun 4, 3:20 AM – now</span>
                    <span className="flex items-center gap-1 text-gray-400 ml-1">
                      EEST <ChevronDown className="h-3 w-3" />
                    </span>
                  </div>
                  <button className="bg-[#161616] border border-[#262626] p-1.5 rounded-md text-gray-400 hover:text-white transition-colors">
                    <Search className="h-3.5 w-3.5" />
                  </button>
                  <button className="bg-[#161616] border border-[#262626] p-1.5 rounded-md text-gray-400 hover:text-white transition-colors">
                    <Activity className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">Show Deployments</span>
                    <button
                      onClick={() => setShowDeployments(!showDeployments)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        showDeployments ? 'bg-[#34d399]' : 'bg-[#333]'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          showDeployments ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Function call results Chart */}
              <div className="mt-6">
                <p className="text-xs text-gray-400 font-medium mb-2">Function call results</p>
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.length > 0 ? chartData : [{ t: '00', cpu: 0 }]}>
                      <defs>
                        <linearGradient id="chartFillFn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="t"
                        ticks={hours}
                        stroke="#555"
                        tick={{ fontSize: 10, fontFamily: 'monospace' }}
                        tickFormatter={() => ''}
                        axisLine={{ stroke: '#262626' }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#555"
                        tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#4b5563' }}
                        tickFormatter={() => '2.0'}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #262626', fontSize: 11 }} />
                      <Area type="monotone" dataKey="cpu" stroke="#34d399" fill="url(#chartFillFn)" strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between px-10 -mt-1">
                  {hours.map((h) => (
                    <span key={h} className="text-gray-500 font-mono text-[10px]">{h}</span>
                  ))}
                </div>
              </div>

              {/* Sub-navigation tabs */}
              <div className="h-10 border-b border-[#262626] flex items-center justify-between mt-6">
                <div className="flex items-center gap-5 h-full">
                  {functionSubTabs.map((tab) => {
                    const isActive = functionTab === tab
                    return (
                      <button
                        key={tab}
                        onClick={() => setFunctionTab(tab)}
                        className={`relative h-full flex items-center text-xs font-medium transition-colors ${
                          isActive ? 'text-white font-semibold' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {tab}
                        {isActive && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#34d399]" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tab Content */}
              {functionTab === 'Function Calls' && <FunctionCallsTable />}
              {functionTab === 'Containers' && (
                <div className="mt-6 text-center text-gray-500 text-sm py-12">
                  No containers running.
                </div>
              )}
              {functionTab === 'Metrics' && <FunctionMetrics />}
              {functionTab === 'Details' && <FunctionDetails />}
              {functionTab === 'Files' && <FunctionFiles />}
            </>
          )}

          {/* ==================== APP LOGS (Function View) ==================== */}
          {isFunctionView && navTab === 'App Logs' && (
            <AppLogs appName={appName} />
          )}

          {/* ==================== SANDBOX VIEW ==================== */}
          {isSandboxView && (
            <SandboxMetrics appName={appName} />
          )}

          {/* ==================== USAGE ==================== */}
          {navTab === 'Usage' && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-white">{appName} / Usage</h1>
                <div className="flex items-center gap-1">
                  <button className="p-1 text-gray-500 hover:text-white transition-colors">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex items-center gap-1.5 bg-[#161616] border border-[#262626] rounded-md px-3 py-1 text-xs text-gray-300">
                    <Calendar className="h-3.5 w-3.5 text-gray-500" />
                    Billing Cycle: Jun 1 – Jul 1, 2026
                  </div>
                  <button className="p-1 text-gray-500 hover:text-white transition-colors">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Total Usage */}
              <div className="mt-6">
                <p className="text-xs text-gray-400">Total Usage</p>
                <p className="text-white font-bold text-4xl tracking-tight mt-1">$0</p>
              </div>

              {/* Resource Breakdown Chart */}
              <div className="bg-[#161616] border border-[#262626] rounded-xl p-5 mt-4 min-h-[280px]">
                <h3 className="text-sm font-semibold text-white mb-4">Resource Breakdown</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usageChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="" vertical={false} stroke="#262626" />
                      <XAxis
                        dataKey="date"
                        stroke="#555"
                        tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 2.5]}
                        ticks={[0, 1, 2]}
                        stroke="#555"
                        tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#6b7280' }}
                        tickFormatter={(v: number) => `$${v}`}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{ background: '#1f1f1f', border: '1px solid #262626', fontSize: 11 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cost"
                        stroke="#34d399"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: '#34d399' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}