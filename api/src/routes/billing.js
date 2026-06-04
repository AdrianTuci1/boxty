import { getItem, queryByPK, putItem } from '../db/schema.js';

export default async function billingRoutes(app) {
  app.get('/balance', async (req, reply) => {
    const userId = req.user?.id || 'anon';
    const bal = await getItem(`BILLING#${userId}`, 'BALANCE');
    reply.send({ balance: bal?.credits || 0 });
  });

  app.get('/usage', async (req, reply) => {
    const userId = req.user?.id || 'anon';
    const items = await queryByPK(`USAGE#${userId}`, { ScanIndexForward: false });
    reply.send(items);
  });

  app.post('/credits', async (req, reply) => {
    reply.send({ checkout_url: 'https://stripe.com/checkout/test' });
  });

  app.post('/stripe/webhook', async (req, reply) => {
    reply.send({ received: true });
  });
}
