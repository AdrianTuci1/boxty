import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryByPK, deleteItem } from '../db/schema.js';

export default async function workspaceRoutes(app) {
  app.post('/', async (req, reply) => {
    const userId = req.user?.id || 'anon';
    const id = uuidv4();
    const item = {
      pk: `USER#${userId}`,
      sk: `WORKSPACE#${id}`,
      id,
      name: req.body.name,
      description: req.body.description || '',
      created_at: new Date().toISOString(),
    };
    await putItem(item);
    reply.status(201).send(item);
  });

  app.get('/', async (req, reply) => {
    const userId = req.user?.id || 'anon';
    const items = await queryByPK(`USER#${userId}`);
    reply.send(items.filter(i => i.sk && i.sk.startsWith('WORKSPACE#')));
  });

  app.get('/:id', async (req, reply) => {
    const userId = req.user?.id || 'anon';
    const ws = await getItem(`USER#${userId}`, `WORKSPACE#${req.params.id}`);
    if (!ws) return reply.status(404).send({ error: 'Not found' });
    reply.send(ws);
  });

  app.delete('/:id', async (req, reply) => {
    const userId = req.user?.id || 'anon';
    await deleteItem(`USER#${userId}`, `WORKSPACE#${req.params.id}`);
    reply.send({ status: 'deleted' });
  });
}
