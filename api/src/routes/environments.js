import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryByPK, deleteItem } from '../db/schema.js';

export default async function environmentRoutes(app) {
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const workspaceId = req.body.workspace_id;
    if (!workspaceId) return reply.status(400).send({ error: 'workspace_id is required' });
    // Verifică ownership pe workspace
    const ws = await getItem(`WORKSPACE#${workspaceId}`, 'META');
    if (!ws || ws.user_id !== userId) return reply.status(404).send({ error: 'Workspace not found' });

    const id = uuidv4();
    const now = new Date().toISOString();
    const item = {
      pk: `ENV#${id}`, sk: 'META', id, workspace_id: workspaceId, user_id: userId,
      name: req.body.name,
      type: req.body.type || 'development',
      is_default: false,
      created_at: now,
    };
    await putItem(item);
    await putItem({ pk: `WS_ENVS#${workspaceId}`, sk: `ENV#${id}`, environment_id: id, created_at: now });
    reply.status(201).send(item);
  });

  app.get('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const workspaceId = req.query.workspace_id;
    if (!workspaceId) return reply.status(400).send({ error: 'workspace_id query param required' });

    const userId = req.user.id;
    const ws = await getItem(`WORKSPACE#${workspaceId}`, 'META');
    if (!ws || ws.user_id !== userId) return reply.status(404).send({ error: 'Workspace not found' });

    const items = await queryByPK(`WS_ENVS#${workspaceId}`);
    const envs = [];
    for (const it of items) {
      const env = await getItem(`ENV#${it.environment_id}`, 'META');
      if (env) envs.push(env);
    }
    reply.send(envs);
  });

  app.get('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const env = await getItem(`ENV#${req.params.id}`, 'META');
    if (!env || env.user_id !== req.user.id) return reply.status(404).send({ error: 'Not found' });
    reply.send(env);
  });

  app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const env = await getItem(`ENV#${req.params.id}`, 'META');
    if (!env || env.user_id !== req.user.id) return reply.status(404).send({ error: 'Not found' });
    if (env.is_default) return reply.status(400).send({ error: 'Cannot delete default environment' });
    await deleteItem(`ENV#${req.params.id}`, 'META');
    await deleteItem(`WS_ENVS#${env.workspace_id}`, `ENV#${req.params.id}`);
    reply.send({ status: 'deleted' });
  });
}
