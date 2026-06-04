import fetch from 'node-fetch';

export class WorkerPool {
  constructor() {
    this.workers = new Map();
  }

  register(worker) {
    this.workers.set(worker.id, worker);
  }

  heartbeat(id, data) {
    if (this.workers.has(id)) {
      this.workers.get(id).lastHeartbeat = Date.now();
      this.workers.get(id).capacity = data;
    }
  }

  selectWorker(resources = {}) {
    for (const [id, w] of this.workers) {
      if (w.capacity && w.capacity.sandboxes_running < 10) {
        return w;
      }
    }
    return null;
  }

  async startSandbox(workerId, payload) {
    const w = this.workers.get(workerId);
    if (!w) throw new Error('Worker not found');
    const res = await fetch(`http://${w.host}:9001/sandboxes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  async exec(workerId, sandboxId, command, timeout = 60) {
    const w = this.workers.get(workerId);
    const res = await fetch(`http://${w.host}:9001/sandboxes/${sandboxId}/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, timeout }),
    });
    return res.json();
  }

  async stopSandbox(workerId, sandboxId) {
    const w = this.workers.get(workerId);
    await fetch(`http://${w.host}:9001/sandboxes/${sandboxId}`, { method: 'DELETE' });
  }

  async snapshot(workerId, sandboxId, name) {
    const w = this.workers.get(workerId);
    const res = await fetch(`http://${w.host}:9001/sandboxes/${sandboxId}/snapshot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return res.json();
  }

  async restore(workerId, payload) {
    const w = this.workers.get(workerId);
    const res = await fetch(`http://${w.host}:9001/sandboxes/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  }
}

export default function workerPoolPlugin(app, opts, done) {
  const pool = new WorkerPool();
  app.decorate('workerPool', pool);
  done();
}
