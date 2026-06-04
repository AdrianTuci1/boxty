import { putItem, getItem, queryByPK, deleteItem } from '../db/schema.js';

export default async function secretRoutes(app) {
  app.post('/', async (req, reply) => {
    const userId = req.user?.id || 'anon';
    const { name, value } = req.body;
    await putItem({
      pk: `SECRET#${userId}`,
      sk: name,
      name,
      value,
      created_at: new Date().toISOString(),
    });
    reply.status(201).send({ name });
  });

  app.get('/', async (req, reply) => {
    const userId = req.user?.id || 'anon';
    const items = await queryByPK(`SECRET#${userId}`);
    reply.send(items.map(i => ({ name: i.name, created_at: i.created_at })));
  });

  app.delete('/:name', async (req, reply) => {
    const userId = req.user?.id || 'anon';
    await deleteItem(`SECRET#${userId}`, req.params.name);
    reply.send({ status: 'deleted' });
  });

  app.post('/attach/:sandboxId', async (req, reply) => {
    const userId = req.user?.id || 'anon';
    const { secret_names } = req.body;
    const secrets = [];
    for (const name of secret_names) {
      const s = await getItem(`SECRET#${userId}`, name);
      if (s) secrets.push({ name: s.name, value: s.value });
    }
    reply.send({ attached: secrets.map(s => s.name) });
  });
}
