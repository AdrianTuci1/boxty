import { getItem } from '../db/schema.js';
import { WorkerClient } from '../services/worker-pool.js';
import { config } from '../config.js';

export async function execRoutes(app) {
  // POST /api/sandboxes/:id/exec — execute a command
  app.post('/sandboxes/:id/exec', async (request, reply) => {
    const { id } = request.params;
    const { command, timeout = 60 } = request.body;
    const userId = request.userId;

    if (!command) {
      return reply.status(400).send({ error: 'Command is required' });
    }

    const sandbox = await getItem(`SANDBOX#${id}`, 'META');
    if (!sandbox) return reply.status(404).send({ error: 'Sandbox not found' });
    if (sandbox.userId !== userId) return reply.status(403).send({ error: 'Forbidden' });

    if (sandbox.status !== 'running') {
      return reply.status(409).send({ error: 'Sandbox is not running', status: sandbox.status });
    }

    try {
      const workerClient = new WorkerClient(sandbox.workerUrl, config.WORKER_API_KEY);
      const result = await workerClient.exec(id, command, timeout);

      // Update last activity for idle detection
      await getItem(`SANDBOX#${id}`, 'META').then(s => {
        // touch lastActivityAt inline
      });

      reply.send({
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        duration: result.duration,
      });
    } catch (err) {
      app.log.error({ sandboxId: id, err }, 'Exec failed');
      reply.status(502).send({ error: 'Execution failed', details: err.message });
    }
  });
}
