import * as Select from '@radix-ui/react-select'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, Bell, Check, Coins } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCommandPalette } from './CommandPalette'

const workspaceItems = ['john-smith']
const environments = ['main', 'staging', 'production']

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const { setOpen } = useCommandPalette()

  // Parse workspace/environment and current page from URL
  const match = location.pathname.match(/^\/(apps|logs|secrets|storage)(\/([^/]+)\/([^/]+))/)
  const currentPage = match ? match[1] : 'apps'
  const currentWorkspace = match ? match[3] : 'john-smith'
  const currentEnv = match ? match[4] : 'main'

  const goToPage = (workspace: string, env: string) => {
    navigate(`/${currentPage}/${workspace}/${env}`)
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-[#262626] bg-[#111111] px-4">
      {/* Left section */}
      <div className="flex items-center gap-2">
        {/* Logo */}
        <div className="flex items-center">
          <img src="/boxty.svg" width="28" height="28" alt="boxty" />
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
                  onClick={() => goToPage(w, currentEnv)}
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
<Select.Root value={currentEnv} onValueChange={(env) => goToPage(currentWorkspace, env)}>
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
        {/* Search trigger */}
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          Search
          <kbd className="rounded border border-[#333] px-1 py-0.5 font-mono text-[10px] text-gray-500">⌘K</kbd>
        </button>

        {/* Workspace metrics link */}
        <button
          className="text-xs font-medium text-gray-400 hover:text-white transition-colors cursor-pointer"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('toggle-workspace-metrics'))
          }}
        >
          • Workspace metrics
        </button>

        {/* Credits dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center rounded-full border border-[#262626] bg-[#1a1a1a] px-3 py-1 hover:border-[#34d399]/30 transition-colors outline-none">
              <Coins className="h-3.5 w-3.5 text-[#34d399] mr-1.5" />
              <span className="text-xs font-medium text-gray-300">Credits $9.44 left</span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 w-[260px] rounded-lg border border-[#262626] bg-[#161616] shadow-2xl"
              sideOffset={6}
              align="end"
            >
              {/* Header */}
              <div className="px-4 pt-3 pb-2">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Credits balance</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold text-white tracking-tight">$9.44</span>
                  <span className="text-xs text-gray-500 font-medium">remaining</span>
                </div>
              </div>

              <DropdownMenu.Separator className="mx-2 h-px bg-[#262626]" />

              {/* Budget */}
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Budget</span>
                  <span className="text-xs text-gray-500 font-mono">$15 / mo</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#222222] overflow-hidden">
                  <div className="h-full w-[37%] rounded-full bg-white" />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-500 font-medium">$5.56 spent</span>
                  <span className="text-[10px] text-gray-500 font-medium">$9.44 left</span>
                </div>
              </div>

              <DropdownMenu.Separator className="mx-2 h-px bg-[#262626]" />

              {/* Credits */}
              <div className="px-4 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Credits</span>
                  <span className="text-xs text-gray-500 font-mono">500 / mo</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#222222] overflow-hidden">
                  <div className="h-full w-[68%] rounded-full bg-[#34d399]" />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-500 font-medium">340 used</span>
                  <span className="text-[10px] text-gray-500 font-medium">160 left</span>
                </div>
              </div>

              <DropdownMenu.Separator className="mx-2 h-px bg-[#262626]" />

              <div className="p-1 flex flex-col gap-0.5">
                <DropdownMenu.Item
                  onClick={() => navigate('/billing')}
                  className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-gray-300 outline-none hover:bg-[#1f1f1f] hover:text-white"
                >
                  View billing
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onClick={() => navigate('/pricing')}
                  className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-gray-300 outline-none hover:bg-[#1f1f1f] hover:text-white"
                >
                  View pricing
                </DropdownMenu.Item>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

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
              <DropdownMenu.Item
                onClick={() => navigate('/pricing')}
                className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm text-gray-300 outline-none hover:bg-[#1f1f1f] hover:text-white"
              >
                Pricing Plans
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
