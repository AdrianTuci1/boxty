import { Check, ChevronDown } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { SORT_LABELS, type SortType } from '../core/use-cases/sort-apps.use-case'

export function SortDropdown({
  sortType,
  onSelect,
}: {
  sortType: SortType
  onSelect: (type: SortType) => void
}) {
  const sortOptions: SortType[] = ['recent', 'alphabetical', 'newest', 'oldest', 'activity']

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity">
          <span className="text-gray-500">Sort By:</span>
          <span className="text-white font-medium">{SORT_LABELS[sortType]}</span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className="bg-[#1a1a1a] border border-[#262626] rounded-lg py-1 min-w-[160px] shadow-xl z-50"
        >
          {sortOptions.map((option) => (
            <DropdownMenu.Item
              key={option}
              onClick={() => onSelect(option)}
              className="text-xs text-gray-300 px-3 py-1.5 cursor-pointer hover:bg-[#262626] hover:text-white flex items-center justify-between outline-none rounded-sm mx-1"
            >
              <span>{SORT_LABELS[option]}</span>
              {sortType === option && <Check className="h-3 w-3 text-[#34d399]" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
