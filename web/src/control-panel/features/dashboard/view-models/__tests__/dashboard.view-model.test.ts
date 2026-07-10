import { describe, it, expect } from 'vitest';
import { DashboardViewModel } from '../dashboard.view-model';
import type { AppModel } from '@/control-panel/core/models/app.model';

function makeApp(overrides: Partial<AppModel> = {}): AppModel {
  const now = new Date();
  return {
    id: 'app-1',
    workspaceId: 'ws',
    environmentId: 'env',
    status: 'active',
    type: 'function',
    deployerName: 'alice',
    functions: [],
    instances: [],
    createdAt: now,
    updatedAt: now,
    name: 'default',
    ...overrides,
  };
}

describe('DashboardViewModel', () => {
  const vm = new DashboardViewModel('ws', 'env');

  it('extracts route params', () => {
    expect(vm.getRouteParams()).toEqual({ workspaceId: 'ws', environmentId: 'env' });
  });

  it('collects unique deployers', () => {
    const apps = [makeApp({ name: 'a', deployerName: 'alice' }), makeApp({ name: 'b', deployerName: 'bob' })];
    expect(vm.getUniqueDeployers(apps).sort()).toEqual(['alice', 'bob']);
  });

  it('filters by query', () => {
    const apps = [makeApp({ name: 'alpha' }), makeApp({ name: 'beta' })];
    const result = vm.applyFilterAndSort(apps, {
      filterStatus: 'all',
      filterType: null,
      filterValue: null,
      sort: 'alphabetical',
      query: 'alp',
    });
    expect(result.map((a) => a.name)).toEqual(['alpha']);
  });
});
