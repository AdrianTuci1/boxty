import { useState } from 'react'
import { Search, XCircle, ChevronDown, ChevronRight, Check, ArrowLeft } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { FilterType } from '../core/use-cases/filter-apps.use-case'

export function SearchFilterDropdown({
  filterType,
  filterValue,
  deployers,
  tags,
  onSelectFilter,
  onClear,
}: {
  filterType: FilterType
  filterValue: string | null
  deployers: string[]
  tags: string[]
  onSelectFilter: (type: FilterType, value: string | null) => void
  onClear: () => void
}) {
  const filterLabel = filterType === 'deployer' ? 'deployed by' : filterType === 'tag' ? 'tag' : null
  const [submenu, setSubmenu] = useState<FilterType>(null)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const items: { label: string; key: FilterType }[] = [
    { label: 'Last deployed by', key: 'deployer' },
    { label: 'Tag', key: 'tag' },
  ]

  const dataMap: Record<string, string[]> = { deployer: deployers, tag: tags }
  const currentItems = submenu ? dataMap[submenu] || [] : []
  const filteredItems = currentItems.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setSubmenu(null)
      setSearch('')
    }
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenu.Trigger asChild>
        <button
          onClick={() => setOpen(true)}
          className={`w-[320px] bg-[#111111] border border-[#262626] rounded-md px-3 py-1.5 flex items-center gap-2 hover:border-[#3a3a3a] transition-colors ${
            filterType ? 'border-[#34d399]/30 ring-1 ring-[#34d399]/20' : ''
          }`}
        >
          <Search className="h-3.5 w-3.5 text-gray-500 shrink-0" />
          {filterType ? (
            <>
              <span className="text-xs text-gray-500 flex-1 text-left">
                Filter: <span className="text-gray-300">{filterLabel}</span>
                {filterValue && (
                  <span className="text-[#34d399] ml-0.5">{filterValue}</span>
                )}
              </span>
              <XCircle
                className="h-3 w-3 text-gray-500 hover:text-gray-300 shrink-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onClear()
                }}
              />
            </>
          ) : (
            <>
              <span className="text-xs text-gray-600 flex-1 text-left">Search or filter</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-gray-600 text-[11px] px-1 py-0.5 rounded border border-[#262626] leading-none">
                  /
                </span>
                <ChevronDown className="h-3 w-3 text-gray-500" />
              </div>
            </>
          )}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="start"
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="w-[320px] bg-[#1a1a1a] border border-[#262626] rounded-lg py-1 shadow-xl z-50 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
        >
          {submenu ? (
            <>
              {/* Back + Search header */}
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#262626]">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSubmenu(null)
                    setSearch('')
                  }}
                  className="text-gray-400 hover:text-white transition-colors shrink-0"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <Search className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-0 outline-none p-0 text-xs text-white placeholder-gray-600 flex-1"
                  placeholder={`Filter ${submenu}s...`}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
              {/* Items list */}
              <div className="max-h-[240px] overflow-y-auto">
                {filteredItems.map((item) => (
                  <div
                    key={item}
                    onClick={() => {
                      onSelectFilter(submenu, item)
                      setOpen(false)
                      setSubmenu(null)
                      setSearch('')
                    }}
                    className="text-xs text-gray-300 px-3 py-1.5 cursor-pointer hover:bg-[#262626] hover:text-white flex items-center justify-between outline-none rounded-sm mx-1"
                  >
                    <span className="capitalize">{item}</span>
                    {filterType === submenu && filterValue === item && (
                      <Check className="h-3 w-3 text-[#34d399]" />
                    )}
                  </div>
                ))}
                {filteredItems.length === 0 && (
                  <div className="text-xs text-gray-500 px-3 py-2 text-center">
                    No results
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {items.map(({ label, key }) => (
                <div
                  key={key}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSubmenu(key)
                    setSearch('')
                  }}
                  className="text-xs text-gray-300 px-3 py-1.5 cursor-pointer hover:bg-[#262626] hover:text-white flex items-center justify-between outline-none rounded-sm mx-1"
                >
                  <span>{label}</span>
                  {filterType === key && filterValue && (
                    <span className="text-gray-500 text-[11px]">{filterValue}</span>
                  )}
                  <ChevronRight className="h-3 w-3 text-gray-500" />
                </div>
              ))}
              {filterType && (
                <>
                  <div className="h-px bg-[#262626] my-1" />
                  <div
                    onClick={() => {
                      onClear()
                      setOpen(false)
                    }}
                    className="text-xs text-gray-400 px-3 py-1.5 cursor-pointer hover:bg-[#262626] hover:text-white outline-none rounded-sm mx-1"
                  >
                    Clear filter
                  </div>
                </>
              )}
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
