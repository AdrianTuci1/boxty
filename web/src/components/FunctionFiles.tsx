import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Copy, ChevronDown, ArrowUpDown, FileText, Folder } from 'lucide-react'
import { listVolumeEntries, type VolumeEntry } from '../api/volumes'
import EmptyState from './EmptyState'

const sortOptions = ['Alphabetical', 'Size', 'Type'] as const

export default function FunctionFiles({ volumeName }: { volumeName?: string }) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<string>('Alphabetical')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data: entries, isLoading } = useQuery({
    queryKey: ['volume-entries', volumeName],
    queryFn: () => volumeName ? listVolumeEntries(volumeName) : Promise.resolve([]),
    enabled: !!volumeName,
  })

  const files: VolumeEntry[] = entries || []

  const filtered = useMemo(() => {
    let result = files.filter((f) =>
      f.path.toLowerCase().includes(search.toLowerCase()),
    )

    switch (sortBy) {
      case 'Alphabetical':
        result.sort((a, b) => a.path.localeCompare(b.path))
        break
      case 'Size':
        result.sort((a, b) => {
          if (a.size === null && b.size === null) return 0
          if (a.size === null) return 1
          if (b.size === null) return -1
          return a.size - b.size
        })
        break
      case 'Type':
        result.sort((a, b) => a.entry_type.localeCompare(b.entry_type))
        break
    }
    return result
  }, [files, search, sortBy])

  const handleCopy = async (path: string) => {
    await navigator.clipboard.writeText(path)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-6">
      {/* Control Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center bg-[#111111] border border-[#262626] rounded-md px-3 py-1.5 w-[280px] justify-between text-xs">
          <input
            className="bg-transparent outline-none text-gray-500 text-xs placeholder:text-gray-600 flex-1"
            placeholder="Search files"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="h-3.5 w-3.5 shrink-0 text-gray-600" />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span className="text-gray-500">Sort:</span>
            <span className="text-white font-medium">{sortBy}</span>
            <ChevronDown className={`h-3 w-3 text-gray-500 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showSortDropdown && (
            <div className="absolute top-full right-0 mt-1 w-32 bg-[#1f1f1f] border border-[#262626] rounded-lg shadow-xl z-10 py-1">
              {sortOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setSortBy(opt)
                    setShowSortDropdown(false)
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#262626] transition-colors ${
                    sortBy === opt ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No files yet"
          subtitle="Files uploaded for this function will appear here."
        />
      ) : (
        <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
          <div className="flex bg-[#111111]/40 border-b border-[#262626] px-4 py-2.5 text-[11px] font-semibold tracking-wider text-gray-500">
            <span className="flex-1">Name</span>
            <span className="w-24">Type</span>
            <span className="w-24">Size</span>
            <span className="w-10" />
          </div>

          {filtered.map((entry) => (
            <div key={entry.path} className="flex items-center px-4 py-3 border-b border-[#262626]/40 hover:bg-[#1f1f1f]/20 transition-colors text-xs">
              <div className="flex-1 flex items-center gap-2">
                {entry.entry_type === 'directory' ? (
                  <Folder className="h-4 w-4 text-[#34d399] shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                )}
                <span className="font-mono text-white">{entry.path}</span>
              </div>
              <span className="w-24 text-gray-400">{entry.entry_type === 'directory' ? 'Directory' : 'File'}</span>
              <span className="w-24 text-gray-300 font-mono">{entry.size ? `${entry.size} B` : ''}</span>
              <div className="w-10 flex justify-center">
                <button
                  onClick={() => handleCopy(entry.path)}
                  className="text-gray-600 hover:text-gray-400 transition-colors"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {copied && (
        <div className="fixed bottom-4 right-4 bg-[#1f1f1f] border border-[#262626] text-white text-xs px-3 py-2 rounded-lg shadow-xl">
          Copied to clipboard!
        </div>
      )}
    </div>
  )
}
