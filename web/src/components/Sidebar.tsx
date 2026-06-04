import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  Box,
  Server,
  CreditCard,
  KeyRound,
  Image,
  CalendarClock,
  HardDrive,
  Settings,
} from 'lucide-react'

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/workspaces', label: 'Workspaces', icon: Briefcase },
  { to: '/apps', label: 'Apps', icon: Box },
  { to: '/sandboxes', label: 'Sandboxes', icon: Server },
  { to: '/billing', label: 'Billing', icon: CreditCard },
  { to: '/secrets', label: 'Secrets', icon: KeyRound },
  { to: '/images', label: 'Images', icon: Image },
  { to: '/schedules', label: 'Schedules', icon: CalendarClock },
  { to: '/volumes', label: 'Volumes', icon: HardDrive },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  return (
    <aside className={`flex flex-col border-r bg-white dark:border-gray-800 dark:bg-gray-950 ${collapsed ? 'w-16' : 'w-56'}`}>
      <div className="flex h-14 items-center justify-center border-b px-4 dark:border-gray-800">
        <span className={`font-bold text-indigo-600 ${collapsed ? 'hidden' : 'block'}`}>Boxty</span>
        {!collapsed && <span className="ml-1 text-xl">B</span>}
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="ml-3">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
