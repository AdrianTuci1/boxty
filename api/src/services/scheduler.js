export class Scheduler {
  constructor(workerPool) {
    this.workerPool = workerPool;
  }

  selectWorker(resources = {}) {
    const healthy = this.workerPool.getHealthyWorkers ? this.workerPool.getHealthyWorkers() : Array.from(this.workerPool.workers.values());
    if (healthy.length === 0) return null;

    // Bin packing: sort by sandboxes_running asc, then pick first with enough resources
    const candidates = healthy
      .filter(w => {
        if (!w.capacity) return true; // unknown capacity = assume ok
        const cpuNeed = resources.cpu || 1;
        const memNeed = resources.memory || 1024;
        const gpuNeed = resources.gpu ? 1 : 0;
        const cpuAvail = (w.capacity.cpu_available != null) ? w.capacity.cpu_available : 999;
        const memAvail = (w.capacity.mem_avail_mb != null) ? w.capacity.mem_avail_mb : 999999;
        const gpuAvail = (w.capacity.gpu_avail != null) ? w.capacity.gpu_avail : 999;
        return cpuAvail >= cpuNeed && memAvail >= memNeed && gpuAvail >= gpuNeed;
      })
      .sort((a, b) => {
        const aRun = a.capacity?.sandboxes_running || 0;
        const bRun = b.capacity?.sandboxes_running || 0;
        return aRun - bRun;
      });

    return candidates[0] || null;
  }
}

export default function schedulerPlugin(app, opts, done) {
  const scheduler = new Scheduler(app.workerPool);
  app.decorate('scheduler', scheduler);
  done();
}
