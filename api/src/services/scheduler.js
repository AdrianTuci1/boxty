export class Scheduler {
  constructor(workerPool) {
    this.workerPool = workerPool;
  }

  selectWorker(resources) {
    return this.workerPool.selectWorker(resources);
  }
}

export default function schedulerPlugin(app, opts, done) {
  const scheduler = new Scheduler(app.workerPool);
  app.decorate('scheduler', scheduler);
  done();
}
