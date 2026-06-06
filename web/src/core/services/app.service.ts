import type { AppModel } from '../models/app.model';
import { filterApps, sortApps, type AppFilter, type SortType } from '../use-cases';

export function getFilteredAndSortedApps(
  apps: AppModel[],
  filter: AppFilter,
  sort: SortType
): AppModel[] {
  const filtered = filterApps(apps, filter);
  return sortApps(filtered, sort);
}

export function getLiveApps(apps: AppModel[]): AppModel[] {
  return apps.filter((a) => a.status === 'active' || a.status === 'running');
}

export function getStoppedApps(apps: AppModel[]): AppModel[] {
  return apps.filter((a) => a.status !== 'active' && a.status !== 'running');
}

export function mergeAppsWithMocks(realApps: AppModel[], mockApps: AppModel[]): AppModel[] {
  const combined = [...realApps];
  for (const mock of mockApps) {
    if (!combined.find((a) => a.id === mock.id)) {
      combined.push(mock);
    }
  }
  return combined;
}

export function getUniqueDeployers(apps: AppModel[]): string[] {
  return [...new Set(apps.map((a) => a.deployerName).filter(Boolean))] as string[];
}
