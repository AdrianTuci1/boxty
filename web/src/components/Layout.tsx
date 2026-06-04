import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, ChevronRight } from 'lucide-react'
import Sidebar from './Sidebar'

function breadcrumbsFromPath(path: string) {
  const parts = path.split('/').filter(Boolean)
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const crumbs = breadcrumbsFromPath(location.pathname)

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b bg-white px-4 dark:border-gray-800 dark:bg-gray-950">
          <button onClick={() => setCollapsed((c) => !c)} className="mr-4 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Menu className="h-5 w-5" />
          </button>
          <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            {crumbs.map((crumb, i) => (
              <span key={i} className="flex items-center">
                {i > 0 && <ChevronRight className="mx-1 h-4 w-4" />}
                <span>{crumb}</span>
              </span>
            ))}
          </nav>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
