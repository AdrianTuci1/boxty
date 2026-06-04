import fetch from 'node-fetch';

export class WorkerPool {
  constructor() {
    this.workers = new Map();
    this.HEALTH_TIMEOUT_MS = 30000;
    this.MAX_RETRIES = 3;
  }

  register(worker) {
    this.workers.set(worker.id, { ...worker, lastHeartbeat: Date.now(), status: 'active' });
  }

  heartbeat(id, data) {
    if (this.workers.has(id)) {
      const w = this.workers.get(id);
      w.lastHeartbeat = Date.now();
      w.capacity = data;
      w.status = 'active';
      this.workers.set(id, w);
    }
  }

  getHealthyWorkers() {
    const now = Date.now();
    return Array.from(this.workers.values()).filter(w => {
      return (now - (w.lastHeartbeat || 0)) < this.HEALTH_TIMEOUT_MS;
    });
  }

  selectWorker(resources = {}) {
    const healthy = this.getHealthyWorkers();
    for (const w of healthy) {
      const running = w.capacity?.sandboxes_running || 0;
      const max = w.capacity?.max_sandboxes || 10;
      if (running < max) return w;
    }
    return null;
  }

  async _requestWithRetry(fn) {
    let lastErr;
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 500));
      }
    }
    throw lastErr;
  }

  async startSandbox(workerId, payload) {
    return this._requestWithRetry(async () => {
      const w = this.workers.get(workerId);
      if (!w) throw new Error('Worker not found');
      const res = await fetch(`http://${w.host}:9001/sandboxes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`startSandbox failed: ${res.status}`);
      return res.json();
    });
  }

  async exec(workerId, sandboxId, command, timeout = 60) {
    return this._requestWithRetry(async () => {
      const w = this.workers.get(workerId);
      if (!w) throw new Error('Worker not found');
      const res = await fetch(`http://${w.host}:9001/sandboxes/${sandboxId}/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, timeout }),
      });
      if (!res.ok) throw new Error(`exec failed: ${res.status}`);
      return res.json();
    });
  }

  async stopSandbox(workerId, sandboxId) {
    return this._requestWithRetry(async () => {
      const w = this.workers.get(workerId);
      if (!w) throw new Error('Worker not found');
      const res = await fetch(`http://${w.host}:9001/sandboxes/${sandboxId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`stopSandbox failed: ${res.status}`);
    });
  }

  async snapshot(workerId, sandboxId, name) {
    return this._requestWithRetry(async () => {
      const w = this.workers.get(workerId);
      if (!w) throw new Error('Worker not found');
      const res = await fetch(`http://${w.host}:9001/sandboxes/${sandboxId}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error(`snapshot failed: ${res.status}`);
      return res.json();
    });
  }

  async restore(workerId, payload) {
    return this._requestWithRetry(async () => {
      const w = this.workers.get(workerId);
      if (!w) throw new Error('Worker not found');
      const res = await fetch(`http://${w.host}:9001/sandboxes/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`restore failed: ${res.status}`);
      return res.json();
    });
  }
}

export default function workerPoolPlugin(app, opts, done) {
  const pool = new WorkerPool();
  app.decorate('workerPool', pool);
  done();
}
