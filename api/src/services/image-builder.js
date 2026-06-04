export class ImageBuilder {
  constructor(workerPool) {
    this.workerPool = workerPool;
  }

  async build(userId, spec) {
    const worker = this.workerPool.selectWorker();
    if (!worker) throw new Error('No worker available');
    const res = await fetch(`http://${worker.host}:9004/images/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...spec, userId }),
    });
    return res.json();
  }

  async status(workerId, imageId) {
    const w = this.workerPool.workers.get(workerId);
    const res = await fetch(`http://${w.host}:9004/images/${imageId}/status`);
    return res.json();
  }
}

export default function imageBuilderPlugin(app, opts, done) {
  app.decorate('imageBuilder', new ImageBuilder(app.workerPool));
  done();
}
