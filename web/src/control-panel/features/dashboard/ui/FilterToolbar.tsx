import { Cloud, XCircle, ScrollText } from 'lucide-react';
import { SearchFilterDropdown } from '@/components/SearchFilterDropdown';
import { SortDropdown } from '@/components/SortDropdown';
import type { AppFilterStatus } from '@/control-panel/core/use-cases/app-filter-sort.use-case';
import type { AppFilterType, AppSortType } from '@/control-panel/core/use-cases/app-filter-sort.use-case';

interface FilterToolbarProps {
  filterStatus: AppFilterStatus;
  liveCount: number;
  stoppedCount: number;
  filterType: AppFilterType;
  filterValue: string | null;
  deployers: string[];
  tags: string[];
  sortType: AppSortType;
  onStatusChange: (status: AppFilterStatus) => void;
  onFilterSelect: (type: AppFilterType, value: string | null) => void;
  onFilterClear: () => void;
  onSortChange: (sort: AppSortType) => void;
}

function FilterPill({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-[#142920] border border-[#1e3f31] text-[#34d399]'
          : 'bg-[#161616] border border-[#262626] text-gray-400 hover:text-gray-200 cursor-pointer'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      <span className={`px-1.5 py-0.5 rounded-full text-[11px] ${active ? 'bg-[#1b3a2b] text-[#34d399]' : 'bg-[#222222] text-gray-500'}`}>
        {count}
      </span>
    </button>
  );
}

export function FilterToolbar({
  filterStatus,
  liveCount,
  stoppedCount,
  filterType,
  filterValue,
  deployers,
  tags,
  sortType,
  onStatusChange,
  onFilterSelect,
  onFilterClear,
  onSortChange,
}: FilterToolbarProps) {
  return (
    <div className="shrink-0 bg-[#111111]">
      <div className="max-w-6xl mx-auto w-full px-6 pt-6 pb-4">
        <h1 className="text-[26px] font-semibold text-white tracking-tight mb-5">Apps</h1>

        <div className="flex items-center justify-between w-full mb-4">
          <div className="flex items-center gap-2">
            <FilterPill
              active={filterStatus === 'live'}
              onClick={() => onStatusChange('live')}
              icon={Cloud}
              label="Live Apps"
              count={liveCount}
            />
            <FilterPill
              active={filterStatus === 'stopped'}
              onClick={() => onStatusChange('stopped')}
              icon={XCircle}
              label="Stopped Apps"
              count={stoppedCount}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs font-medium flex items-center gap-1.5">
              <ScrollText className="h-3.5 w-3.5" />
              Quickstart guide
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between w-full">
          <SearchFilterDropdown
            filterType={filterType}
            filterValue={filterValue}
            deployers={deployers}
            tags={tags}
            onSelectFilter={onFilterSelect}
            onClear={onFilterClear}
          />
          <SortDropdown sortType={sortType} onSelect={onSortChange} />
        </div>
      </div>
    </div>
  );
}
