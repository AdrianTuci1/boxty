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
    // Extrage cerințele de resurse din primul request din coadă
    const first = this.queue[0];
    const cpu = first?.resources?.cpu || 2;
    const memory = first?.resources?.memory || 4096;
    const gpu = first?.resources?.gpu || null;
    const provider = process.env.DEFAULT_CLOUD_PROVIDER || 'aws';
    const region = process.env.DEFAULT_REGION || 'us-east-1';
    const gpuLabel = gpu ? ` GPU=${gpu}` : '';
    console.log(`CapacityManager: provisioning worker — ${cpu}vCPU / ${memory}MB${gpuLabel} → ${provider}/${region}`);
    const info = await this.cloudProvider.launchWorker(provider, region, { cpu, memory, gpu });
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
