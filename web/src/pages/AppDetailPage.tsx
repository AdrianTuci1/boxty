import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAppMetrics, stopApp } from '../api/apps'
import { useAppById } from '../hooks/useApps'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts'
import { Copy, Search, ExternalLink, MoreHorizontal } from 'lucide-react'
import FunctionCallsTable from '../components/FunctionCallsTable'
import FunctionMetrics from '../components/FunctionMetrics'
import FunctionDetails from '../components/FunctionDetails'
import FunctionFiles from '../components/FunctionFiles'
import AppLogs from '../components/AppLogs'
import SandboxMetrics from '../components/SandboxMetrics'
import { timeAgo } from '../core/utils/time-ago'

const functionSubTabs = ['Function Calls', 'Containers', 'Metrics', 'Details', 'Files'] as const

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
  const { workspace, appId } = useParams<{ workspace: string; environment: string; appId: string }>()

  const appQ = useAppById(appId)
  const metricsQ = useQuery({ queryKey: ['apps', appId, 'metrics'], queryFn: () => getAppMetrics(appId!), enabled: !!appId })

  const [navTab, setNavTab] = useState<string>('Overview')
  const [selectedFunction, setSelectedFunction] = useState<string>('')
  const [selectedSandbox, setSelectedSandbox] = useState<string>('')
  const [functionTab, setFunctionTab] = useState<string>('Function Calls')

  const app = appQ.data
  const isSandbox = app?.kind === 'sandbox'
  const functions = isSandbox ? [] : [app?.name || 'fastapi_app']
  const sandboxes = isSandbox ? [app?.name || 'sandbox'] : []

  const handleStop = async () => {
    if (!appId) return
    await stopApp(appId)
    appQ.refetch()
  }

  const isFunctionView = functions.includes(navTab)
  const isSandboxView = sandboxes.includes(navTab)

  useEffect(() => {
    if (!isSandbox && navTab === 'Overview' && functions.length > 0 && !selectedFunction) {
      setSelectedFunction(functions[0])
      setNavTab(functions[0])
    }
  }, [isSandbox, functions, selectedFunction, navTab])

  useEffect(() => {
    if (isSandbox && sandboxes.length > 0 && (navTab === 'Overview' || navTab === 'Sandboxes')) {
      setSelectedSandbox(sandboxes[0])
      setNavTab(sandboxes[0])
    }
  }, [isSandbox, sandboxes, navTab])

  const fn = selectedFunction || functions[0]
  const appName = app?.name ?? 'App'
  const ownerName = workspace || 'adrian-tucicovenco'
  const ownerInitial = ownerName[0].toUpperCase()

  const endpointUrl = app?.endpoint_name
    ? `https://${app.endpoint_name}.modal.run`
    : `https://${workspace}--${appName}-${fn}.modal.run`

  const metrics = metricsQ.data
  const chartData = useMemo(() => {
    if (!metrics) return []
    return [
      { label: 'CPU', value: metrics.cpu_seconds },
      { label: 'RAM', value: metrics.ram_gb_seconds },
      { label: 'GPU', value: metrics.gpu_seconds },
      { label: 'Storage', value: metrics.storage_gb_seconds },
      { label: 'Egress', value: metrics.egress_gb },
    ]
  }, [metrics])

  return (
    <div className="flex h-full">
      <aside className="w-56 shrink-0 border-r border-[#262626] bg-[#111111] p-3 flex flex-col gap-3 overflow-y-auto">
        {!isSandbox ? (
          <>
            <div className="space-y-1">
              {['Overview', 'App Logs', 'Usage'].map((item) => (
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
                  const isActive = fn === fName
                  return (
                    <button
                      key={fName}
                      onClick={() => { setSelectedFunction(fName); setNavTab(fName) }}
                      className={classNames(
                        'w-full text-left rounded-lg p-2.5 transition-colors',
                        isActive ? 'bg-[#142920]/40 border border-[#1e3f31] border-l-2 border-l-[#34d399]' : 'bg-transparent border border-transparent hover:bg-[#1a1a1a]'
                      )}
                    >
                      <div className={classNames('font-mono text-xs font-semibold', isActive ? 'text-[#34d399]' : 'text-gray-300')}>
                        {fName}
                      </div>
                      <div className="text-gray-400 text-[10px] font-mono mt-1">Calls: 0 running</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              {['Sandboxes', 'App Logs', 'Usage'].map((item) => (
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
                      onClick={() => { setSelectedSandbox(sName); setNavTab(sName) }}
                      className={classNames(
                        'w-full text-left rounded-lg p-2.5 transition-colors',
                        isActive ? 'bg-[#142920]/40 border border-[#1e3f31] border-l-2 border-l-[#34d399]' : 'bg-transparent border border-transparent hover:bg-[#1a1a1a]'
                      )}
                    >
                      <div className={classNames('font-mono text-xs font-semibold', isActive ? 'text-[#34d399]' : 'text-gray-300')}>
                        {sName}
                      </div>
                      <div className="text-gray-400 text-[10px] font-mono mt-1">Sandbox</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </aside>

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {navTab === 'Overview' && (
            <>
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
                <button onClick={handleStop} className="flex items-center gap-1.5 border border-red-900/50 text-red-400 text-xs font-medium px-3 py-1.5 rounded-md hover:bg-red-950/20 transition-colors">
                  <span className="text-sm leading-none">⨂</span> Stop app
                </button>
              </div>

              <h2 className="text-base font-semibold text-white mt-6 mb-3">{isSandbox ? 'Sandboxes' : 'Functions'}</h2>
              <div className="space-y-3">
                {(isSandbox ? sandboxes : functions).map((name: string) => (
                  <button
                    key={name}
                    onClick={() => { isSandbox ? setSelectedSandbox(name) : setSelectedFunction(name); setNavTab(name) }}
                    className="w-full bg-[#161616] border border-[#262626] rounded-xl p-4 flex items-center justify-between hover:border-[#34d399]/30 transition-colors text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-white">{name}</span>
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded border bg-emerald-950/20 border-emerald-900/40 text-emerald-400">Running</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{isSandbox ? 'Sandbox container' : 'Function container'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-mono text-xs">Active</span>
                      <span className="text-gray-700 text-[11px] font-mono tracking-[0.2em] select-none">-----------------------</span>
                    </div>
                  </button>
                ))}
              </div>

              <h2 className="text-base font-semibold text-white mt-6 mb-3">Metrics</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="label" stroke="#555" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #262626', fontSize: 11 }} />
                    <Bar dataKey="value" fill="#34d399" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6">
                <h2 className="text-base font-semibold text-white mb-2">Endpoint</h2>
                <div className="flex items-center gap-2 rounded-md border border-[#262626] bg-[#111111] px-3 py-2">
                  <span className="text-xs text-gray-400 font-mono">{endpointUrl}</span>
                  <button onClick={() => navigator.clipboard.writeText(endpointUrl)} className="text-gray-500 hover:text-white transition-colors"><Copy className="h-3.5 w-3.5" /></button>
                  <a href={endpointUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors"><ExternalLink className="h-3.5 w-3.5" /></a>
                </div>
              </div>
            </>
          )}

          {isFunctionView && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h1 className="font-mono text-xl font-semibold text-white">{fn}</h1>
                <div className="flex items-center gap-2">
                  {functionSubTabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFunctionTab(tab)}
                      className={classNames('px-3 py-1.5 rounded-md text-xs font-medium transition-colors', functionTab === tab ? 'bg-[#1f1f1f] text-white' : 'text-gray-400 hover:text-white')}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              {functionTab === 'Function Calls' && <FunctionCallsTable appId={appId!} />}
              {functionTab === 'Containers' && <FunctionMetrics appId={appId!} />}
              {functionTab === 'Metrics' && <FunctionDetails />}
              {functionTab === 'Details' && <FunctionFiles volumeName={app?.name} />}
              {functionTab === 'Files' && <FunctionFiles volumeName={app?.name} />}
            </>
          )}

          {isSandboxView && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h1 className="font-mono text-xl font-semibold text-white">{selectedSandbox}</h1>
              </div>
              <SandboxMetrics appName={selectedSandbox} />
            </>
          )}

          {navTab === 'App Logs' && <AppLogs appName={appName} />}

          {navTab === 'Usage' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-white">Usage</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#1f1f1f', border: '1px solid #262626', fontSize: 11 }} />
                    <Area type="monotone" dataKey="cost" stroke="#34d399" fill="#34d399" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
