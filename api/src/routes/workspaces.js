import { authenticate } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryByPK, deleteItem } from '../db/schema.js';

export default async function workspaceRoutes(app) {
  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const id = uuidv4();
    const now = new Date().toISOString();
    const item = {
      pk: `WORKSPACE#${id}`, sk: 'META', id, user_id: userId,
      name: req.body.name,
      description: req.body.description || '',
      is_default: false,
      created_at: now,
    };
    await putItem(item);
    await putItem({ pk: `USER_WS#${userId}`, sk: `WORKSPACE#${id}`, workspace_id: id, created_at: now });
    reply.status(201).send(item);
  });

  app.get('/', { preHandler: [authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const items = await queryByPK(`USER_WS#${userId}`);
    const workspaces = [];
    for (const it of items) {
      const ws = await getItem(`WORKSPACE#${it.workspace_id}`, 'META');
      if (ws) workspaces.push(ws);
    }
    reply.send(workspaces);
  });

  app.get('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const ws = await getItem(`WORKSPACE#${req.params.id}`, 'META');
    if (!ws || ws.user_id !== req.user.id) return reply.status(404).send({ error: 'Not found' });
    reply.send(ws);
  });

  app.delete('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const ws = await getItem(`WORKSPACE#${req.params.id}`, 'META');
    if (!ws || ws.user_id !== req.user.id) return reply.status(404).send({ error: 'Not found' });
    if (ws.is_default) return reply.status(400).send({ error: 'Cannot delete default workspace' });
    await deleteItem(`WORKSPACE#${req.params.id}`, 'META');
    await deleteItem(`USER_WS#${req.user.id}`, `WORKSPACE#${req.params.id}`);
    reply.send({ status: 'deleted' });
  });
}
