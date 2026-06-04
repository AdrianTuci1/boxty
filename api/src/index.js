import Fastify from 'fastify';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { config } from './config.js';
import { authMiddleware } from './middleware/auth.js';
import { sandboxRoutes } from './routes/sandboxes.js';
import { execRoutes } from './routes/exec.js';
import { billingRoutes } from './routes/billing.js';
import { deploymentRoutes } from './routes/deployments.js';
import { adminRoutes } from './routes/admin.js';
import { workerRoutes } from './routes/workers.js';
import { sandboxStream } from './ws/sandbox-stream.js';
import { BillingEngine } from './services/billing-engine.js';
import { Scheduler } from './services/scheduler.js';
import { CapacityManager } from './services/capacity-manager.js';
import { CloudProviderFactory } from './services/cloud-provider.js';

const app = Fastify({ logger: true });
const server = createServer(app.server);
const wss = new WebSocketServer({ server });

// Decorate with shared services
const billingEngine = new BillingEngine();
const scheduler = new Scheduler();
const capacityManager = new CapacityManager(scheduler);

app.decorate('billingEngine', billingEngine);
app.decorate('scheduler', scheduler);
app.decorate('capacityManager', capacityManager);

// Middleware
app.addHook('onRequest', authMiddleware);

// Routes
await app.register(sandboxRoutes, { prefix: '/api/sandboxes' });
await app.register(execRoutes, { prefix: '/api' });
await app.register(billingRoutes, { prefix: '/api/billing' });
await app.register(deploymentRoutes, { prefix: '/api/deployments' });
await app.register(adminRoutes, { prefix: '/api/admin' });
await app.register(workerRoutes, { prefix: '/api/workers' });

app.get('/health', async () => ({ ok: true, version: '0.1.0', name: 'boxty-api' }));

// WebSocket — stream output from sandboxes
wss.on('connection', (ws, req) => sandboxStream(ws, req, app));

// Background jobs every second
setInterval(() => {
  billingEngine.tick();
  scheduler.rebalance();
  capacityManager.evaluate();
}, 1000);

// Start
const port = config.PORT || 3000;
server.listen(port, '0.0.0.0', () => {
  app.log.info(`🚀 Boxty API running on :${port}`);
  app.log.info(`   DynamoDB: ${config.DYNAMODB_ENDPOINT || 'AWS'}`);
  app.log.info(`   Stripe: ${config.STRIPE_SECRET_KEY ? 'configured' : 'disabled'}`);
});
