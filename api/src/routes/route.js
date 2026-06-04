import { getItem, updateItem } from '../db/schema.js';
import { notifyGateway } from '../services/gateway-notify.js';

/**
 * Internal route endpoints — used by the gateway to resolve sandbox → worker mappings.
 * Also handles cold start: if a sandbox is stopped, re-creates it on demand.
 */
export default async function routeRoutes(app) {
  // Called by gateway to register or update a route
  app.post('/internal/gateway/upsert', async (req, reply) => {
    const key = req.headers['x-gateway-key'];
    const expected = process.env.GATEWAY_API_KEY || 'boxty-gateway-secret';
    if (key !== expected) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    // No-op: gateway manages its own cache via this endpoint.
    // If status=stopped, we could optionally clean up here.
    reply.send({ status: 'ok' });
  });

  // Called by worker when stopping a sandbox (idle timeout or manual)
  app.post('/internal/sandbox/:sandboxId/stopped', async (req, reply) => {
    const key = req.headers['x-api-key'];
    const expected = process.env.WORKER_API_KEY || 'boxty-worker-secret';
    if (key !== expected) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const sbId = req.params.sandboxId;
    await updateItem(`SANDBOX#${sbId}`, 'META', {
      status: 'stopped',
      worker_id: '',
      finished_at: new Date().toISOString(),
    });
    await notifyGateway({
      sandbox_id: sbId,
      worker_id: '',
      worker_host: '',
      ports: [],
      status: 'stopped',
    });
    console.log('Sandbox stopped by worker:', sbId);
    reply.send({ status: 'ok' });
  });

  // Called by gateway to look up a sandbox route
  // Handles cold start if sandbox is stopped
  app.get('/internal/route/:sandboxId', async (req, reply) => {
    const sb = await getItem(`SANDBOX#${req.params.sandboxId}`, 'META');
    if (!sb) {
      return reply.status(404).send({ error: 'Sandbox not found' });
    }

    // If running and has a worker, return the route
    if (sb.status === 'running' && sb.worker_id) {
      const worker = app.workerPool.workers.get(sb.worker_id);
      if (worker && worker.status === 'active') {
        return reply.send({
          sandbox_id: sb.id,
          worker_id: sb.worker_id,
          worker_host: worker.host,
          ports: sb.ports || [sb.port || 8080],
          status: 'running',
        });
      }
    }

    // Cold start: sandbox is stopped or worker is gone
    if (sb.status === 'stopped' || sb.status === 'starting') {
      // Prevent duplicate cold start races
      await updateItem(`SANDBOX#${sb.id}`, 'META', { status: 'starting' });

      try {
        const worker = app.scheduler.selectWorker({
          cpu: sb.cpu || 1,
          memory: sb.memory || 1024,
          gpu: sb.gpu || null,
        });

        if (!worker) {
          await updateItem(`SANDBOX#${sb.id}`, 'META', { status: 'stopped' });
          return reply.status(503).send({ error: 'No workers available' });
        }

        await app.workerPool.startSandbox(worker.id, {
          sandboxId: sb.id,
          image: sb.image,
          cpu: sb.cpu,
          memory: sb.memory,
          gpu: sb.gpu,
          timeout: sb.timeout,
          diskSizeGb: sb.disk_size_gb,
        });

        await updateItem(`SANDBOX#${sb.id}`, 'META', {
          status: 'running',
          worker_id: worker.id,
          started_at: new Date().toISOString(),
        });

        // Notify gateway
        await notifyGateway({
          sandbox_id: sb.id,
          worker_id: worker.id,
          worker_host: worker.host,
          ports: sb.ports || [sb.port || 8080],
          status: 'running',
        });

        return reply.send({
          sandbox_id: sb.id,
          worker_id: worker.id,
          worker_host: worker.host,
          ports: sb.ports || [sb.port || 8080],
          status: 'running',
        });
      } catch (err) {
        console.error('Cold start failed:', err);
        await updateItem(`SANDBOX#${sb.id}`, 'META', { status: 'stopped' });
        return reply.status(500).send({ error: 'Cold start failed' });
      }
    }

    // Starting — wait briefly and re-check
    if (sb.status === 'starting') {
      return reply.status(202).send({ error: 'Sandbox is starting, retry shortly' });
    }

    return reply.status(404).send({ error: 'Sandbox unavailable' });
  });
}
