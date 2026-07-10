import { describe, it, expect } from 'vitest';
import { AppFilterUseCase, AppSortUseCase, AppFilterSortUseCase, SORT_LABELS } from '../app-filter-sort.use-case';
import type { AppModel } from '../../models/app.model';

function makeApp(overrides: Partial<AppModel> & { name: string }): AppModel {
  const now = new Date();
  const base: AppModel = {
    id: overrides.name,
    name: overrides.name,
    workspaceId: 'ws',
    environmentId: 'env',
    status: 'active',
    type: 'function',
    deployerName: 'john-smith',
    functions: [],
    instances: [],
    createdAt: now,
    updatedAt: now,
  };
  return { ...base, ...overrides };
}

describe('AppFilterUseCase', () => {
  const useCase = new AppFilterUseCase();

  it('filters live apps', () => {
    const apps = [
      makeApp({ name: 'a', status: 'active' }),
      makeApp({ name: 'b', status: 'stopped' }),
      makeApp({ name: 'c', status: 'running' }),
    ];
    const result = useCase.execute(apps, { status: 'live', filterType: null, filterValue: null });
    expect(result.map((a) => a.name)).toEqual(['a', 'c']);
  });

  it('filters stopped apps', () => {
    const apps = [makeApp({ name: 'a' }), makeApp({ name: 'b', status: 'stopped' })];
    const result = useCase.execute(apps, { status: 'stopped', filterType: null, filterValue: null });
    expect(result.map((a) => a.name)).toEqual(['b']);
  });

  it('filters by deployer', () => {
    const apps = [
      makeApp({ name: 'a', deployerName: 'alice' }),
      makeApp({ name: 'b', deployerName: 'bob' }),
    ];
    const result = useCase.execute(apps, { status: 'all', filterType: 'deployer', filterValue: 'alice' });
    expect(result.map((a) => a.name)).toEqual(['a']);
  });

  it('returns all when status is all and no filter value', () => {
    const apps = [makeApp({ name: 'a' }), makeApp({ name: 'b', status: 'stopped' })];
    const result = useCase.execute(apps, { status: 'all', filterType: null, filterValue: null });
    expect(result.map((a) => a.name)).toEqual(['a', 'b']);
  });
});

describe('AppSortUseCase', () => {
  const useCase = new AppSortUseCase();

  it('sorts alphabetically', () => {
    const apps = [makeApp({ name: 'z' }), makeApp({ name: 'a' })];
    const result = useCase.execute(apps, 'alphabetical');
    expect(result.map((a) => a.name)).toEqual(['a', 'z']);
  });

  it('sorts newest by createdAt', () => {
    const apps = [
      makeApp({ name: 'old', createdAt: new Date('2024-01-01') }),
      makeApp({ name: 'new', createdAt: new Date('2024-02-01') }),
    ];
    const result = useCase.execute(apps, 'newest');
    expect(result.map((a) => a.name)).toEqual(['new', 'old']);
  });

  it('sorts by recent updatedAt by default', () => {
    const apps = [
      makeApp({ name: 'old', updatedAt: new Date('2024-01-01') }),
      makeApp({ name: 'recent', updatedAt: new Date('2024-02-01') }),
    ];
    const result = useCase.execute(apps, 'recent');
    expect(result.map((a) => a.name)).toEqual(['recent', 'old']);
  });
});

describe('AppFilterSortUseCase', () => {
  it('applies filter then sort', () => {
    const useCase = new AppFilterSortUseCase();
    const apps = [
      makeApp({ name: 'z', status: 'active' }),
      makeApp({ name: 'a', status: 'stopped' }),
      makeApp({ name: 'b', status: 'active' }),
    ];
    const result = useCase.execute(apps, { status: 'live', filterType: null, filterValue: null }, 'alphabetical');
    expect(result.map((a) => a.name)).toEqual(['b', 'z']);
  });
});

describe('SORT_LABELS', () => {
  it('contains labels for all sort types', () => {
    const types = ['recent', 'alphabetical', 'newest', 'oldest', 'activity'] as const;
    for (const type of types) {
      expect(SORT_LABELS[type]).toBeDefined();
    }
  });
});
