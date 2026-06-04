import { queryByPK, queryGSI } from '../db/schema.js';

export default async function adminRoutes(app) {
  app.get('/stats', async (req, reply) => {
    const workers = await queryByPK('WORKER#'); // nu merge direct
    // Simplu: numărăm din workerPool
    const workerCount = app.workerPool.workers.size;
    const healthy = app.workerPool.getHealthyWorkers ? app.workerPool.getHealthyWorkers().length : workerCount;
    reply.send({
      workers: workerCount,
      healthy_workers: healthy,
      sandboxes: 0,
      revenue: 0,
      uptime_seconds: process.uptime(),
    });
  });

  app.get('/cron/status', async (req, reply) => {
    reply.send({
      running: !!app.cronEngine?.interval,
      last_tick: Date.now(),
      queue_length: app.capacityManager?.queue?.length || 0,
    });
  });

  app.get('/health', async (req, reply) => {
    reply.send({ status: 'ok', uptime: process.uptime(), version: '1.0.0' });
  });
}
