import { useState, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Folder, File, Copy, ArrowUpDown, Search } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

interface FileEntry {
  name: string
  type: 'directory' | 'file'
  modified: string
  size?: string
}

const exampleFiles: Record<string, FileEntry[]> = {
  '': [
    { name: '.locks', type: 'directory', modified: 'about 1 month ago' },
    { name: 'CACHEDIR.TAG', type: 'file', modified: 'about 1 month ago', size: '191 B' },
    { name: 'datasets--codeparrot--codeparrot-clean', type: 'directory', modified: 'about 1 month ago' },
    { name: 'datasets--HuggingFaceTB--cosmopedia-v2', type: 'directory', modified: 'about 1 month ago' },
    { name: 'datasets--HuggingFaceTB--smollm-corpus', type: 'directory', modified: 'about 1 month ago' },
    { name: 'datasets--open-web-math--open-web-math', type: 'directory', modified: 'about 1 month ago' },
    { name: 'models--HuggingFaceTB--SmolLM2-135M', type: 'directory', modified: 'about 1 month ago' },
  ],
  '/huggingface': [
    { name: 'hub', type: 'directory', modified: 'about 1 month ago' },
    { name: 'README.md', type: 'file', modified: 'about 1 month ago', size: '2.1 KiB' },
  ],
  '/huggingface/hub': [
    { name: '.locks', type: 'directory', modified: 'about 1 month ago' },
    { name: 'models--HuggingFaceTB--SmolLM2-135M', type: 'directory', modified: 'about 1 month ago' },
    { name: 'datasets--HuggingFaceTB--smollm-corpus', type: 'directory', modified: 'about 1 month ago' },
  ],
}

const tabs = ['Files', 'References'] as const

export default function VolumeDetailPage() {
  const { volumeName } = useParams<{ volumeName: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentPath = searchParams.get('path') || ''
  const [activeTab, setActiveTab] = useState<string>('Files')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('Alphabetical')

  const files: FileEntry[] = exampleFiles[currentPath] || []

  const filtered = useMemo(() => {
    let result = files.filter((f) =>
      f.name.toLowerCase().includes(search.toLowerCase()),
    )
    if (sortBy === 'Size') {
      result = [...result].sort((a, b) => {
        const sizeA = a.size ? parseFloat(a.size) : 0
        const sizeB = b.size ? parseFloat(b.size) : 0
        return sizeB - sizeA
      })
    }
    return result
  }, [files, search, sortBy])

  const breadcrumbs = useMemo(() => {
    const parts = currentPath.split('/').filter(Boolean)
    const crumbs = [{ label: volumeName || '', path: '' }]
    let accumulated = ''
    for (const part of parts) {
      accumulated += `/${part}`
      crumbs.push({ label: part, path: accumulated })
    }
    return crumbs
  }, [currentPath, volumeName])

  const navigateToDir = (dirName: string) => {
    const newPath = currentPath ? `${currentPath}/${dirName}` : `/${dirName}`
    setSearchParams({ path: newPath })
  }

  const navigateBreadcrumb = (path: string) => {
    if (path === '') {
      setSearchParams({})
    } else {
      setSearchParams({ path })
    }
  }

  return (
    <div className="h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full p-6">
      {/* Volume header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">{volumeName}</h1>

          {/* Metadata grid */}
          <div className="flex items-center gap-8 mt-3 py-1">
            <div>
              <span className="text-gray-500 text-[10px] uppercase tracking-wider mb-1 block">Type</span>
              <span className="text-white text-xs font-medium">Volume v1</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] uppercase tracking-wider mb-1 block">Created</span>
              <span className="text-gray-300 text-xs">about 1 month ago</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] uppercase tracking-wider mb-1 block">Last modified</span>
              <span className="text-gray-300 text-xs">about 1 month ago</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] uppercase tracking-wider mb-1 block">Size</span>
              <span className="text-white font-mono text-xs">12.6 GiB</span>
            </div>
            <div>
              <span className="text-gray-500 text-[10px] uppercase tracking-wider mb-1 block">Files & Folders</span>
              <span className="text-white font-mono text-xs">3736</span>
            </div>
          </div>
        </div>

        <button className="bg-red-950/10 border border-red-900/40 text-red-400 text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-red-950/30 transition-all">
          🗑 Delete
        </button>
      </div>

      {/* Tabs */}
      <div className="h-10 border-b border-[#262626] flex items-center gap-5 w-full mt-6 mb-4">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`relative h-full flex items-center text-xs font-medium transition-colors ${
              t === activeTab ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t}
            {t === activeTab && (
              <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#34d399]" />
            )}
          </button>
        ))}
      </div>

      {/* Explorer control bar */}
      <div className="flex items-center justify-between w-full mb-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-gray-600">&gt;</span>}
              <button
                onClick={() => navigateBreadcrumb(crumb.path)}
                className="hover:text-white transition-colors"
              >
                {crumb.label}
              </button>
            </span>
          ))}
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${volumeName}${currentPath}`,
              )
            }}
            className="text-gray-600 hover:text-gray-400 transition-colors ml-1"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>

        {/* Search + Sort */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#111111] border border-[#262626] rounded px-3 py-1.5 w-[200px] justify-between text-xs">
            <input
              className="bg-transparent outline-none text-gray-500 text-xs placeholder:text-gray-600 flex-1"
              placeholder="Search files"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-600" />
          </div>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="text-gray-500">Sort:</span>
                <span className="text-white font-medium">{sortBy}</span>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[140px] rounded-lg border border-[#262626] bg-[#1f1f1f] p-1 shadow-2xl"
                sideOffset={4}
              >
                {['Alphabetical', 'Size', 'Last modified'].map((opt) => (
                  <DropdownMenu.Item
                    key={opt}
                    onClick={() => setSortBy(opt)}
                    className={`flex cursor-pointer items-center rounded-md px-3 py-2 text-xs outline-none hover:bg-[#262626] ${
                      sortBy === opt ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {opt}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* File table */}
      <div className="w-full bg-[#161616]/30 border border-[#262626] rounded-xl overflow-hidden">
        <div className="flex bg-[#161616] text-gray-400 text-xs font-medium p-3 border-b border-[#262626]">
          <span className="flex-1">Name</span>
          <span className="w-24">Type</span>
          <span className="w-40">Last modified</span>
          <span className="w-24">Size</span>
        </div>

        {filtered.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center px-4 py-2.5 border-b border-[#262626]/40 last:border-b-0 hover:bg-[#1f1f1f]/60 transition-all text-xs"
          >
            <div className="flex-1 flex items-center gap-2">
              {entry.type === 'directory' ? (
                <Folder className="h-4 w-4 text-[#34d399] shrink-0" />
              ) : (
                <File className="h-4 w-4 text-gray-500 shrink-0" />
              )}
              {entry.type === 'directory' ? (
                <button
                  onClick={() => navigateToDir(entry.name)}
                  className="font-mono text-white hover:text-[#34d399] transition-colors text-left"
                >
                  {entry.name}
                </button>
              ) : (
                <span className="font-mono text-white">{entry.name}</span>
              )}
            </div>
            <span className="w-24 text-gray-400">
              {entry.type === 'directory' ? 'Directory' : 'File'}
            </span>
            <span className="w-40 text-gray-500">{entry.modified}</span>
            <span className="w-24 text-gray-300 font-mono">{entry.size || ''}</span>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}
