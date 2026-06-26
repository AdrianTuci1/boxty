import { useLocation, useNavigate } from 'react-router-dom'

const explorerTabs = [
  { key: 'apps', label: 'Apps' },
  { key: 'logs', label: 'Logs' },
  { key: 'secrets', label: 'Secrets' },
  { key: 'storage', label: 'Storage' },
] as const

type PageKey = (typeof explorerTabs)[number]['key']

function matchRoute(pathname: string): PageKey | null {
  for (const { key } of explorerTabs) {
    if (pathname.startsWith(`/${key}/`)) return key
  }
  return null
}

function resolveParams(pathname: string) {
  const m = pathname.match(/^\/(?:apps|logs|secrets|storage)\/([^/]+)\/([^/]+)/)
  return { workspace: m?.[1] || 'adrian-tucicovenco', environment: m?.[2] || 'main' }
}

export default function SubNavbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeKey = matchRoute(location.pathname)

  return (
    <div className="flex h-11 items-center justify-between border-b border-[#262626] bg-[#111111] px-4">
      <div className="flex h-full items-center gap-6">
        {explorerTabs.map(({ key, label }) => {
          const isActive = key === activeKey
          const { workspace, environment } = resolveParams(location.pathname)

          return (
            <button
              key={key}
              onClick={() => navigate(`/${key}/${workspace}/${environment}`)}
              className="relative flex h-full items-center text-sm font-medium transition-colors hover:text-white"
            >
              <span className={isActive ? 'text-white' : 'text-gray-400'}>{label}</span>
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

