import { authenticate } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryByPK, updateItem } from '../db/schema.js';

export default async function workerRoutes(app) {
  app.post('/register', { preHandler: [authenticateWorker] }, async (req, reply) => {
    const id = req.body.workerId || uuidv4();
    const item = {
      pk: `WORKER#${id}`,
      sk: 'META',
      id,
      host: req.body.host || req.ip,
      region: req.body.region,
      provider: req.body.provider,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    await putItem(item);
    app.workerPool.register(item);
    reply.status(201).send({ worker_id: id });
  });

  app.get('/', { preHandler: [authenticate] }, async (req, reply) => {
    const items = await queryByPK('WORKER#'); // nu merge direct
    // Simplu: returnăm din workerPool
    const workers = Array.from(app.workerPool.workers.values());
    reply.send(workers);
  });

  app.post('/:id/heartbeat', { preHandler: [authenticateWorker] }, async (req, reply) => {
    app.workerPool.heartbeat(req.params.id, req.body);
    await updateItem(`WORKER#${req.params.id}`, 'META', { last_heartbeat: Date.now() });
    reply.send({ ok: true });
  });
}
