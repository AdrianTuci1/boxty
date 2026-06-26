import type { AppModel } from '../models/app.model';

export type FilterType = 'deployer' | 'tag' | null;

export interface AppFilter {
  status: 'all' | 'live' | 'stopped';
  filterType: FilterType;
  filterValue: string | null;
}

export function filterApps(apps: AppModel[], filter: AppFilter): AppModel[] {
  let result = [...apps];

  // Status filter
  if (filter.status === 'live') {
    result = result.filter((a) => a.status === 'active' || a.status === 'running');
  } else if (filter.status === 'stopped') {
    result = result.filter((a) => a.status !== 'active' && a.status !== 'running');
  }

  // Search filter
  if (filter.filterType === 'deployer' && filter.filterValue) {
    result = result.filter((a) => a.deployerName === filter.filterValue);
  }
  if (filter.filterType === 'tag' && filter.filterValue) {
    result = result.filter((a) => a.status === filter.filterValue);
  }

  return result;
}
