import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode, type KeyboardEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Search,
  Activity,
  DollarSign,
  Cloud,
  FileText,
  Box,
  Key,
  Database,
  BookOpen,
  Settings,
} from 'lucide-react'

interface CommandItem {
  id: string
  category: 'Usage' | 'Navigation'
  label: string
  icon: ReactNode
  href?: string
  action?: () => void
  suffix?: string
}

interface CommandPaletteCtx {
  open: boolean
  setOpen: (v: boolean) => void
}

const Ctx = createContext<CommandPaletteCtx>({ open: false, setOpen: () => {} })

export function useCommandPalette() {
  return useContext(Ctx)
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <Ctx.Provider value={{ open, setOpen }}>
      {children}
      <CommandPaletteOverlay open={open} onClose={() => setOpen(false)} />
    </Ctx.Provider>
  )
}

function openWorkspaceMetrics() {
  const url = new URL(window.location.href)
  url.searchParams.set('drawer', 'workspace-metrics')
  window.history.pushState({}, '', url.toString())
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function CommandPaletteOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Build commands inline to capture latest location
  const commands: CommandItem[] = [
    {
      id: 'workspace-metrics',
      category: 'Usage',
      label: 'Workspace metrics',
      icon: <Activity className="h-4 w-4 text-gray-400" />,
      action: openWorkspaceMetrics,
    },
    {
      id: 'usage-billing',
      category: 'Usage',
      label: 'Usage & billing',
      icon: <DollarSign className="h-4 w-4 text-gray-400" />,
      href: '/billing',
    },
    {
      id: 'apps',
      category: 'Navigation',
      label: 'Apps',
      icon: <Cloud className="h-4 w-4 text-gray-400" />,
      action: () => {
        const m = location.pathname.match(/^\/apps\/([^/]+)\/([^/]+)/)
        navigate(`/apps/${m?.[1] || 'adrian-tucicovenco'}/${m?.[2] || 'main'}`)
      },
    },
    {
      id: 'logs',
      category: 'Navigation',
      label: 'Logs',
      icon: <FileText className="h-4 w-4 text-gray-400" />,
      action: () => {
        const m = location.pathname.match(/^\/(?:apps|logs|secrets|storage)\/([^/]+)\/([^/]+)/)
        navigate(`/logs/${m?.[1] || 'adrian-tucicovenco'}/${m?.[2] || 'main'}`)
      },
    },
    {
      id: 'containers',
      category: 'Navigation',
      label: 'Containers',
      icon: <Box className="h-4 w-4 text-gray-400" />,
      action: () => {},
    },
    {
      id: 'secrets',
      category: 'Navigation',
      label: 'Secrets',
      icon: <Key className="h-4 w-4 text-gray-400" />,
      action: () => {
        const m = location.pathname.match(/^\/(?:apps|logs|secrets|storage)\/([^/]+)\/([^/]+)/)
        navigate(`/secrets/${m?.[1] || 'adrian-tucicovenco'}/${m?.[2] || 'main'}`)
      },
    },
    {
      id: 'storage',
      category: 'Navigation',
      label: 'Storage',
      icon: <Database className="h-4 w-4 text-gray-400" />,
      action: () => {
        const m = location.pathname.match(/^\/(?:apps|logs|secrets|storage)\/([^/]+)\/([^/]+)/)
        navigate(`/storage/${m?.[1] || 'adrian-tucicovenco'}/${m?.[2] || 'main'}`)
      },
    },
    {
      id: 'notebooks',
      category: 'Navigation',
      label: 'Notebooks',
      icon: <BookOpen className="h-4 w-4 text-gray-400" />,
      action: () => {},
    },
    {
      id: 'settings',
      category: 'Navigation',
      label: 'Settings',
      icon: <Settings className="h-4 w-4 text-gray-400" />,
      href: '/settings',
    },
  ]

  const filtered = query.trim()
    ? commands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()),
      )
    : commands

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setQuery('')
    }
  }, [open])

  const execute = useCallback(
    (item: CommandItem) => {
      if (item.href) navigate(item.href)
      if (item.action) item.action()
      onClose()
    },
    [navigate, onClose],
  )

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) execute(filtered[selectedIndex])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!open) return null

  const usageItems = filtered.filter((c) => c.category === 'Usage')
  const navItems = filtered.filter((c) => c.category === 'Navigation')
  let globalIdx = 0
  const idxMap = new Map<number, CommandItem>()
  for (const item of filtered) {
    idxMap.set(globalIdx++, item)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[540px] max-w-full bg-[#161616] border border-[#262626] rounded-xl overflow-hidden shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="h-12 border-b border-[#262626] px-4 flex items-center gap-3 bg-[#161616]">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            ref={inputRef}
            className="bg-transparent border-0 outline-0 p-0 text-sm text-white font-sans tracking-wide w-full placeholder-gray-600"
            placeholder="Enter an ID or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Results */}
        <div className="py-2 max-h-[380px] overflow-y-auto">
          {usageItems.length > 0 && (
            <>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 pt-3 pb-1.5 block">
                Usage
              </span>
              {usageItems.map((item) => {
                const idx = Array.from(idxMap.entries()).find(
                  ([, v]) => v.id === item.id,
                )?.[0] ?? 0
                const isSelected = idx === selectedIndex
                return (
                  <button
                    key={item.id}
                    onClick={() => execute(item)}
                    className={`w-[calc(100%-16px)] mx-2 px-3 py-2 rounded-md flex items-center justify-between cursor-pointer transition-colors text-left ${
                      isSelected
                        ? 'bg-[#1f1f1f] text-white'
                        : 'bg-transparent hover:bg-[#1f1f1f] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {item.icon}
                      <span className="text-xs font-medium">{item.label}</span>
                    </span>
                  </button>
                )
              })}
            </>
          )}

          {navItems.length > 0 && (
            <>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 pt-3 pb-1.5 block">
                Navigation
              </span>
              {navItems.map((item) => {
                const idx = Array.from(idxMap.entries()).find(
                  ([, v]) => v.id === item.id,
                )?.[0] ?? 0
                const isSelected = idx === selectedIndex
                return (
                  <button
                    key={item.id}
                    onClick={() => execute(item)}
                    className={`w-[calc(100%-16px)] mx-2 px-3 py-2 rounded-md flex items-center justify-between cursor-pointer transition-colors text-left ${
                      isSelected
                        ? 'bg-[#1f1f1f] text-white'
                        : 'bg-transparent hover:bg-[#1f1f1f] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {item.icon}
                      <span className="text-xs font-medium">{item.label}</span>
                    </span>
                    {item.suffix && (
                      <span className="bg-[#222222] border border-[#262626] text-gray-500 font-sans text-[10px] font-medium px-2 py-0.5 rounded-full">
                        {item.suffix}
                      </span>
                    )}
                  </button>
                )
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="h-10 bg-[#111111]/40 border-t border-[#262626] px-4 flex items-center gap-4 text-[11px] font-sans text-gray-500 mt-2">
          <span className="flex items-center gap-1.5">
            <span className="text-gray-400 bg-[#1f1f1f] border border-[#262626] px-1 py-0.2 rounded font-mono text-[10px]">
              ↵
            </span>
            Open
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-gray-400 bg-[#1f1f1f] border border-[#262626] px-1 py-0.2 rounded font-mono text-[10px]">
              ↑↓
            </span>
            Select
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-gray-400 bg-[#1f1f1f] border border-[#262626] px-1 py-0.2 rounded font-mono text-[10px]">
              esc
            </span>
            Close
          </span>
        </div>
      </div>
    </div>
  )
}
