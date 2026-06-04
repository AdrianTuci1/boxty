export class CapacityManager {
  constructor(cloudProvider, workerPool) {
    this.cloudProvider = cloudProvider;
    this.workerPool = workerPool;
    this.queue = [];
    this.provisioning = new Map();
  }

  enqueue(request) {
    this.queue.push({ ...request, enqueuedAt: Date.now() });
    this.processQueue();
  }

  async processQueue() {
    const pending = [];
    for (const req of this.queue) {
      const worker = this.workerPool.selectWorker(req.resources);
      if (worker) {
        try {
          await this.workerPool.startSandbox(worker.id, req.payload);
          if (req.resolve) req.resolve({ workerId: worker.id });
        } catch (err) {
          if (req.reject) req.reject(err);
        }
      } else {
        pending.push(req);
      }
    }
    this.queue = pending;

    if (this.queue.length > 0 && !this.provisioning.has('active')) {
      this.provisioning.set('active', true);
      try {
        await this._provisionAndRetry();
      } finally {
        this.provisioning.delete('active');
      }
    }
  }

  async _provisionAndRetry() {
    const info = await this.cloudProvider.launchWorker('aws', 'us-east-1', { instanceType: 't3.medium' });
    // Așteaptă înregistrarea worker-ului (poll 120s)
    for (let i = 0; i < 120; i++) {
      const worker = this.workerPool.workers.get(info.id);
      if (worker && worker.status === 'active') {
        await this.processQueue();
        return;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    console.error('CapacityManager: worker provisioning timeout', info.id);
  }
}

export default function capacityManagerPlugin(app, opts, done) {
  const cm = new CapacityManager(app.cloudProvider, app.workerPool);
  app.decorate('capacityManager', cm);
  done();
}
