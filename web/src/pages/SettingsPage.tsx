import { useState } from 'react'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'
import {
  User, LayoutDashboard, Mail, Key, KeyRound, Globe, Box, FileCog,
  ChevronDown, CreditCard,
} from 'lucide-react'

const navGroups = [
  {
    section: 'Account',
    items: [
      { to: '/settings/profile', label: 'Profile', icon: User },
      { to: '/settings/workspaces', label: 'Workspaces', icon: LayoutDashboard },
      { to: '/settings/email', label: 'Email Preferences', icon: Mail },
    ],
  },
  {
    section: 'Tokens',
    items: [
      { to: '/settings/api-tokens', label: 'API Tokens', icon: Key },
      { to: '/settings/proxy-tokens', label: 'Proxy Auth Tokens', icon: KeyRound },
    ],
  },
  {
    section: 'Features',
    items: [
      { to: '/settings/domains', label: 'Domains', icon: Globe },
      { to: '/settings/image-builder', label: 'Image Builder Version', icon: Box },
      { to: '/settings/proxies', label: 'Proxies', icon: FileCog, badge: 'Beta' },
    ],
  },
]

const workspaceSubItems = [
  'Workspace Management',
  'Usage & Billing',
  'Audit Logs',
  'Metrics Integrations',
  'Slack Integration',
] as const

export default function SettingsLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [workspace, setWorkspace] = useState<'staging-static' | 'adrian-tucicovenco'>('staging-static')

  const isActive = (to: string) => location.pathname === to
  const isPersonal = workspace === 'adrian-tucicovenco'

  const cycleWorkspace = () => {
    setWorkspace((prev) => (prev === 'staging-static' ? 'adrian-tucicovenco' : 'staging-static'))
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#111111]">
      {/* Settings Sidebar */}
      <aside className="w-64 shrink-0 h-screen border-r border-[#262626] bg-[#111111] p-4 flex flex-col gap-5 overflow-y-auto">
        {/* Back to Dashboard */}
        <button
          onClick={() => navigate('/apps/adrian-tucicovenco/main')}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
        >
          ‹ Back to Dashboard
        </button>

        {/* Account group */}
        <div>
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Account</span>
          <div className="space-y-0.5">
            {navGroups[0].items.map((item) => {
              const active = isActive(item.to)
              const Icon = item.icon
              return (
                <button
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-[#1d241d] text-[#34d399]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Workspace toggle line */}
        <button
          onClick={cycleWorkspace}
          className="flex items-center justify-between rounded-md border border-[#262626] bg-[#161616] px-3 py-2 hover:bg-[#1f1f1f] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-white font-medium text-xs">{workspace}</span>
            {workspace === 'staging-static' && (
              <span className="rounded border border-[#4a285a] bg-[#2e1c36] px-1.5 py-0.5 font-mono text-[10px] text-[#e879f9] leading-none">
                Starter
              </span>
            )}
          </div>
          <ChevronDown className="h-3 w-3 text-gray-500" />
        </button>

        {/* Workspace-specific items */}
        {isPersonal ? (
          <>
            <button
              onClick={() => navigate('/settings/usage')}
              className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                isActive('/settings/usage')
                  ? 'bg-[#1d241d] text-[#34d399]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              Usage & Billing
            </button>
            <button
              onClick={() => navigate('/settings/api-tokens')}
              className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                isActive('/settings/api-tokens')
                  ? 'bg-[#1d241d] text-[#34d399]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Key className="h-4 w-4" />
              API Tokens
            </button>
          </>
        ) : (
          <>
            {/* Workspace management sub-items */}
            <div>
              {workspaceSubItems.map((item) => (
                <button
                  key={item}
                  className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                >
                  {item}
                  {item === 'Slack Integration' && (
                    <span className="bg-[#1a2333] text-[#60a5fa] border border-[#1e293b] text-[10px] px-1.5 py-0.2 rounded-md ml-1">
                      Beta
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tokens group */}
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block mt-3">Tokens</span>
              <div className="space-y-0.5">
                {navGroups[1].items.map((item) => {
                  const active = isActive(item.to)
                  const Icon = item.icon
                  return (
                    <button
                      key={item.to}
                      onClick={() => navigate(item.to)}
                      className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#1d241d] text-[#34d399]'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Features group */}
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block mt-3">Features</span>
              <div className="space-y-0.5">
                {navGroups[2].items.map((item) => {
                  const active = isActive(item.to)
                  const Icon = item.icon
                  return (
                    <button
                      key={item.to}
                      onClick={() => navigate(item.to)}
                      className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#1d241d] text-[#34d399]'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                      {item.badge && (
                        <span className="bg-[#1a2333] text-[#60a5fa] border border-[#1e293b] text-[10px] px-1.5 py-0.2 rounded-md ml-1">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-10 max-w-4xl mx-auto space-y-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
