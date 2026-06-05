import * as Select from '@radix-ui/react-select'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, Bell, Check } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const workspaceItems = ['adrian-tucicovenco']
const environments = ['main', 'staging', 'production']

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  // Parse workspace/environment from URL if on an apps route
  const match = location.pathname.match(/^\/apps\/([^/]+)\/([^/]+)/)
  const currentWorkspace = match ? match[1] : 'adrian-tucicovenco'
  const currentEnv = match ? match[2] : 'main'

  const goToApps = (workspace: string, env: string) => {
    navigate(`/apps/${workspace}/${env}`)
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-[#262626] bg-[#111111] px-4">
      {/* Left section */}
      <div className="flex items-center gap-2">
        {/* Logo */}
        <div className="flex items-center">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M8 4L18 4L22 10L14 18L6 10L8 4Z" fill="#34d399" fillOpacity="0.8" />
            <path d="M6 10L14 18L10 24L2 18L6 10Z" fill="#34d399" fillOpacity="0.6" />
            <path d="M14 18L22 10L24 16L18 24L14 18Z" fill="#34d399" fillOpacity="0.5" />
          </svg>
        </div>

        {/* Workspace dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-white hover:bg-[#1f1f1f] transition-colors">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                {currentWorkspace[0].toUpperCase()}
              </span>
              <span className="font-medium">{currentWorkspace}</span>
              <span className="rounded border border-[#4a285a] bg-[#2e1c36] px-1.5 py-0.5 font-mono text-[11px] text-[#e879f9]">
                Starter
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="z-50 min-w-[200px] rounded-lg border border-[#262626] bg-[#161616] p-1 shadow-2xl" sideOffset={4}>
              {workspaceItems.map((w) => (
                <DropdownMenu.Item
                  key={w}
                  onClick={() => goToApps(w, currentEnv)}
                  className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-gray-300 outline-none hover:bg-[#1f1f1f] hover:text-white"
                >
                  {w}
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator className="mx-2 my-1 h-px bg-[#262626]" />
              <DropdownMenu.Item className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-gray-400 outline-none hover:bg-[#1f1f1f] hover:text-white">
                Upgrade workspace
              </DropdownMenu.Item>
              <DropdownMenu.Item className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-gray-400 outline-none hover:bg-[#1f1f1f] hover:text-white">
                Manage workspaces
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <span className="text-gray-600 mx-2">/</span>

        {/* Environment dropdown */}
        <Select.Root value={currentEnv} onValueChange={(env) => goToApps(currentWorkspace, env)}>
          <Select.Trigger className="flex items-center gap-1 text-sm font-mono text-gray-300 outline-none hover:text-white transition-colors">
            <Select.Value />
            <ChevronDown className="h-3 w-3 text-gray-500" />
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="z-50 min-w-[160px] rounded-lg border border-[#262626] bg-[#161616] p-1 shadow-2xl" position="popper" sideOffset={4}>
              <Select.Viewport>
                {environments.map((env) => (
                  <Select.Item key={env} value={env} className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-gray-300 outline-none hover:bg-[#1f1f1f] hover:text-white">
                    <Select.ItemText>{env}</Select.ItemText>
                    <Select.ItemIndicator className="ml-auto">
                      <Check className="h-3.5 w-3.5 text-mint" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
                <Select.Separator className="mx-2 my-1 h-px bg-[#262626]" />
                <Select.Item value="create" className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-400 outline-none hover:bg-[#1f1f1f] hover:text-white">
                  <span className="text-lg leading-none">+</span>
                  <Select.ItemText>Create environment</Select.ItemText>
                </Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Search bar */}
        <div className="flex w-[240px] items-center justify-between rounded border border-[#262626] bg-[#161616] px-3 py-1.5">
          <span className="text-xs text-gray-500">Search docs, apps...</span>
          <kbd className="rounded border border-[#333] px-1.5 py-0.5 font-mono text-[10px] text-gray-500">⌘K</kbd>
        </div>

        {/* Workspace metrics link */}
        <button
          className="text-xs font-medium text-gray-400 hover:text-white transition-colors cursor-pointer"
          onClick={() => {
            const url = new URL(window.location.href)
            url.searchParams.set('drawer', 'workspace-metrics')
            window.history.pushState({}, '', url.toString())
            window.dispatchEvent(new PopStateEvent('popstate'))
          }}
        >
          • Workspace metrics
        </button>

        {/* Credits pill */}
        <div className="flex items-center rounded-full border border-[#262626] bg-[#1a1a1a] px-3 py-1">
          <span className="text-xs font-medium text-gray-300">Credits $9.44 left</span>
        </div>

        {/* Notification bell */}
        <button className="text-gray-400 hover:text-white transition-colors">
          <Bell className="h-4 w-4" />
        </button>

        {/* Avatar with context menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-[11px] font-bold text-white outline-none hover:ring-2 hover:ring-white/20 transition-all">
              AT
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 min-w-[160px] rounded-lg border border-[#262626] bg-[#161616] p-1 shadow-2xl"
              sideOffset={6}
              align="end"
            >
              <DropdownMenu.Item
                onClick={() => navigate('/settings')}
                className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-gray-300 outline-none hover:bg-[#1f1f1f] hover:text-white"
              >
                Settings
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="mx-2 my-1 h-px bg-[#262626]" />
              <DropdownMenu.Item
                onClick={() => { logout(); navigate('/login') }}
                className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-red-400 outline-none hover:bg-[#1f1f1f]"
              >
                Log out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
