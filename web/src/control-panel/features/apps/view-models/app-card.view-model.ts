import type { AppModel } from '@/control-panel/core/models/app.model';
import type { InstanceConfigModel } from '@/control-panel/core/models/app.model';

export interface AppBadge {
  label: string;
  variant: 'cpu' | 'gpu' | 'web' | 'sandbox' | 'status';
}

export class AppCardViewModel {
  constructor(
    public app: AppModel,
    private workspace: string,
    private environment: string,
  ) {}

  get route(): string {
    return `/apps/${this.workspace}/${this.environment}/${this.app.id}`;
  }

  get ownerInitial(): string {
    return (this.app.deployerName || this.workspace || 'A')[0].toUpperCase();
  }

  get isSandbox(): boolean {
    return this.app.type === 'sandbox';
  }

  get displayInstances(): InstanceConfigModel[] {
    if (this.app.instances.length > 0) return this.app.instances;
    return [{
      id: this.app.id,
      appId: this.app.id,
      name: this.app.name,
      cpu: 1,
      memory: 512,
      gpu: null,
      minContainers: 1,
      maxContainers: 1,
      scaledownWindow: 300,
      runningContainers: 1,
      status: this.app.status === 'active' || this.app.status === 'running' ? 'active' : 'stopped',
      createdAt: this.app.createdAt,
    }];
  }

  get displayFunctions(): string[] {
    if (this.app.functions && this.app.functions.length > 0) return this.app.functions;
    return ['fastapi_app'];
  }

  getBadgesForInstance(inst: InstanceConfigModel): AppBadge[] {
    const badges: AppBadge[] = [];
    if (inst.gpu) {
      badges.push({ label: `${inst.gpu.toUpperCase()} GPU`, variant: 'gpu' });
    } else {
      badges.push({ label: 'CPU', variant: 'cpu' });
    }
    return badges;
  }

  getBadgesForFunction(fn: string): AppBadge[] {
    const inst = this.app.instances.find((i) => i.name === fn);
    return this.getBadgesForInstance(inst ?? this.displayInstances[0]);
  }

  getSandboxBadge(): AppBadge {
    return { label: 'Sandbox', variant: 'sandbox' };
  }

  getWebBadge(): AppBadge {
    return { label: 'Web Function', variant: 'web' };
  }
}
