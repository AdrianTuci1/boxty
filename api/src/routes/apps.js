import { authenticate } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { putItem, getItem, queryByPK, deleteItem, updateItem } from '../db/schema.js';
import { notifyGateway } from '../services/gateway-notify.js';

export default async function appRoutes(app) {
  // ─── Apps (namespace, no CPU/RAM/GPU) ───

  app.post('/', { preHandler: [authenticate] }, async (req, reply) => {
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
      timeout: req.body.timeout || 3600,
      status: 'active',
      type: req.body.type || 'function',
      created_at: new Date().toISOString(),
    };
    await putItem(item);
    await putItem({ pk: `USER_APPS#${userId}`, sk: item.created_at, app_id: id });
    reply.status(201).send(item);
  });

  app.get('/', { preHandler: [authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const apps = await queryByPK(`USER_APPS#${userId}`);
    const out = [];
    for (const it of apps) {
      const a = await getItem(`APP#${it.app_id}`, 'META');
      if (a) {
        // Include instance configs
        const instances = await queryByPK(`APP_INSTANCES#${it.app_id}`);
        const instOut = [];
        for (const idx of instances) {
          const inst = await getItem(`APP_INSTANCE#${idx.instance_id}`, 'META');
          if (inst) instOut.push(inst);
        }
        a.instances = instOut;
        out.push(a);
      }
    }
    reply.send(out);
  });

  app.get('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    const a = await getItem(`APP#${req.params.id}`, 'META');
    if (!a) return reply.status(404).send({ error: 'Not found' });
    // Include instance configs
    const instances = await queryByPK(`APP_INSTANCES#${req.params.id}`);
    const instOut = [];
    for (const idx of instances) {
      const inst = await getItem(`APP_INSTANCE#${idx.instance_id}`, 'META');
      if (inst) instOut.push(inst);
    }
    a.instances = instOut;
    reply.send(a);
  });

  app.delete('/:id', { preHandler: [authenticate] }, async (req, reply) => {
    // Delete instance configs first
    const instances = await queryByPK(`APP_INSTANCES#${req.params.id}`);
    for (const idx of instances) {
      await deleteItem(`APP_INSTANCE#${idx.instance_id}`, 'META');
    }
    await deleteItem(`APP#${req.params.id}`, 'META');
    reply.send({ status: 'deleted' });
  });

  app.post('/:id/stop', { preHandler: [authenticate] }, async (req, reply) => {
    const a = await getItem(`APP#${req.params.id}`, 'META');
    if (!a) return reply.status(404).send({ error: 'Not found' });
    await updateItem(`APP#${req.params.id}`, 'META', { status: 'stopped' });
    // Stop sandboxes from all instances
    const instances = await queryByPK(`APP_INSTANCES#${req.params.id}`);
    for (const idx of instances) {
      const sbs = await queryByPK(`INSTANCE_SANDBOXES#${idx.instance_id}`);
      for (const sb of sbs) {
        if (sb.sandbox_id) {
          const box = await getItem(`SANDBOX#${sb.sandbox_id}`, 'META');
          if (box && box.worker_id) {
            try { await app.workerPool.stopSandbox(box.worker_id, sb.sandbox_id); } catch (e) {}
          }
          await updateItem(`SANDBOX#${sb.sandbox_id}`, 'META', { status: 'stopped', finished_at: new Date().toISOString() });
        }
      }
    }
    reply.send({ status: 'stopped' });
  });

  // ─── Instance Configs (resource pools) ───

  app.post('/:id/instances', { preHandler: [authenticate] }, async (req, reply) => {
    const a = await getItem(`APP#${req.params.id}`, 'META');
    if (!a) return reply.status(404).send({ error: 'App not found' });
    const iid = uuidv4();
    const inst = {
      pk: `APP_INSTANCE#${iid}`,
      sk: 'META',
      id: iid,
      app_id: req.params.id,
      name: req.body.name || 'default',
      cpu: req.body.cpu || 1,
      memory: req.body.memory || 1024,
      gpu: req.body.gpu || null,
      min_containers: req.body.min_containers || 0,
      max_containers: req.body.max_containers || 10,
      scaledown_window: req.body.scaledown_window || 300,
      status: 'active',
      created_at: new Date().toISOString(),
    };
    await putItem(inst);
    await putItem({ pk: `APP_INSTANCES#${req.params.id}`, sk: inst.created_at, instance_id: iid });
    reply.status(201).send(inst);
  });

  app.get('/:id/instances', { preHandler: [authenticate] }, async (req, reply) => {
    const list = await queryByPK(`APP_INSTANCES#${req.params.id}`);
    const out = [];
    for (const idx of list) {
      const inst = await getItem(`APP_INSTANCE#${idx.instance_id}`, 'META');
      if (inst) {
        // Include running sandbox count
        const sbs = await queryByPK(`INSTANCE_SANDBOXES#${idx.instance_id}`);
        const running = sbs.filter(s => s.status === 'running').length;
        inst.running_containers = running;
        out.push(inst);
      }
    }
    reply.send(out);
  });

  app.get('/:id/instances/:iid', { preHandler: [authenticate] }, async (req, reply) => {
    const inst = await getItem(`APP_INSTANCE#${req.params.iid}`, 'META');
    if (!inst || inst.app_id !== req.params.id) return reply.status(404).send({ error: 'Not found' });
    const sbs = await queryByPK(`INSTANCE_SANDBOXES#${req.params.iid}`);
    inst.running_containers = sbs.filter(s => s.status === 'running').length;
    inst.sandboxes = sbs;
    reply.send(inst);
  });

  app.delete('/:id/instances/:iid', { preHandler: [authenticate] }, async (req, reply) => {
    const inst = await getItem(`APP_INSTANCE#${req.params.iid}`, 'META');
    if (!inst || inst.app_id !== req.params.id) return reply.status(404).send({ error: 'Not found' });
    // Stop all sandboxes in this instance
    const sbs = await queryByPK(`INSTANCE_SANDBOXES#${req.params.iid}`);
    for (const sb of sbs) {
      if (sb.sandbox_id) {
        const box = await getItem(`SANDBOX#${sb.sandbox_id}`, 'META');
        if (box && box.worker_id) {
          try { await app.workerPool.stopSandbox(box.worker_id, sb.sandbox_id); } catch (e) {}
        }
        await updateItem(`SANDBOX#${sb.sandbox_id}`, 'META', { status: 'stopped' });
      }
    }
    await deleteItem(`APP_INSTANCE#${req.params.iid}`, 'META');
    reply.send({ status: 'deleted' });
  });

  // ─── Deploy (targets an instance config) ───

  app.post('/:id/deploy', { preHandler: [authenticate] }, async (req, reply) => {
    const a = await getItem(`APP#${req.params.id}`, 'META');
    if (!a) return reply.status(404).send({ error: 'App not found' });
    const instanceId = req.body.instance_id;
    if (!instanceId) return reply.status(400).send({ error: 'instance_id required' });

    const inst = await getItem(`APP_INSTANCE#${instanceId}`, 'META');
    if (!inst || inst.app_id !== req.params.id) return reply.status(404).send({ error: 'Instance not found' });

    const depId = uuidv4();
    const dep = {
      pk: `DEPLOYMENT#${depId}`,
      sk: 'META',
      id: depId,
      app_id: req.params.id,
      instance_id: instanceId,
      user_id: req.user.id,
      image: req.body.image || a.image,
      cpu: inst.cpu,
      memory: inst.memory,
      gpu: inst.gpu,
      status: 'deploying',
      created_at: new Date().toISOString(),
    };
    await putItem(dep);
    await putItem({ pk: `APP_DEPLOYMENTS#${req.params.id}`, sk: dep.created_at, deployment_id: depId });

    const worker = app.scheduler.selectWorker(dep);
    if (worker) {
      const sbId = uuidv4();
      await app.workerPool.startSandbox(worker.id, { sandboxId: sbId, image: dep.image, cpu: dep.cpu, memory: dep.memory, gpu: dep.gpu });
      dep.worker_id = worker.id;
      dep.sandbox_id = sbId;
      await updateItem(`DEPLOYMENT#${depId}`, 'META', { worker_id: worker.id, sandbox_id: sbId, status: 'active' });
      await putItem({ pk: `INSTANCE_SANDBOXES#${instanceId}`, sk: dep.created_at, sandbox_id: sbId, status: 'running' });
      // Notify gateway
      await notifyGateway({
        sandbox_id: sbId,
        worker_id: worker.id,
        worker_host: worker.host,
        ports: [8080],
        status: 'running',
      });
    }
    reply.status(201).send(dep);
  });

  // ─── Sandbox listing per instance ───

  app.get('/:id/instances/:iid/sandboxes', { preHandler: [authenticate] }, async (req, reply) => {
    const items = await queryByPK(`INSTANCE_SANDBOXES#${req.params.iid}`);
    const out = [];
    for (const it of items) {
      if (it.sandbox_id) {
        const sb = await getItem(`SANDBOX#${it.sandbox_id}`, 'META');
        if (sb) out.push(sb);
      }
    }
    reply.send(out);
  });

  // ─── Deployments ───

  app.get('/:id/deployments', { preHandler: [authenticate] }, async (req, reply) => {
    const deps = await queryByPK(`APP_DEPLOYMENTS#${req.params.id}`);
    const out = [];
    for (const d of deps) {
      const dep = await getItem(`DEPLOYMENT#${d.deployment_id}`, 'META');
      if (dep) out.push(dep);
    }
    reply.send(out);
  });

  // ─── Metrics / Usage / Logs ───

  app.get('/:id/metrics', { preHandler: [authenticate] }, async (req, reply) => {
    const metrics = await queryByPK(`APP#${req.params.id}`, { ScanIndexForward: false, Limit: 100 });
    reply.send(metrics.filter(m => m.sk && m.sk.startsWith('METRICS#')));
  });

  app.get('/:id/usage', { preHandler: [authenticate] }, async (req, reply) => {
    const userId = req.user.id;
    const items = await queryByPK(`USAGE#${userId}`, { ScanIndexForward: false, Limit: 100 });
    const appItems = items.filter(i => i.app_id === req.params.id);
    const total = appItems.reduce((s, i) => s + (i.cost || 0), 0);
    reply.send({ total_cost: Math.round(total * 100000) / 100000, items: appItems });
  });

  app.get('/:id/logs', { preHandler: [authenticate] }, async (req, reply) => {
    const items = await queryByPK(`APP_LOGS#${req.params.id}`, { ScanIndexForward: false, Limit: 100 });
    reply.send(items.map(i => ({ timestamp: i.sk, message: i.message })));
  });
}
