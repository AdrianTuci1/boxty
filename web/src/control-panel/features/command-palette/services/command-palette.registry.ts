import type { ICommandPaletteCommand } from '@/control-panel/core/ports/command-palette.port';

export class CommandPaletteRegistry {
  private commands: Map<string, ICommandPaletteCommand> = new Map();

  register(command: ICommandPaletteCommand): void {
    this.commands.set(command.id, command);
  }

  unregister(id: string): void {
    this.commands.delete(id);
  }

  list(query: string): ICommandPaletteCommand[] {
    const all = Array.from(this.commands.values());
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter((c) => c.label.toLowerCase().includes(q));
  }

  get(id: string): ICommandPaletteCommand | undefined {
    return this.commands.get(id);
  }

  clear(): void {
    this.commands.clear();
  }
}

export const commandPaletteRegistry = new CommandPaletteRegistry();
