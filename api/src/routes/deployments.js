import { authenticate } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryByPK, deleteItem, updateItem } from '../db/schema.js';

export default async function deploymentRoutes(app) {
  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
    const id = uuidv4();
    const item = {
      pk: `DEPLOYMENT#${id}`,
      sk: 'META',
      id,
      user_id: req.user.id,
      app_id: req.body.app_id,
      image: req.body.image,
      cpu: req.body.cpu || 1,
      memory: req.body.memory || 1024,
      gpu: req.body.gpu || null,
      env_vars: req.body.env_vars || {},
      status: 'deploying',
      created_at: new Date().toISOString(),
    };
    await putItem(item);
    await putItem({ pk: `APP_DEPLOYMENTS#${req.body.app_id}`, sk: item.created_at, deployment_id: id });
    reply.status(201).send(item);
  });

  app.get('/', { preHandler: [authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const items = await queryByPK(`USER#${userId}`);
    // deployments nu sunt listate bine; folosim query pe toate deployment-urile userului
    // Simplu: stocam si sub USER_DEPLOYMENTS#userId
    const deps = await queryByPK(`USER_DEPLOYMENTS#${userId}`);
    const out = [];
    for (const d of deps) {
      const dep = await getItem(`DEPLOYMENT#${d.deployment_id}`, 'META');
      if (dep) out.push(dep);
    }
    reply.send(out);
  });

  app.get('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const dep = await getItem(`DEPLOYMENT#${req.params.id}`, 'META');
    if (!dep) return reply.status(404).send({ error: 'Not found' });
    reply.send(dep);
  });

  app.delete('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    await deleteItem(`DEPLOYMENT#${req.params.id}`, 'META');
    reply.send({ status: 'deleted' });
  });

  app.post('/:id/invoke', { preHandler: [authenticate] }, async (req, reply) => {
    const dep = await getItem(`DEPLOYMENT#${req.params.id}`, 'META');
    if (!dep) return reply.status(404).send({ error: 'Not found' });
    if (!dep.worker_id || !dep.sandbox_id) {
      return reply.status(400).send({ error: 'Deployment not active' });
    }
    const res = await app.workerPool.exec(dep.worker_id, dep.sandbox_id, req.body.command || ['echo', 'invoke'], req.body.timeout || 60);
    reply.send({ result: 'ok', deployment_id: req.params.id, exec: res });
  });
}
