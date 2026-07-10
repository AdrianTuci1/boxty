export interface ICommandPaletteCommand {
  id: string;
  category: 'Usage' | 'Navigation' | 'Action';
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  execute(): void;
}

export interface ICommandPaletteRegistry {
  register(command: ICommandPaletteCommand): void;
  unregister(id: string): void;
  list(query: string): ICommandPaletteCommand[];
}
