import { ClientOptions, SandboxOptions, ImageBuild, ScheduleOptions, Workspace, Environment, Secret, Deployment, Volume, UsageReport } from './types.js';
import { Sandbox } from './sandbox.js';
import { BoxtyError } from './errors.js';

export class Client {
  private apiKey: string;
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(options: ClientOptions = {}) {
    this.apiKey = options.apiKey || '';
    this.baseUrl = (options.baseUrl || 'https://api.boxty.dev').replace(/\/$/, '');
    this.headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new BoxtyError(`HTTP ${res.status}: ${await res.text()}`);
    }
    return res.json();
  }

  async createSandbox(options: SandboxOptions): Promise<Sandbox> {
    const data = await this.request('POST', '/api/sandboxes', options);
    return new Sandbox(this, data);
  }

  async listSandboxes(): Promise<Sandbox[]> {
    const data = await this.request('GET', '/api/sandboxes');
    return data.map((d: any) => new Sandbox(this, d));
  }

  async getSandbox(id: string): Promise<Sandbox> {
    const data = await this.request('GET', `/api/sandboxes/${id}`);
    return new Sandbox(this, data);
  }

  async deleteSandbox(id: string): Promise<void> {
    await this.request('DELETE', `/api/sandboxes/${id}`);
  }

  async buildImage(name: string, baseImage: string, commands: string[]): Promise<ImageBuild> {
    return this.request('POST', '/api/images/build', { name, baseImage, commands });
  }

  async listImages(): Promise<ImageBuild[]> {
    return this.request('GET', '/api/images');
  }

  async deleteImage(id: string): Promise<void> {
    await this.request('DELETE', `/api/images/${id}`);
  }

  async balance(): Promise<number> {
    const data = await this.request('GET', '/api/billing/balance');
    return data.balance || 0;
  }

  async usage(): Promise<UsageReport> {
    return this.request('GET', '/api/billing/usage');
  }

  async buyCredits(amount: number): Promise<string> {
    const data = await this.request('POST', '/api/billing/credits', { amount });
    return data.checkout_url;
  }

  async createSecret(name: string, value: string): Promise<Secret> {
    return this.request('POST', '/api/secrets', { name, value });
  }

  async listSecrets(): Promise<Secret[]> {
    return this.request('GET', '/api/secrets');
  }

  async deleteSecret(name: string): Promise<void> {
    await this.request('DELETE', `/api/secrets/${name}`);
  }

  async createSchedule(options: ScheduleOptions): Promise<any> {
    return this.request('POST', '/api/schedules', options);
  }

  async listSchedules(): Promise<any[]> {
    return this.request('GET', '/api/schedules');
  }

  async deleteSchedule(id: string): Promise<void> {
    await this.request('DELETE', `/api/schedules/${id}`);
  }

  async triggerSchedule(id: string): Promise<void> {
    await this.request('POST', `/api/schedules/${id}/trigger`);
  }

  async createVolume(name: string, sizeGb: number = 50): Promise<Volume> {
    return this.request('POST', '/api/volumes', { name, sizeGb });
  }

  async listVolumes(): Promise<Volume[]> {
    return this.request('GET', '/api/volumes');
  }

  async deleteVolume(id: string): Promise<void> {
    await this.request('DELETE', `/api/volumes/${id}`);
  }

  async mountVolume(volumeId: string, sandboxId: string, mountPath: string): Promise<any> {
    return this.request('POST', `/api/volumes/${volumeId}/mount`, { sandboxId, mountPath });
  }

  async unmountVolume(volumeId: string, sandboxId: string): Promise<any> {
    return this.request('POST', `/api/volumes/${volumeId}/unmount`, { sandboxId });
  }

  async createWorkspace(name: string, description?: string): Promise<Workspace> {
    return this.request('POST', '/api/workspaces', { name, description });
  }

  async listWorkspaces(): Promise<Workspace[]> {
    return this.request('GET', '/api/workspaces');
  }

  async getWorkspace(id: string): Promise<Workspace> {
    return this.request('GET', `/api/workspaces/${id}`);
  }

  async deleteWorkspace(id: string): Promise<void> {
    await this.request('DELETE', `/api/workspaces/${id}`);
  }

  async createEnvironment(workspaceId: string, name: string, type: string = 'development'): Promise<Environment> {
    return this.request('POST', '/api/environments', { workspaceId, name, type });
  }

  async listEnvironments(): Promise<Environment[]> {
    return this.request('GET', '/api/environments');
  }

  async createApp(workspaceId: string, envId: string, name: string, image: string, cpu: number, memory: number, gpu?: string, timeout?: number): Promise<any> {
    return this.request('POST', '/api/apps', { workspaceId, envId, name, image, cpu, memory, gpu, timeout });
  }

  async listApps(): Promise<any[]> {
    return this.request('GET', '/api/apps');
  }

  async getApp(id: string): Promise<any> {
    return this.request('GET', `/api/apps/${id}`);
  }

  async deleteApp(id: string): Promise<void> {
    await this.request('DELETE', `/api/apps/${id}`);
  }

  async stopApp(id: string): Promise<void> {
    await this.request('POST', `/api/apps/${id}/stop`);
  }

  async deployApp(id: string, options?: Partial<SandboxOptions>): Promise<Deployment> {
    return this.request('POST', `/api/apps/${id}/deploy`, options || {});
  }

  async getAppSandboxes(id: string): Promise<Sandbox[]> {
    const data = await this.request('GET', `/api/apps/${id}/sandboxes`);
    return data.map((d: any) => new Sandbox(this, d));
  }

  async getAppDeployments(id: string): Promise<Deployment[]> {
    return this.request('GET', `/api/apps/${id}/deployments`);
  }

  async getAppMetrics(id: string): Promise<any> {
    return this.request('GET', `/api/apps/${id}/metrics`);
  }

  async getAppUsage(id: string): Promise<UsageReport> {
    return this.request('GET', `/api/apps/${id}/usage`);
  }

  async getAppLogs(id: string): Promise<string[]> {
    return this.request('GET', `/api/apps/${id}/logs`);
  }

  async getSandboxMetrics(id: string): Promise<any> {
    return this.request('GET', `/api/sandboxes/${id}/metrics`);
  }

  async attachSecrets(sandboxId: string, secretNames: string[]): Promise<any> {
    return this.request('POST', `/api/secrets/attach/${sandboxId}`, { secretNames });
  }
}
