import { describe, it, expect } from 'vitest';
import { CommandPaletteRegistry } from '@/control-panel/features/command-palette/services/command-palette.registry';
import type { ICommandPaletteCommand } from '@/control-panel/core/ports/command-palette.port';

function makeCommand(id: string, label: string, category: ICommandPaletteCommand['category']): ICommandPaletteCommand {
  return { id, label, category, icon: null, execute: () => {} };
}

describe('CommandPaletteRegistry', () => {
  it('registers and lists commands', () => {
    const registry = new CommandPaletteRegistry();
    registry.register(makeCommand('1', 'Open apps', 'Navigation'));
    expect(registry.list('').map((c) => c.id)).toEqual(['1']);
  });

  it('filters by query', () => {
    const registry = new CommandPaletteRegistry();
    registry.register(makeCommand('1', 'Open apps', 'Navigation'));
    registry.register(makeCommand('2', 'Billing', 'Usage'));
    const result = registry.list('bill');
    expect(result.map((c) => c.id)).toEqual(['2']);
  });

  it('unregisters a command', () => {
    const registry = new CommandPaletteRegistry();
    registry.register(makeCommand('1', 'Open apps', 'Navigation'));
    registry.unregister('1');
    expect(registry.list('')).toHaveLength(0);
  });
});
