export class CloudProvider {
  async launchWorker(provider, region) {
    // Stub: launch spot instance
    return { id: `worker-${Date.now()}`, provider, region, host: '127.0.0.1' };
  }

  async terminateWorker(workerId) {
    return { status: 'terminated' };
  }
}

export default function cloudProviderPlugin(app, opts, done) {
  app.decorate('cloudProvider', new CloudProvider());
  done();
}
