import { putItem, getItem, queryByPK, deleteItem, updateItem } from '../db/schema.js';

export default async function secretRoutes(app) {
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const { name, value, workspace_id } = req.body;
    // Dacă nu e specificat workspace, folosim primul workspace al userului
    let wsId = workspace_id;
    if (!wsId) {
      const wsItems = await queryByPK(`USER_WS#${userId}`, { Limit: 1 });
      wsId = wsItems.length > 0 ? wsItems[0].workspace_id : null;
    }
    if (!wsId) return reply.status(400).send({ error: 'No workspace available' });
    await putItem({
      pk: `SECRET#${wsId}`,
      sk: name,
      name,
      value,
      workspace_id: wsId,
      user_id: userId,
      created_at: new Date().toISOString(),
    });
    reply.status(201).send({ name, workspace_id: wsId, created_at: new Date().toISOString() });
  });

  app.get('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const workspaceId = req.query.workspace_id;
    let wsId = workspaceId;
    if (!wsId) {
      const wsItems = await queryByPK(`USER_WS#${userId}`, { Limit: 1 });
      wsId = wsItems.length > 0 ? wsItems[0].workspace_id : null;
    }
    if (!wsId) return reply.send([]);
    const items = await queryByPK(`SECRET#${wsId}`);
    reply.send(items.map(i => ({ name: i.name, workspace_id: wsId, created_at: i.created_at })));
  });

  app.delete('/:name', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const wsItems = await queryByPK(`USER_WS#${userId}`, { Limit: 1 });
    const wsId = wsItems.length > 0 ? wsItems[0].workspace_id : null;
    if (!wsId) return reply.status(404).send({ error: 'No workspace found' });
    await deleteItem(`SECRET#${wsId}`, req.params.name);
    reply.send({ status: 'deleted' });
  });

  app.post('/attach/:sandboxId', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const { secret_names, workspace_id } = req.body;
    let wsId = workspace_id;
    if (!wsId) {
      const wsItems = await queryByPK(`USER_WS#${userId}`, { Limit: 1 });
      wsId = wsItems.length > 0 ? wsItems[0].workspace_id : null;
    }
    const secrets = [];
    for (const name of secret_names) {
      const s = await getItem(`SECRET#${wsId}`, name);
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
    reply.send({ attached: secrets.map(s => s.name), workspace_id: wsId });
  });
}
