import Stripe from 'stripe';
import { config } from '../config.js';
import { getItem, queryByPK, putItem, updateItem } from '../db/schema.js';

const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey, { apiVersion: '2023-10-16' }) : null;

export default async function billingRoutes(app) {
  app.get('/balance', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user?.id || 'anon';
    const bal = await getItem(`BILLING#${userId}`, 'BALANCE');
    reply.send({ balance: bal?.credits || 0, user_id: userId });
  });

  app.get('/usage', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user?.id || 'anon';
    const items = await queryByPK(`USAGE#${userId}`, { ScanIndexForward: false, Limit: 100 });
    reply.send(items);
  });

  app.post('/credits', { preHandler: [app.authenticate] }, async (req, reply) => {
    const userId = req.user?.id || 'anon';
    const { amount = 1000 } = req.body;
    if (!stripe) {
      // Dev fallback: add credits directly
      await app.billingEngine.addCredits(userId, amount);
      return reply.send({ checkout_url: null, dev_mode: true, credits_added: amount });
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Boxty Credits' },
          unit_amount: Math.max(100, Math.round((amount / 1000) * 1000)), // $1 per 1000 credits
        },
        quantity: 1,
      }],
      success_url: `${req.headers.origin || 'https://boxty.dev'}/billing?success=1`,
      cancel_url: `${req.headers.origin || 'https://boxty.dev'}/billing?canceled=1`,
      metadata: { user_id: userId, credits: String(amount) },
    });
    reply.send({ checkout_url: session.url, session_id: session.id });
  });

  app.post('/stripe/webhook', { config: { rawBody: true } }, async (req, reply) => {
    if (!stripe) return reply.send({ received: true, dev: true });
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, config.stripeWebhookSecret);
    } catch (err) {
      return reply.status(400).send({ error: 'Invalid signature', message: err.message });
    }
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const credits = parseInt(session.metadata?.credits || '1000', 10);
      if (userId) {
        await app.billingEngine.addCredits(userId, credits);
        await putItem({
          pk: `BILLING#${userId}`,
          sk: `PAYMENT#${session.id}`,
          amount: session.amount_total,
          credits,
          status: 'completed',
          created_at: new Date().toISOString(),
        });
      }
    }
    reply.send({ received: true });
  });
}
