import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryByPK, deleteItem, updateItem, queryGSI } from '../db/schema.js';

export default async function appRoutes(app) {
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const id = uuidv4();
    const userId = req.user.id;
    const item = {
      pk: `APP#${id}`,
      sk: 'META',
      id,
      user_id: userId,
      workspace_id: req.body.workspace_id,
      env_id: req.body.env_id,
      name: req.body.name,
      image: req.body.image,
      cpu: req.body.cpu || 1,
      memory: req.body.memory || 1024,
      gpu: req.body.gpu || null,
      timeout: req.body.timeout || 3600,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    await putItem(item);
    await putItem({ pk: `APP_SANDBOXES#${id}`, sk: item.created_at, app_id: id });
    reply.status(201).send(item);
  });

  app.get('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const items = await queryByPK(`USER#${userId}`);
    // Apps nu sunt stocate sub USER# direct; folosim GSI sau scan. Simplu: query GSI1 pentru APP#active
    // Dar schema nu are GSI pentru apps. Facem query pe APP#* cu begins_with SK=META? Nu merge direct.
    // Soluție: stocăm și sub USER_APPS#userId
    const apps = await queryByPK(`USER_APPS#${userId}`);
    const out = [];
    for (const it of apps) {
      const a = await getItem(`APP#${it.app_id}`, 'META');
      if (a) out.push(a);
    }
    reply.send(out);
  });

  app.get('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const a = await getItem(`APP#${req.params.id}`, 'META');
    if (!a) return reply.status(404).send({ error: 'Not found' });
    reply.send(a);
  });

  app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    await deleteItem(`APP#${req.params.id}`, 'META');
    reply.send({ status: 'deleted' });
  });

  app.post('/:id/stop', { preHandler: [app.authenticate] }, async (req, reply) => {
    const a = await getItem(`APP#${req.params.id}`, 'META');
    if (!a) return reply.status(404).send({ error: 'Not found' });
    await updateItem(`APP#${req.params.id}`, 'META', { status: 'stopped' });
    // Stop all app sandboxes
    const sbs = await queryByPK(`APP_SANDBOXES#${req.params.id}`);
    for (const sb of sbs) {
      const box = await getItem(`SANDBOX#${sb.sandbox_id}`, 'META');
      if (box && box.worker_id) {
        try { await app.workerPool.stopSandbox(box.worker_id, sb.sandbox_id); } catch (e) {}
      }
      await updateItem(`SANDBOX#${sb.sandbox_id}`, 'META', { status: 'stopped', finished_at: new Date().toISOString() });
    }
    reply.send({ status: 'stopped' });
  });

  app.post('/:id/deploy', { preHandler: [app.authenticate] }, async (req, reply) => {
    const a = await getItem(`APP#${req.params.id}`, 'META');
    if (!a) return reply.status(404).send({ error: 'Not found' });
    const depId = uuidv4();
    const dep = {
      pk: `DEPLOYMENT#${depId}`,
      sk: 'META',
      id: depId,
      app_id: req.params.id,
      user_id: req.user.id,
      image: req.body.image || a.image,
      cpu: req.body.cpu || a.cpu,
      memory: req.body.memory || a.memory,
      gpu: req.body.gpu || a.gpu,
      status: 'deploying',
      created_at: new Date().toISOString(),
    };
    await putItem(dep);
    // Start sandbox for deployment
    const worker = app.scheduler.selectWorker(dep);
    if (worker) {
      const sbId = uuidv4();
      await app.workerPool.startSandbox(worker.id, { sandboxId: sbId, image: dep.image, cpu: dep.cpu, memory: dep.memory, gpu: dep.gpu });
      dep.worker_id = worker.id;
      dep.sandbox_id = sbId;
      await updateItem(`DEPLOYMENT#${depId}`, 'META', { worker_id: worker.id, sandbox_id: sbId, status: 'active' });
      await putItem({ pk: `APP_SANDBOXES#${req.params.id}`, sk: dep.created_at, sandbox_id: sbId, deployment_id: depId });
    }
    reply.status(201).send(dep);
  });

  app.get('/:id/sandboxes', { preHandler: [app.authenticate] }, async (req, reply) => {
    const items = await queryByPK(`APP_SANDBOXES#${req.params.id}`);
    const out = [];
    for (const it of items) {
      const sb = await getItem(`SANDBOX#${it.sandbox_id}`, 'META');
      if (sb) out.push(sb);
    }
    reply.send(out);
  });

  app.get('/:id/deployments', { preHandler: [app.authenticate] }, async (req, reply) => {
    const items = await queryByPK(`DEPLOYMENT#${req.params.id}`); // nu există pattern corect
    // Corect: query GSI nu există. Simplu: stocăm sub APP_DEPLOYMENTS#appId
    const deps = await queryByPK(`APP_DEPLOYMENTS#${req.params.id}`);
    const out = [];
    for (const d of deps) {
      const dep = await getItem(`DEPLOYMENT#${d.deployment_id}`, 'META');
      if (dep) out.push(dep);
    }
    reply.send(out);
  });

  app.get('/:id/metrics', { preHandler: [app.authenticate] }, async (req, reply) => {
    const metrics = await queryByPK(`APP#${req.params.id}`, { ScanIndexForward: false, Limit: 100 });
    reply.send(metrics.filter(m => m.sk && m.sk.startsWith('METRICS#')));
  });

  app.get('/:id/usage', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const items = await queryByPK(`USAGE#${userId}`, { ScanIndexForward: false, Limit: 100 });
    const appItems = items.filter(i => i.app_id === req.params.id);
    const total = appItems.reduce((s, i) => s + (i.cost || 0), 0);
    reply.send({ total_cost: Math.round(total * 100000) / 100000, items: appItems });
  });

  app.get('/:id/logs', { preHandler: [app.authenticate] }, async (req, reply) => {
    const items = await queryByPK(`APP_LOGS#${req.params.id}`, { ScanIndexForward: false, Limit: 100 });
    reply.send(items.map(i => ({ timestamp: i.sk, message: i.message })));
  });
}
