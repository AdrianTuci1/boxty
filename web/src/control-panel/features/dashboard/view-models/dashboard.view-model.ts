import type { AppModel } from '@/control-panel/core/models/app.model';
import type { AppFilter, AppFilterStatus, AppFilterType, AppSortType } from '@/control-panel/core/use-cases/app-filter-sort.use-case';
import { AppFilterSortUseCase } from '@/control-panel/core/use-cases/app-filter-sort.use-case';

export interface DashboardViewState {
  filterStatus: AppFilterStatus;
  filterType: AppFilterType;
  filterValue: string | null;
  sort: AppSortType;
  query: string;
}

export class DashboardViewModel {
  private filterSort = new AppFilterSortUseCase();

  constructor(
    private workspaceId: string,
    private environmentId: string,
  ) {}

  getRouteParams(): { workspaceId: string; environmentId: string } {
    return { workspaceId: this.workspaceId, environmentId: this.environmentId };
  }

  buildFilter(state: DashboardViewState): AppFilter {
    return {
      status: state.filterStatus,
      filterType: state.filterType,
      filterValue: state.filterValue,
    };
  }

  applyFilterAndSort(apps: AppModel[], state: DashboardViewState): AppModel[] {
    const filter = this.buildFilter(state);
    let result = this.filterSort.execute(apps, filter, state.sort);
    if (state.query.trim()) {
      const q = state.query.toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().includes(q));
    }
    return result;
  }

  getUniqueDeployers(apps: AppModel[]): string[] {
    return [...new Set(apps.map((a) => a.deployerName).filter(Boolean))];
  }

  getUniqueStatuses(apps: AppModel[]): AppModel['status'][] {
    return [...new Set(apps.map((a) => a.status).filter(Boolean))];
  }
}
