import { describe, it, expect, vi } from 'vitest';
import { NavigationCommandFactory } from '../navigation-command.factory';

describe('NavigationCommandFactory', () => {
  const navigate = vi.fn();

  it('navigates to apps with scope from current path', () => {
    const factory = new NavigationCommandFactory(navigate, '/apps/acme/prod');
    const commands = factory.all();
    const apps = commands.find((c) => c.id === 'nav-apps');
    expect(apps).toBeDefined();
    apps!.execute();
    expect(navigate).toHaveBeenCalledWith('/apps/acme/prod');
  });

  it('uses default scope when path is outside explorer', () => {
    const factory = new NavigationCommandFactory(navigate, '/billing');
    const commands = factory.all();
    const storage = commands.find((c) => c.id === 'nav-storage');
    storage!.execute();
    expect(navigate).toHaveBeenCalledWith('/storage/john-smith/main');
  });
});
