import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import fastifyStatic from '@fastify/static';
import { config } from './config.js';
import { authPlugin } from './middleware/auth.js';
import workerPoolPlugin from './services/worker-pool.js';
import schedulerPlugin from './services/scheduler.js';
import capacityManagerPlugin from './services/capacity-manager.js';
import billingEnginePlugin from './services/billing-engine.js';
import cronEnginePlugin from './services/cron-engine.js';
import imageBuilderPlugin from './services/image-builder.js';
import volumeManagerPlugin from './services/volume-manager.js';
import metricsCollectorPlugin from './services/metrics-collector.js';
import cloudProviderPlugin from './services/cloud-provider.js';
import sandboxStreamPlugin from './ws/sandbox-stream.js';

import sandboxRoutes from './routes/sandboxes.js';
import execRoutes from './routes/exec.js';
import billingRoutes from './routes/billing.js';
import deploymentRoutes from './routes/deployments.js';
import workerRoutes from './routes/workers.js';
import secretRoutes from './routes/secrets.js';
import imageRoutes from './routes/images.js';
import volumeRoutes from './routes/volumes.js';
import workspaceRoutes from './routes/workspaces.js';
import environmentRoutes from './routes/environments.js';
import appRoutes from './routes/apps.js';
import routeRoutes from './routes/route.js';
import scheduleRoutes from './routes/schedules.js';
import adminRoutes from './routes/admin.js';
import dashboardRoutes from './routes/dashboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Fastify({ logger: true });

await app.register(authPlugin);
await app.register(workerPoolPlugin);
await app.register(schedulerPlugin);
await app.register(capacityManagerPlugin);
await app.register(billingEnginePlugin);
await app.register(cronEnginePlugin);
await app.register(imageBuilderPlugin);
await app.register(volumeManagerPlugin);
await app.register(metricsCollectorPlugin);
await app.register(cloudProviderPlugin);
await app.register(sandboxStreamPlugin);

await app.register(sandboxRoutes, { prefix: '/api/sandboxes' });
await app.register(execRoutes, { prefix: '/api/sandboxes' });
await app.register(billingRoutes, { prefix: '/api/billing' });
await app.register(deploymentRoutes, { prefix: '/api/deployments' });
await app.register(workerRoutes, { prefix: '/api/workers' });
await app.register(secretRoutes, { prefix: '/api/secrets' });
await app.register(imageRoutes, { prefix: '/api/images' });
await app.register(volumeRoutes, { prefix: '/api/volumes' });
await app.register(workspaceRoutes, { prefix: '/api/workspaces' });
await app.register(environmentRoutes, { prefix: '/api/environments' });
await app.register(appRoutes, { prefix: '/api/apps' });
await app.register(routeRoutes);
await app.register(scheduleRoutes, { prefix: '/api/schedules' });
await app.register(adminRoutes, { prefix: '/api/admin' });
await app.register(dashboardRoutes, { prefix: '/api/dashboard' });

await app.register(fastifyStatic, {
  root: path.join(__dirname, '../docs'),
  prefix: '/docs/',
});

app.get('/docs', async (req, reply) => {
  reply.sendFile('index.html');
});

app.get('/docs/openapi.yaml', async (req, reply) => {
  reply.sendFile('openapi.yaml');
});

app.get('/health', async (req, reply) => {
  reply.send({ status: 'ok' });
});

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  app.log.info(`Boxty API listening on ${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
