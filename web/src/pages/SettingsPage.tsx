import { useState } from 'react'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import {
  User, LayoutDashboard, Mail, Key, KeyRound, Globe, Box, FileCog,
  ChevronDown, CreditCard, ClipboardList, BarChart3, MessageSquare,
} from 'lucide-react'
import { useWorkspaces } from '../hooks/useWorkspaces'
import type { Workspace } from '../api/workspaces'

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
    section: 'Workspace',
    items: [
      { to: '/settings/usage', label: 'Usage & Billing', icon: CreditCard },
      { to: '/settings/audit-logs', label: 'Audit Logs', icon: ClipboardList },
      { to: '/settings/metrics-integrations', label: 'Metrics Integrations', icon: BarChart3 },
      { to: '/settings/slack-integration', label: 'Slack Integration', icon: MessageSquare, badge: 'Beta' },
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

export default function SettingsLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { data: workspaces, isLoading } = useWorkspaces()
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)

  const workspaceList = workspaces || []
  const activeWorkspace = selectedWorkspace || workspaceList[0] || null

  const isActive = (to: string) => location.pathname === to

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#111111]">
      {/* Settings Sidebar */}
      <aside className="w-64 shrink-0 h-screen border-r border-[#262626] bg-[#111111] p-4 flex flex-col gap-5 overflow-y-auto">
        {/* Back to Dashboard */}
        <button
          onClick={() => navigate('/apps/john-smith/main')}
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

        {/* Workspace selector */}
        <div className="rounded-md border border-[#262626] bg-[#161616] px-3 py-2">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Workspace</span>
          {isLoading ? (
            <span className="text-xs text-gray-400">Loading...</span>
          ) : activeWorkspace ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="w-full flex items-center justify-between gap-2 rounded hover:bg-[#1f1f1f] transition-colors px-1 -mx-1 py-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white shrink-0">
                      {activeWorkspace.name[0]?.toUpperCase()}
                    </span>
                    <span className="text-white font-medium text-xs truncate">{activeWorkspace.name}</span>
                    {activeWorkspace.is_default && (
                      <span className="rounded border border-[#4a285a] bg-[#2e1c36] px-1.5 py-0.5 font-mono text-[10px] text-[#e879f9] leading-none">
                        Default
                      </span>
                    )}
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-500 shrink-0" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-[220px] rounded-lg border border-[#262626] bg-[#161616] p-1 shadow-2xl"
                  sideOffset={4}
                  align="start"
                >
                  {workspaceList.map((ws) => (
                    <DropdownMenu.Item
                      key={ws.workspace_id}
                      onSelect={() => setSelectedWorkspace(ws)}
                      className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-xs text-gray-300 outline-none hover:bg-[#1f1f1f] hover:text-white"
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[8px] font-bold text-white">
                          {ws.name[0]?.toUpperCase()}
                        </span>
                        {ws.name}
                      </span>
                      {ws.workspace_id === activeWorkspace.workspace_id && (
                        <span className="text-[#34d399]">✓</span>
                      )}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <span className="text-xs text-gray-500">No workspaces</span>
          )}
        </div>

        {/* Workspace, Tokens, Features groups */}
        {navGroups.slice(1).map((group) => (
          <div key={group.section}>
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{group.section}</span>
            <div className="space-y-0.5">
              {group.items.map((item) => {
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
        ))}
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
