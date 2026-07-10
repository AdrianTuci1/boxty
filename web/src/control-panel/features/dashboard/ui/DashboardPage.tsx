import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { AppCard } from '@/control-panel/features/apps/ui/AppCard';
import { FilterToolbar } from '@/control-panel/features/dashboard/ui/FilterToolbar';
import { useDashboardApps, useLiveApps, useStoppedApps } from '@/control-panel/features/apps/hooks/use-apps';
import type { AppFilterStatus, AppFilterType, AppSortType } from '@/control-panel/core/use-cases/app-filter-sort.use-case';

export default function DashboardPage() {
  const { workspace, environment } = useParams<{ workspace: string; environment: string }>();
  const [filterStatus, setFilterStatus] = useState<AppFilterStatus>('live');
  const [filterType, setFilterType] = useState<AppFilterType>(null);
  const [filterValue, setFilterValue] = useState<string | null>(null);
  const [sortType, setSortType] = useState<AppSortType>('recent');

  const filter = useMemo(
    () => ({
      status: filterStatus,
      filterType,
      filterValue,
    }),
    [filterStatus, filterType, filterValue],
  );

  const { filteredApps, apps, isLoading } = useDashboardApps(
    workspace || '',
    environment || '',
    filter,
    sortType,
  );

  const liveApps = useLiveApps(apps);
  const stoppedApps = useStoppedApps(apps);

  const deployers = useMemo(() => [...new Set(apps.map((a) => a.deployerName).filter(Boolean))], [apps]);
  const tags = useMemo(() => [...new Set(apps.map((a) => a.status).filter(Boolean))], [apps]);

  if (isLoading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="h-full flex flex-col">
      <FilterToolbar
        filterStatus={filterStatus}
        liveCount={liveApps.length}
        stoppedCount={stoppedApps.length}
        filterType={filterType}
        filterValue={filterValue}
        deployers={deployers}
        tags={tags}
        sortType={sortType}
        onStatusChange={setFilterStatus}
        onFilterSelect={(type, value) => {
          setFilterType(type);
          setFilterValue(value);
        }}
        onFilterClear={() => {
          setFilterType(null);
          setFilterValue(null);
        }}
        onSortChange={setSortType}
      />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full px-6 pb-6 pt-4 flex flex-col gap-4">
          {filteredApps.length === 0 ? (
            <EmptyState icon={Box} title="No apps to display" subtitle="Create your first app to see it here." />
          ) : (
            filteredApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                workspace={workspace!}
                environment={environment!}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
