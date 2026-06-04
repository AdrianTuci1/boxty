import { putItem, getItem, queryByPK, deleteItem, updateItem } from '../db/schema.js';

export default async function secretRoutes(app) {
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const { name, value } = req.body;
    await putItem({
      pk: `SECRET#${userId}`,
      sk: name,
      name,
      value,
      created_at: new Date().toISOString(),
    });
    reply.status(201).send({ name, created_at: new Date().toISOString() });
  });

  app.get('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const items = await queryByPK(`SECRET#${userId}`);
    reply.send(items.map(i => ({ name: i.name, created_at: i.created_at })));
  });

  app.delete('/:name', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    await deleteItem(`SECRET#${userId}`, req.params.name);
    reply.send({ status: 'deleted' });
  });

  app.post('/attach/:sandboxId', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const { secret_names } = req.body;
    const secrets = [];
    for (const name of secret_names) {
      const s = await getItem(`SECRET#${userId}`, name);
      if (s) secrets.push({ name: s.name, value: s.value });
    }
    const sb = await getItem(`SANDBOX#${req.params.sandboxId}`, 'META');
    if (sb && sb.worker_id) {
      try {
        await app.workerPool.startSandbox(sb.worker_id, { sandboxId: req.params.sandboxId, secrets });
      } catch (e) {
        // ignore if already running
      }
    }
    await updateItem(`SANDBOX#${req.params.sandboxId}`, 'META', { attached_secrets: secrets.map(s => s.name) });
    reply.send({ attached: secrets.map(s => s.name) });
  });
}
