import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { ReactNode } from 'react'

interface DocsLayoutProps {
  children: ReactNode
}

const topbarLinks = [
  { label: 'Guides', path: '/docs/guide/introduction' },
  { label: 'Examples', path: '/docs/examples' },
  { label: 'Reference', path: '/docs/reference' },
  { label: 'Playground', path: '/playground' },
]

const guideSidebarItems = [
  { label: 'Introduction', slug: 'introduction' },
]

export default function DocsLayout({ children }: DocsLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const isActiveTopbar = (path: string) => {
    if (path === '/docs/examples' || path === '/docs/reference') {
      return location.pathname.startsWith(path)
    }
    return location.pathname === path
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0a] text-gray-200">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-800 bg-[#0a0a0a] flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <Link to="/" className="text-xl font-bold text-white tracking-tight">
            Boxty Docs
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Guides
          </div>
          <ul className="space-y-1">
            {guideSidebarItems.map((item) => (
              <li key={item.slug}>
                <Link
                  to={`/docs/guide/${item.slug}`}
                  className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                    location.pathname === `/docs/guide/${item.slug}`
                      ? 'bg-gray-800 text-white font-medium'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between border-b border-gray-800 bg-[#0a0a0a] px-6 flex-shrink-0">
          <nav className="flex items-center gap-6">
            {topbarLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  isActiveTopbar(link.path)
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/docs/search')}
              className="flex items-center gap-2 rounded-md border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-gray-400 hover:border-gray-600 hover:text-white transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
              <kbd className="ml-2 hidden rounded bg-gray-800 px-1.5 py-0.5 text-xs font-mono text-gray-500 sm:inline">
                ⌘K
              </kbd>
            </button>
            <Link
              to="/apps/adrian-tucicovenco/main"
              className="rounded-md bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-500 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
