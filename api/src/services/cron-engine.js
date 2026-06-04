import pkg from 'cron-parser';
const { parseExpression } = pkg;
import { queryGSI, getItem, putItem, updateItem, deleteItem } from '../db/schema.js';

export class CronEngine {
  constructor(workerPool, scheduler) {
    this.workerPool = workerPool;
    this.scheduler = scheduler;
    this.interval = null;
  }

  start() {
    this.interval = setInterval(() => this.tick(), 60000);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }

  async tick() {
    const now = Date.now();
    const items = await queryGSI('GSI3', 'pk', 'SCHEDULE_NEXT_RUN');
    for (const item of items) {
      const nextRun = parseInt(item.sk, 10);
      if (nextRun <= now) {
        await this.runSchedule(item.schedule_id);
      }
    }
  }

  async runSchedule(scheduleId) {
    const schedule = await getItem(`SCHEDULE#${scheduleId}`, 'META');
    if (!schedule) return;
    const worker = this.scheduler.selectWorker(schedule);
    if (!worker) return;
    await this.workerPool.startSandbox(worker.id, {
      sandboxId: `schedule-${scheduleId}-${Date.now()}`,
      image: schedule.image,
      cpu: schedule.cpu,
      memory: schedule.memory,
      gpu: schedule.gpu,
      timeout: schedule.timeout,
      schedule: true,
      cmd: schedule.cmd,
      scheduleId,
    });
    let next;
    if (schedule.schedule_type === 'cron') {
      next = parseExpression(schedule.schedule_value).next().getTime();
    } else {
      next = Date.now() + parseInt(schedule.schedule_value, 10) * 1000;
    }
    await updateItem(`SCHEDULE#${scheduleId}`, 'META', { next_run: next });
    await deleteItem('SCHEDULE_NEXT_RUN', String(schedule.next_run));
    await putItem({ pk: 'SCHEDULE_NEXT_RUN', sk: String(next), schedule_id: scheduleId });
  }
}

export default function cronEnginePlugin(app, opts, done) {
  const engine = new CronEngine(app.workerPool, app.scheduler);
  app.decorate('cronEngine', engine);
  engine.start();
  done();
}
