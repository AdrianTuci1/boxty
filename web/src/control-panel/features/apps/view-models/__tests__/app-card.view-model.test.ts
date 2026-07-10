import { describe, it, expect } from 'vitest';
import { AppCardViewModel } from '@/control-panel/features/apps/view-models/app-card.view-model';
import type { AppModel } from '@/control-panel/core/models/app.model';

function makeApp(overrides: Partial<AppModel> = {}): AppModel {
  const now = new Date();
  return {
    id: 'app-1',
    name: 'my-app',
    workspaceId: 'ws',
    environmentId: 'env',
    status: 'active',
    type: 'function',
    deployerName: 'alice',
    functions: ['fn1'],
    instances: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('AppCardViewModel', () => {
  it('computes owner initial', () => {
    const vm = new AppCardViewModel(makeApp({ deployerName: 'bob' }), 'ws', 'env');
    expect(vm.ownerInitial).toBe('B');
  });

  it('detects sandbox', () => {
    const vm = new AppCardViewModel(makeApp({ type: 'sandbox' }), 'ws', 'env');
    expect(vm.isSandbox).toBe(true);
  });

  it('generates default instance when empty', () => {
    const vm = new AppCardViewModel(makeApp({ instances: [] }), 'ws', 'env');
    expect(vm.displayInstances).toHaveLength(1);
    expect(vm.displayInstances[0].name).toBe('my-app');
  });

  it('generates GPU badge for instance', () => {
    const vm = new AppCardViewModel(
      makeApp({ instances: [{ id: 'i1', appId: 'app-1', name: 'fn1', cpu: 1, memory: 512, gpu: 't4', minContainers: 0, maxContainers: 1, scaledownWindow: 300, runningContainers: 1, status: 'active', createdAt: new Date() }] }),
      'ws',
      'env',
    );
    const badges = vm.getBadgesForInstance(vm.displayInstances[0]);
    expect(badges[0].variant).toBe('gpu');
  });
});
