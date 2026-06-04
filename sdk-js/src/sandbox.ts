import { EventEmitter } from 'events';
import { Client } from './client.js';
import { ExecResult, SandboxMetrics } from './types.js';
import WebSocket from 'ws';

export class Sandbox extends EventEmitter {
  private client: Client;
  private data: any;
  private ws?: WebSocket;

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

  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    this._ensureWebSocket();
    return this;
  }

  private _ensureWebSocket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    const wsUrl = this.data.ws_url || `ws://localhost:9002/${this.id}`;
    this.ws = new WebSocket(wsUrl);
    this.ws.on('message', (data: Buffer) => {
      const msg = data.toString();
      try {
        const parsed = JSON.parse(msg);
        this.emit(parsed.event || 'stdout', parsed.data || parsed);
      } catch {
        this.emit('stdout', msg);
      }
    });
    this.ws.on('error', (err) => this.emit('error', err));
    this.ws.on('close', () => this.emit('exit', 0));
  }

  static async restore(snapshotKey: string): Promise<Sandbox> {
    throw new Error('restore not implemented');
  }
}
