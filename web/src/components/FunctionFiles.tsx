import { useState, useMemo } from 'react'
import { Search, Copy, ChevronDown, ArrowUpDown, FileText, Folder } from 'lucide-react'

interface FileItem {
  name: string
  type: 'File' | 'Directory'
  lastModified: string
  size: string | null
}

const sortOptions = ['Alphabetical', 'Last modified', 'Size', 'Type'] as const

// Mock data matching the screenshot
const mockFiles: FileItem[] = [
  { name: '.bashrc', type: 'File', lastModified: 'about 5 years ago', size: '571 B' },
  { name: '.cache', type: 'Directory', lastModified: '9 months ago', size: null },
  { name: '.profile', type: 'File', lastModified: 'almost 7 years ago', size: '161 B' },
  { name: '.python_history', type: 'File', lastModified: 'about 1 year ago', size: '0 B' },
  { name: '.wget-hsts', type: 'File', lastModified: 'about 1 year ago', size: '169 B' },
  { name: 'pne_core', type: 'Directory', lastModified: 'about 1 month ago', size: null },
  { name: 'pne.py', type: 'File', lastModified: 'about 1 month ago', size: '12.3 KiB' },
  { name: 'r2-system', type: 'Directory', lastModified: 'about 1 month ago', size: null },
  { name: 'sentinel_legacy', type: 'Directory', lastModified: 'about 1 month ago', size: null },
]

export default function FunctionFiles() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<string>('Alphabetical')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [copied, setCopied] = useState(false)

  const filtered = useMemo(() => {
    let result = mockFiles.filter((f) =>
      f.name.toLowerCase().includes(search.toLowerCase()),
    )

    switch (sortBy) {
      case 'Alphabetical':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'Last modified':
        // Mock sort - in real app would parse dates
        result.sort((a, b) => a.lastModified.localeCompare(b.lastModified))
        break
      case 'Size':
        result.sort((a, b) => {
          if (a.size === null && b.size === null) return 0
          if (a.size === null) return 1
          if (b.size === null) return -1
          return a.size.localeCompare(b.size)
        })
        break
      case 'Type':
        result.sort((a, b) => a.type.localeCompare(b.type))
        break
    }

    return result
  }, [search, sortBy])

  const handleCopyPath = () => {
    navigator.clipboard.writeText('fastapi_app/root')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="text-gray-300">fastapi_app</span>
          <span className="text-gray-600">&gt;</span>
          <span className="text-gray-300">root</span>
          <button
            onClick={handleCopyPath}
            className="ml-1 p-1 hover:bg-[#1f1f1f] rounded transition-colors"
            title="Copy path"
          >
            <Copy className={`h-3.5 w-3.5 ${copied ? 'text-[#34d399]' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search files"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 bg-[#161616] text-gray-200 text-xs rounded-lg pl-9 pr-8 py-2 border border-[#262626] focus:outline-none focus:border-[#333] placeholder:text-gray-600"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-mono bg-[#111] px-1.5 py-0.5 rounded">
              /
            </kbd>
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span className="text-gray-500">Sort:</span>
              <span className="text-white">{sortBy}</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {showSortDropdown && (
              <>
                <div className="fixed inset-0" onClick={() => setShowSortDropdown(false)} />
                <div className="absolute right-0 mt-2 w-44 bg-[#1f1f1f] border border-[#262626] rounded-lg shadow-2xl z-10">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSortBy(opt)
                        setShowSortDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-xs first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        sortBy === opt
                          ? 'bg-[#262626] text-white'
                          : 'text-gray-400 hover:bg-[#262626] hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* File Table */}
      <div className="overflow-x-auto rounded-xl border border-[#262626]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#161616] text-gray-400 border-b border-[#262626]">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium w-32">Type</th>
              <th className="px-4 py-3 text-left font-medium w-40">Last modified</th>
              <th className="px-4 py-3 text-left font-medium w-28">Size</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((file) => (
              <tr
                key={file.name}
                className="border-b border-[#262626]/40 hover:bg-[#1f1f1f]/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {file.type === 'Directory' ? (
                      <Folder className="h-4 w-4 text-[#34d399] shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                    )}
                    <span className="font-mono text-gray-300">{file.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400">{file.type}</td>
                <td className="px-4 py-3 text-gray-400">{file.lastModified}</td>
                <td className="px-4 py-3 text-gray-300 font-mono">{file.size ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
