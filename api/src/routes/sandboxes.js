import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { putItem, getItem, updateItem, queryGSI1 } from '../db/schema.js';
import { WorkerClient } from '../services/worker-pool.js';

export async function sandboxRoutes(app) {
  // POST /api/sandboxes — create a new sandbox
  app.post('/', async (request, reply) => {
    const { image = 'ubuntu:22.04', cpu = 1, memory = 2048, gpu, timeout = 3600 } = request.body;
    const userId = request.userId;

    // 1. Check credit balance
    const balance = await app.billingEngine.balance(userId);
    const estimatedCost = app.billingEngine.estimateCost({ cpu, memory, gpu }, 60);
    if (balance < estimatedCost) {
      return reply.status(402).send({ error: 'Insufficient credits', balance, needed: estimatedCost });
    }

    // 2. Select worker
    const worker = await app.scheduler.selectWorker({ cpu, memory, gpu });
    if (!worker) {
      // Queue for provisioning
      await app.capacityManager.queueRequest(userId, { cpu, memory, gpu, image, timeout });
      return reply.status(202).send({ status: 'queued', message: 'Provisioning worker, sandbox will start shortly' });
    }

    // 3. Create sandbox on worker
    const sandboxId = uuidv4();
    const tunnelKey = uuidv4().slice(0, 8);

    try {
      const workerClient = new WorkerClient(worker.url, config.WORKER_API_KEY);
      await workerClient.startSandbox({
        sandboxId,
        image,
        cpu,
        memory,
        gpu,
        timeout,
        tunnelKey,
      });
    } catch (err) {
      app.log.error({ workerId: worker.id, err }, 'Failed to start sandbox on worker');
      app.scheduler.releaseWorker(worker.id, { cpu, memory, gpu });
      return reply.status(500).send({ error: 'Failed to provision sandbox' });
    }

    // 4. Save to DynamoDB
    const now = new Date().toISOString();
    await putItem({
      PK: `SANDBOX#${sandboxId}`,
      SK: `META`,
      id: sandboxId,
      userId,
      workerId: worker.id,
      image,
      cpu,
      memory,
      gpu: gpu || null,
      timeout,
      status: 'running',
      tunnelKey,
      createdAt: now,
      lastActivityAt: now,
      GSI1_PK: `STATUS#running`,
      GSI1_SK: now,
      GSI2_PK: `USER_SANDBOXES#${userId}`,
      GSI2_SK: now,
    });

    // 5. Start billing meter
    app.billingEngine.startMeter(sandboxId, userId, { cpu, memory, gpu });

    reply.status(201).send({
      id: sandboxId,
      status: 'running',
      url: `https://${sandboxId}.boxty.dev`,
      wsUrl: `wss://${worker.hostname}:9002/${sandboxId}`,
      createdAt: now,
    });
  });

  // GET /api/sandboxes — list user's sandboxes
  app.get('/', async (request, reply) => {
    const userId = request.userId;
    const items = await queryGSI1(`STATUS#running`);
    const userSandboxes = items.filter(i => i.userId === userId);
    reply.send({ sandboxes: userSandboxes });
  });

  // GET /api/sandboxes/:id — get sandbox details
  app.get('/:id', async (request, reply) => {
    const { id } = request.params;
    const sandbox = await getItem(`SANDBOX#${id}`, 'META');
    if (!sandbox) return reply.status(404).send({ error: 'Sandbox not found' });
    if (sandbox.userId !== request.userId && request.userRole !== 'admin') {
      return reply.status(403).send({ error: 'Forbidden' });
    }
    reply.send({ sandbox });
  });

  // DELETE /api/sandboxes/:id — stop and destroy sandbox
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params;
    const sandbox = await getItem(`SANDBOX#${id}`, 'META');
    if (!sandbox) return reply.status(404).send({ error: 'Sandbox not found' });
    if (sandbox.userId !== request.userId && request.userRole !== 'admin') {
      return reply.status(403).send({ error: 'Forbidden' });
    }

    // Stop billing
    app.billingEngine.stopMeter(id);

    // Kill on worker
    try {
      const workerClient = new WorkerClient(sandbox.workerUrl, config.WORKER_API_KEY);
      await workerClient.stopSandbox(id);
    } catch (err) {
      app.log.warn({ sandboxId: id, err }, 'Worker unreachable during sandbox stop');
    }

    app.scheduler.releaseWorker(sandbox.workerId, {
      cpu: sandbox.cpu,
      memory: sandbox.memory,
      gpu: sandbox.gpu,
    });

    await updateItem(`SANDBOX#${id}`, 'META', {
      status: 'stopped',
      stoppedAt: new Date().toISOString(),
      GSI1_PK: `STATUS#stopped`,
    });

    reply.send({ status: 'stopped' });
  });

  // POST /api/sandboxes/:id/snapshot — checkpoint
  app.post('/:id/snapshot', async (request, reply) => {
    const { id } = request.params;
    const { name = `snapshot-${Date.now()}` } = request.body;
    const sandbox = await getItem(`SANDBOX#${id}`, 'META');
    if (!sandbox) return reply.status(404).send({ error: 'Sandbox not found' });

    const workerClient = new WorkerClient(sandbox.workerUrl, config.WORKER_API_KEY);
    const snapshot = await workerClient.snapshot(id, name);

    await putItem({
      PK: `SANDBOX#${id}`,
      SK: `SNAPSHOT#${name}`,
      name,
      s3Key: snapshot.s3Key,
      createdAt: new Date().toISOString(),
    });

    reply.send({ snapshot: { name, s3Key: snapshot.s3Key } });
  });

  // POST /api/sandboxes/restore — restore from snapshot
  app.post('/restore', async (request, reply) => {
    const { snapshotKey, image, cpu, memory, gpu } = request.body;
    const userId = request.userId;

    const balance = await app.billingEngine.balance(userId);
    if (balance < 60) {
      return reply.status(402).send({ error: 'Insufficient credits' });
    }

    const worker = await app.scheduler.selectWorker({ cpu, memory, gpu });
    if (!worker) {
      return reply.status(503).send({ error: 'No capacity available' });
    }

    const sandboxId = uuidv4();
    const workerClient = new WorkerClient(worker.url, config.WORKER_API_KEY);
    await workerClient.restoreSandbox({ sandboxId, snapshotKey, image, cpu, memory, gpu });

    await putItem({
      PK: `SANDBOX#${sandboxId}`,
      SK: `META`,
      id: sandboxId,
      userId,
      workerId: worker.id,
      image,
      cpu,
      memory,
      gpu: gpu || null,
      status: 'running',
      restoredFrom: snapshotKey,
      createdAt: new Date().toISOString(),
      GSI1_PK: `STATUS#running`,
      GSI1_SK: new Date().toISOString(),
    });

    app.billingEngine.startMeter(sandboxId, userId, { cpu, memory, gpu });

    reply.status(201).send({ id: sandboxId, status: 'running' });
  });

  // POST /api/sandboxes/:id/forward — port forwarding
  app.post('/:id/forward', async (request, reply) => {
    const { id } = request.params;
    const { port } = request.body;
    const sandbox = await getItem(`SANDBOX#${id}`, 'META');
    if (!sandbox) return reply.status(404).send({ error: 'Sandbox not found' });

    // Worker handles the tunnel — return the URL
    reply.send({
      url: `https://${id}-${port}.boxty.dev`,
      wsUrl: `wss://${sandbox.workerHostname}:9002/${id}/${port}`,
    });
  });
}
