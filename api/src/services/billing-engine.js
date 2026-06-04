import { putItem, updateItem, queryByPK } from '../db/schema.js';

export class BillingEngine {
  constructor() {
    this.interval = null;
  }

  start() {
    this.interval = setInterval(() => this.tick(), 1000);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }

  async tick() {
    // Stub: iterate active sandboxes and deduct credits
  }

  async deduct(userId, amount) {
    const bal = await queryByPK(`BILLING#${userId}`, { Limit: 1 });
    // stub
  }
}

export default function billingEnginePlugin(app, opts, done) {
  const engine = new BillingEngine();
  app.decorate('billingEngine', engine);
  engine.start();
  done();
}
