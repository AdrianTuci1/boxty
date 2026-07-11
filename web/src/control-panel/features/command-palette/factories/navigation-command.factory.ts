import type { ICommandPaletteCommand } from '@/control-panel/core/ports/command-palette.port';

export class NavigationCommandFactory {
  constructor(private navigate: (path: string) => void, private currentPath: string) {}

  private extractScope(): { workspace: string; environment: string } {
    const m = this.currentPath.match(/^\/(?:apps|logs|secrets|storage|volumes|images|schedules)\/([^/]+)\/([^/]+)/);
    return {
      workspace: m?.[1] || 'john-smith',
      environment: m?.[2] || 'main',
    };
  }

  private nav(path: string): ICommandPaletteCommand['execute'] {
    return () => this.navigate(path);
  }

  all(): ICommandPaletteCommand[] {
    const { workspace, environment } = this.extractScope();
    const scope = { workspace, environment };

    return [
      this.apps(scope),
      this.logs(scope),
      this.secrets(scope),
      this.storage(scope),
      this.settings(),
    ];
  }

  private apps(scope: { workspace: string; environment: string }): ICommandPaletteCommand {
    return {
      id: 'nav-apps',
      category: 'Navigation',
      label: 'Apps',
      icon: null as unknown as React.ReactNode,
      execute: this.nav(`/apps/${scope.workspace}/${scope.environment}`),
    };
  }

  private logs(scope: { workspace: string; environment: string }): ICommandPaletteCommand {
    return {
      id: 'nav-logs',
      category: 'Navigation',
      label: 'Logs',
      icon: null as unknown as React.ReactNode,
      execute: this.nav(`/logs/${scope.workspace}/${scope.environment}`),
    };
  }

  private secrets(scope: { workspace: string; environment: string }): ICommandPaletteCommand {
    return {
      id: 'nav-secrets',
      category: 'Navigation',
      label: 'Secrets',
      icon: null as unknown as React.ReactNode,
      execute: this.nav(`/secrets/${scope.workspace}/${scope.environment}`),
    };
  }

  private storage(scope: { workspace: string; environment: string }): ICommandPaletteCommand {
    return {
      id: 'nav-storage',
      category: 'Navigation',
      label: 'Storage',
      icon: null as unknown as React.ReactNode,
      execute: this.nav(`/storage/${scope.workspace}/${scope.environment}`),
    };
  }

  private settings(): ICommandPaletteCommand {
    return {
      id: 'nav-settings',
      category: 'Navigation',
      label: 'Settings',
      icon: null as unknown as React.ReactNode,
      execute: this.nav('/settings'),
    };
  }
}
