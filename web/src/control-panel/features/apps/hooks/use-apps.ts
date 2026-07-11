import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AppModel } from '@/control-panel/core/models/app.model';
import type { AppFilter, AppSortType } from '@/control-panel/core/use-cases/app-filter-sort.use-case';
import { AppFilterSortUseCase } from '@/control-panel/core/use-cases/app-filter-sort.use-case';
import { DashboardViewModel } from '@/control-panel/features/dashboard/view-models/dashboard.view-model';
import { appRepository } from '@/control-panel/features/apps/repositories/app.repository';

const filterSortUseCase = new AppFilterSortUseCase();

export function useDashboardApps(
  workspaceId: string,
  environmentId: string,
  filter: AppFilter,
  sort: AppSortType,
  query?: string,
) {
  const vm = useMemo(() => new DashboardViewModel(workspaceId, environmentId), [workspaceId, environmentId]);

  const { data, isLoading, error } = useQuery<AppModel[]>({
    queryKey: ['cp-apps', workspaceId, environmentId],
    queryFn: () => appRepository.list(workspaceId, environmentId),
    staleTime: 30000,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    let result = filterSortUseCase.execute(data, filter, sort);
    if (query?.trim()) {
      const q = query.toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().includes(q));
    }
    return result;
  }, [data, filter, sort, query]);

  return {
    apps: data ?? [],
    filteredApps: filtered,
    isLoading,
    error,
    vm,
  };
}

export function useLiveApps(apps: AppModel[]) {
  return useMemo(() => apps.filter((a) => a.status === 'active' || a.status === 'running'), [apps]);
}

export function useStoppedApps(apps: AppModel[]) {
  return useMemo(() => apps.filter((a) => a.status !== 'active' && a.status !== 'running'), [apps]);
}

export function useStopApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appRepository.stop(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cp-apps'] }),
  });
}

export function useDeleteApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appRepository.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cp-apps'] }),
  });
}
