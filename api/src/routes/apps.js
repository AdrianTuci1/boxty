import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryByPK, deleteItem, updateItem } from '../db/schema.js';

export default async function appRoutes(app) {
  app.post('/', async (req, reply) => {
    const id = uuidv4();
    const userId = req.user?.id || 'anon';
    const item = {
      pk: `APP#${id}`,
      sk: 'META',
      id,
      user_id: userId,
      workspace_id: req.body.workspace_id,
      env_id: req.body.env_id,
      name: req.body.name,
      image: req.body.image,
      cpu: req.body.cpu,
      memory: req.body.memory,
      gpu: req.body.gpu,
      timeout: req.body.timeout,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    await putItem(item);
    await putItem({ pk: `APP_SANDBOXES#${id}`, sk: item.created_at, app_id: id });
    reply.status(201).send(item);
  });

  app.get('/', async (req, reply) => {
    reply.send([]);
  });

  app.get('/:id', async (req, reply) => {
    const a = await getItem(`APP#${req.params.id}`, 'META');
    if (!a) return reply.status(404).send({ error: 'Not found' });
    reply.send(a);
  });

  app.delete('/:id', async (req, reply) => {
    await deleteItem(`APP#${req.params.id}`, 'META');
    reply.send({ status: 'deleted' });
  });

  app.post('/:id/stop', async (req, reply) => {
    const a = await getItem(`APP#${req.params.id}`, 'META');
    if (!a) return reply.status(404).send({ error: 'Not found' });
    await updateItem(`APP#${req.params.id}`, 'META', { status: 'stopped' });
    reply.send({ status: 'stopped' });
  });

  app.get('/:id/sandboxes', async (req, reply) => {
    const items = await queryByPK(`APP_SANDBOXES#${req.params.id}`);
    reply.send(items);
  });

  app.get('/:id/deployments', async (req, reply) => {
    reply.send([]);
  });

  app.get('/:id/metrics', async (req, reply) => {
    const metrics = await queryByPK(`APP#${req.params.id}`, { ScanIndexForward: false, Limit: 100 });
    reply.send(metrics.filter(m => m.sk && m.sk.startsWith('METRICS#')));
  });

  app.get('/:id/usage', async (req, reply) => {
    reply.send({ total_cost: 0 });
  });

  app.get('/:id/logs', async (req, reply) => {
    reply.send([]);
  });
}
