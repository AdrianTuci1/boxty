import { queryGSI, getItem, updateItem, putItem } from '../db/schema.js';

const PRICE_CPU_PER_SEC = 0.0001;
const PRICE_MEM_GB_PER_SEC = 0.00005;
const PRICE_GPU_PER_SEC = 0.001;
const USAGE_AGGREGATION_SECONDS = 60;

export class BillingEngine {
  constructor(workerPool) {
    this.workerPool = workerPool;
    this.interval = null;
    this.usageBuffer = new Map(); // userId -> accumulated usage
    this.lastFlush = Date.now();
  }

  start() {
    this.interval = setInterval(() => this.tick(), 1000);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }

  async tick() {
    try {
      const items = await queryGSI('GSI1', 'pk', 'STATUS#running');
      for (const item of items) {
        const sb = await getItem(`SANDBOX#${item.sandbox_id}`, 'META');
        if (!sb || sb.status !== 'running') continue;

        const cpu = sb.cpu || 1;
        const memGb = (sb.memory || 1024) / 1024;
        const gpu = sb.gpu ? 1 : 0;
        const cost = (cpu * PRICE_CPU_PER_SEC) + (memGb * PRICE_MEM_GB_PER_SEC) + (gpu * PRICE_GPU_PER_SEC);

        const userId = sb.user_id || 'anon';
        const balKey = `BILLING#${userId}`;
        const balanceItem = await getItem(balKey, 'BALANCE');
        const currentBalance = balanceItem?.credits || 0;
        const newBalance = Math.max(0, currentBalance - cost);

        await updateItem(balKey, 'BALANCE', { credits: newBalance });

        // Accumulate usage
        const buf = this.usageBuffer.get(userId) || { cpu_sec: 0, mem_gb_sec: 0, gpu_sec: 0, cost: 0 };
        buf.cpu_sec += cpu;
        buf.mem_gb_sec += memGb;
        buf.gpu_sec += gpu;
        buf.cost += cost;
        this.usageBuffer.set(userId, buf);

        if (newBalance <= 0) {
          // Mark for stop
          await updateItem(`SANDBOX#${sb.id}`, 'META', { status: 'pending_stop' });
          if (sb.worker_id) {
            try {
              await this.workerPool.stopSandbox(sb.worker_id, sb.id);
            } catch (e) {
              // ignore
            }
          }
        }
      }

      // Flush usage every 60s
      if (Date.now() - this.lastFlush >= USAGE_AGGREGATION_SECONDS * 1000) {
        await this.flushUsage();
      }
    } catch (err) {
      console.error('BillingEngine tick error:', err.message);
    }
  }

  async flushUsage() {
    for (const [userId, buf] of this.usageBuffer) {
      const ts = Date.now();
      await putItem({
        pk: `USAGE#${userId}`,
        sk: `USAGE#${ts}`,
        cpu_sec: Math.round(buf.cpu_sec * 100) / 100,
        mem_gb_sec: Math.round(buf.mem_gb_sec * 100) / 100,
        gpu_sec: Math.round(buf.gpu_sec * 100) / 100,
        cost: Math.round(buf.cost * 100000) / 100000,
        created_at: new Date().toISOString(),
      });
    }
    this.usageBuffer.clear();
    this.lastFlush = Date.now();
  }

  async deduct(userId, amount) {
    const balKey = `BILLING#${userId}`;
    const item = await getItem(balKey, 'BALANCE');
    const current = item?.credits || 0;
    await updateItem(balKey, 'BALANCE', { credits: Math.max(0, current - amount) });
  }

  async addCredits(userId, amount) {
    const balKey = `BILLING#${userId}`;
    const item = await getItem(balKey, 'BALANCE');
    const current = item?.credits || 0;
    await updateItem(balKey, 'BALANCE', { credits: current + amount });
  }
}

export default function billingEnginePlugin(app, opts, done) {
  const engine = new BillingEngine(app.workerPool);
  app.decorate('billingEngine', engine);
  engine.start();
  app.log.info('BillingEngine started');
  done();
}
