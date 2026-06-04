export class CapacityManager {
  constructor() {
    this.queue = [];
  }

  enqueue(request) {
    this.queue.push(request);
  }

  async provisionIfNeeded(workerPool) {
    if (!workerPool.selectWorker()) {
      // Stub: would launch new spot instance
    }
  }
}

export default function capacityManagerPlugin(app, opts, done) {
  app.decorate('capacityManager', new CapacityManager());
  done();
}
