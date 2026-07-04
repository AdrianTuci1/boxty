import { NavLink, useLocation } from 'react-router-dom'
import {
  Box,
  FileText,
  KeyRound,
  HardDrive,
} from 'lucide-react'
import { useMemo } from 'react'

export default function Sidebar() {
  const location = useLocation()

  const { workspace, environment } = useMemo(() => {
    const m = location.pathname.match(/^\/(?:apps|logs|secrets|storage)\/([^/]+)\/([^/]+)/)
    return {
      workspace: m?.[1] || 'john-smith',
      environment: m?.[2] || 'main',
    }
  }, [location.pathname])

  const allItems = [
    { to: `/apps/${workspace}/${environment}`, label: 'Apps', icon: Box },
    { to: `/logs/${workspace}/${environment}`, label: 'Logs', icon: FileText },
    { to: `/secrets/${workspace}/${environment}`, label: 'Secrets', icon: KeyRound },
    { to: `/storage/${workspace}/${environment}`, label: 'Storage', icon: HardDrive },
  ]

  return (
    <aside className="flex w-60 flex-col border-r border-[#262626] bg-[#111111] p-3">
      <nav className="flex flex-col gap-1">
        {allItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.label === 'Apps'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#1f1f1f] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#1f1f1f]/50'
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
