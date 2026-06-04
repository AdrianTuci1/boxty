import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryByPK, deleteItem } from '../db/schema.js';

export default async function environmentRoutes(app) {
  app.post('/', async (req, reply) => {
    const userId = req.user?.id || 'anon';
    const id = uuidv4();
    const item = {
      pk: `USER#${userId}`,
      sk: `ENV#${id}`,
      id,
      workspace_id: req.body.workspace_id,
      name: req.body.name,
      type: req.body.type || 'development',
      created_at: new Date().toISOString(),
    };
    await putItem(item);
    reply.status(201).send(item);
  });

  app.get('/', async (req, reply) => {
    const userId = req.user?.id || 'anon';
    const items = await queryByPK(`USER#${userId}`);
    reply.send(items.filter(i => i.sk && i.sk.startsWith('ENV#')));
  });

  app.get('/:id', async (req, reply) => {
    const userId = req.user?.id || 'anon';
    const env = await getItem(`USER#${userId}`, `ENV#${req.params.id}`);
    if (!env) return reply.status(404).send({ error: 'Not found' });
    reply.send(env);
  });

  app.delete('/:id', async (req, reply) => {
    const userId = req.user?.id || 'anon';
    await deleteItem(`USER#${userId}`, `ENV#${req.params.id}`);
    reply.send({ status: 'deleted' });
  });
}
