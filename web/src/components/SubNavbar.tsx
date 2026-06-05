import { useLocation, useNavigate } from 'react-router-dom'

const explorerTabs = [
  { label: 'Apps', to: '/apps' },
  { label: 'Logs', to: '/logs' },
  { label: 'Secrets', to: '/secrets' },
  { label: 'Storage', to: '/storage' },
] as const

function getActiveTab(pathname: string): string | null {
  if (pathname.match(/^\/apps\/[^/]+\/[^/]+$/)) return 'Apps'
  for (const tab of explorerTabs) {
    if (tab.to === '/apps' && pathname.match(/^\/apps\/[^/]+\/[^/]+/)) continue
    if (pathname === tab.to || pathname.startsWith(tab.to + '/')) return tab.label
  }
  if (pathname === '/storage' || pathname.startsWith('/storage/')) return 'Storage'
  if (pathname.match(/^\/apps\/[^/]+\/[^/]+\/[^/]+/)) return 'Apps'
  return null
}

export default function SubNavbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeTab = getActiveTab(location.pathname)

  return (
    <div className="flex h-11 items-center justify-between border-b border-[#262626] bg-[#111111] px-4">
      <div className="flex h-full items-center gap-6">
        {explorerTabs.map((tab) => {
          const isApps = tab.label === 'Apps'
          const isActive =
            tab.label === activeTab ||
            (isApps && location.pathname.match(/^\/apps\/[^/]+\/[^/]+/))

          const handleClick = () => {
            if (isApps) {
              const match = location.pathname.match(/^\/apps\/([^/]+)\/([^/]+)/)
              const workspace = match?.[1] || 'adrian-tucicovenco'
              const env = match?.[2] || 'main'
              navigate(`/apps/${workspace}/${env}`)
            } else {
              navigate(tab.to)
            }
          }

          return (
            <button
              key={tab.label}
              onClick={handleClick}
              className="relative flex h-full items-center text-sm font-medium transition-colors hover:text-white"
            >
              <span className={isActive ? 'text-white' : 'text-gray-400'}>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#34d399]" />
              )}
            </button>
          )
        })}
      </div>
      <div />
    </div>
  )
}

