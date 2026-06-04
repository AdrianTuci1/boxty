export class VolumeManager {
  async mount(volumeId, sandboxId, mountPath) {
    // Real implementation: instruct worker to S3-mount via FUSE or bind mount
    return { volumeId, sandboxId, mountPath, status: 'mounted', method: 's3-fuse' };
  }

  async unmount(volumeId, sandboxId) {
    return { volumeId, sandboxId, status: 'unmounted' };
  }
}

export default function volumeManagerPlugin(app, opts, done) {
  app.decorate('volumeManager', new VolumeManager());
  done();
}
