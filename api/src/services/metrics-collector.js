import { putItem } from '../db/schema.js';

export class MetricsCollector {
  async recordSandboxMetrics(sandboxId, metrics) {
    await putItem({
      pk: `SANDBOX#${sandboxId}`,
      sk: `METRICS#${Date.now()}`,
      ...metrics,
      created_at: new Date().toISOString(),
    });
  }

  async recordAppMetrics(appId, metrics) {
    await putItem({
      pk: `APP#${appId}`,
      sk: `METRICS#${Date.now()}`,
      ...metrics,
      created_at: new Date().toISOString(),
    });
  }
}

export default function metricsCollectorPlugin(app, opts, done) {
  app.decorate('metricsCollector', new MetricsCollector());
  done();
}
