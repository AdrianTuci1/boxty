export class VolumeManager {
  async mount(volumeId, sandboxId, mountPath) {
    // Stub: instruct worker to S3-mount
    return { volumeId, sandboxId, mountPath, status: 'mounted' };
  }

  async unmount(volumeId, sandboxId) {
    return { volumeId, sandboxId, status: 'unmounted' };
  }
}

export default function volumeManagerPlugin(app, opts, done) {
  app.decorate('volumeManager', new VolumeManager());
  done();
}
