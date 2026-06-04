import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryByPK, deleteItem, updateItem } from '../db/schema.js';

export default async function sandboxRoutes(app) {
  app.post('/', async (req, reply) => {
    const id = uuidv4();
    const userId = req.user?.id || 'anon';
    const item = {
      pk: `SANDBOX#${id}`,
      sk: 'META',
      id,
      user_id: userId,
      image: req.body.image,
      cpu: req.body.cpu || 1,
      memory: req.body.memory || 1024,
      gpu: req.body.gpu || null,
      timeout: req.body.timeout || 3600,
      disk_size_gb: req.body.disk_size_gb || 10,
      status: 'running',
      created_at: new Date().toISOString(),
    };
    await putItem(item);
    await putItem({ pk: `USER_SANDBOXES#${userId}`, sk: item.created_at, sandbox_id: id });
    await putItem({ pk: 'STATUS#running', sk: item.created_at, sandbox_id: id });
    const worker = app.scheduler.selectWorker(req.body);
    if (worker) {
      await app.workerPool.startSandbox(worker.id, { sandboxId: id, ...req.body });
      item.worker_id = worker.id;
      await updateItem(`SANDBOX#${id}`, 'META', { worker_id: worker.id });
    }
    reply.status(201).send(item);
  });

  app.get('/', async (req, reply) => {
    const userId = req.user?.id || 'anon';
    const items = await queryByPK(`USER_SANDBOXES#${userId}`);
    const sandboxes = [];
    for (const it of items) {
      const sb = await getItem(`SANDBOX#${it.sandbox_id}`, 'META');
      if (sb) sandboxes.push(sb);
    }
    reply.send(sandboxes);
  });

  app.get('/:id', async (req, reply) => {
    const sb = await getItem(`SANDBOX#${req.params.id}`, 'META');
    if (!sb) return reply.status(404).send({ error: 'Not found' });
    reply.send(sb);
  });

  app.delete('/:id', async (req, reply) => {
    const sb = await getItem(`SANDBOX#${req.params.id}`, 'META');
    if (!sb) return reply.status(404).send({ error: 'Not found' });
    if (sb.worker_id) {
      await app.workerPool.stopSandbox(sb.worker_id, req.params.id);
    }
    await updateItem(`SANDBOX#${req.params.id}`, 'META', { status: 'stopped', finished_at: new Date().toISOString() });
    await deleteItem('STATUS#running', sb.created_at);
    await putItem({ pk: 'STATUS#stopped', sk: sb.created_at, sandbox_id: req.params.id });
    reply.send({ status: 'stopped' });
  });

  app.post('/:id/snapshot', async (req, reply) => {
    const sb = await getItem(`SANDBOX#${req.params.id}`, 'META');
    if (!sb) return reply.status(404).send({ error: 'Not found' });
    const name = req.body.name || `snap-${Date.now()}`;
    const res = await app.workerPool.snapshot(sb.worker_id, req.params.id, name);
    await putItem({ pk: `SANDBOX#${req.params.id}`, sk: `SNAPSHOT#${name}`, ...res, created_at: new Date().toISOString() });
    reply.send({ snapshot: name, ...res });
  });

  app.post('/restore', async (req, reply) => {
    const { snapshotKey, image, cpu, memory, gpu, secrets } = req.body;
    const id = uuidv4();
    const worker = app.scheduler.selectWorker({ cpu, memory, gpu });
    if (!worker) return reply.status(503).send({ error: 'No workers' });
    const res = await app.workerPool.restore(worker.id, { sandboxId: id, snapshotKey, image, cpu, memory, gpu, secrets });
    reply.status(201).send({ id, ...res });
  });

  app.post('/:id/forward', async (req, reply) => {
    const { port } = req.body;
    const sb = await getItem(`SANDBOX#${req.params.id}`, 'META');
    if (!sb) return reply.status(404).send({ error: 'Not found' });
    const url = `https://${req.params.id}-${port}.boxty.dev`;
    reply.send({ url });
  });

  app.get('/:id/metrics', async (req, reply) => {
    const metrics = await queryByPK(`SANDBOX#${req.params.id}`, { ScanIndexForward: false, Limit: 100 });
    reply.send(metrics.filter(m => m.sk && m.sk.startsWith('METRICS#')));
  });
}
