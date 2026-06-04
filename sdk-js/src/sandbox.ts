import { EventEmitter } from 'events';
import { Client } from './client.js';
import { ExecResult, SandboxMetrics } from './types.js';

export class Sandbox extends EventEmitter {
  private client: Client;
  private data: any;

  constructor(client: Client, data: any) {
    super();
    this.client = client;
    this.data = data;
  }

  get id(): string { return this.data.id; }
  get status(): string { return this.data.status; }
  get url(): string { return this.data.url; }
  get startedAt(): string | undefined { return this.data.started_at; }
  get finishedAt(): string | undefined { return this.data.finished_at; }
  get bootDurationMs(): number | undefined { return this.data.boot_duration_ms; }

  async exec(command: string, timeout?: number): Promise<ExecResult> {
    return this.client['request']('POST', `/api/sandboxes/${this.id}/exec`, { command, timeout });
  }

  async forward(port: number): Promise<string> {
    const data = await this.client['request']('POST', `/api/sandboxes/${this.id}/forward`, { port });
    return data.url;
  }

  async checkpoint(name: string): Promise<any> {
    return this.client['request']('POST', `/api/sandboxes/${this.id}/snapshot`, { name });
  }

  async stop(): Promise<void> {
    await this.client.deleteSandbox(this.id);
  }

  async metrics(): Promise<SandboxMetrics> {
    return this.client.getSandboxMetrics(this.id);
  }

  async attachSecrets(secretNames: string[]): Promise<void> {
    await this.client.attachSecrets(this.id, secretNames);
  }

  static async restore(snapshotKey: string): Promise<Sandbox> {
    throw new Error('restore not implemented');
  }
}
