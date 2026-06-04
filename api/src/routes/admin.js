export default async function adminRoutes(app) {
  app.get('/stats', async (req, reply) => {
    reply.send({ users: 0, sandboxes: 0, workers: 0, revenue: 0 });
  });

  app.get('/cron/status', async (req, reply) => {
    reply.send({ running: true, last_tick: Date.now() });
  });

  app.get('/health', async (req, reply) => {
    reply.send({ status: 'ok', uptime: process.uptime() });
  });
}
