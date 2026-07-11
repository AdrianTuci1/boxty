import type { AppModel } from '../models/app.model';

export type AppFilterStatus = 'all' | 'live' | 'stopped';
export type AppFilterType = 'deployer' | 'tag' | null;
export type AppSortType = 'recent' | 'alphabetical' | 'newest' | 'oldest' | 'activity';

export interface AppFilter {
  status: AppFilterStatus;
  filterType: AppFilterType;
  filterValue: string | null;
}

export class AppFilterUseCase {
  execute(apps: AppModel[], filter: AppFilter): AppModel[] {
    let result = [...apps];

    if (filter.status === 'live') {
      result = result.filter((a) => a.status === 'active' || a.status === 'running');
    } else if (filter.status === 'stopped') {
      result = result.filter((a) => a.status !== 'active' && a.status !== 'running');
    }

    if (filter.filterType === 'deployer' && filter.filterValue) {
      result = result.filter((a) => a.deployerName === filter.filterValue);
    }
    if (filter.filterType === 'tag' && filter.filterValue) {
      result = result.filter((a) => a.status === filter.filterValue);
    }

    return result;
  }
}

export const SORT_LABELS: Record<AppSortType, string> = {
  recent: 'Most recent',
  alphabetical: 'Alphabetical',
  newest: 'Newest',
  oldest: 'Oldest',
  activity: 'Activity',
};

export class AppSortUseCase {
  execute(apps: AppModel[], sort: AppSortType): AppModel[] {
    const sorted = [...apps];
    switch (sort) {
      case 'alphabetical':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case 'activity':
      case 'recent':
      default:
        sorted.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        break;
    }
    return sorted;
  }
}

export class AppFilterSortUseCase {
  constructor(
    private filterUseCase = new AppFilterUseCase(),
    private sortUseCase = new AppSortUseCase(),
  ) {}

  execute(apps: AppModel[], filter: AppFilter, sort: AppSortType): AppModel[] {
    const filtered = this.filterUseCase.execute(apps, filter);
    return this.sortUseCase.execute(filtered, sort);
  }
}
