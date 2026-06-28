export class Workspace {
  constructor(
    private client: any,
    public id: string,
    public name: string,
    public ownerId: string,
  ) {}

  static fromContext(client: any): Workspace {
    throw new Error("Workspace.fromContext() requires runtime context");
  }

  members(): Promise<Record<string, unknown>[]> {
    return this.client.listInvites({ workspace_id: this.id });
  }

  billingReport(): Promise<Record<string, unknown>> {
    return this.client.billingReport({ workspace_id: this.id });
  }

  proxyTokens(): ProxyTokenManager {
    return new ProxyTokenManager(this.client, this.id);
  }

  delete(): Promise<{ deleted: boolean }> {
    return this.client.deleteWorkspace(this.id);
  }
}

export class ProxyTokenManager {
  constructor(
    private client: any,
    private workspaceId: string,
  ) {}

  create(name: string, allowedProviders?: string[], ttlSeconds?: number): Promise<Record<string, unknown>> {
    return this.client.createProxyToken(this.workspaceId, name, allowedProviders, ttlSeconds);
  }

  list(): Promise<Record<string, unknown>[]> {
    return this.client.listProxyTokens(this.workspaceId);
  }

  allow(tokenId: string): Promise<Record<string, unknown>> {
    return this.client.updateProxyToken(tokenId, "active");
  }

  revoke(tokenId: string): Promise<Record<string, unknown>> {
    return this.client.updateProxyToken(tokenId, "revoked");
  }

  delete(tokenId: string): Promise<{ deleted: boolean }> {
    return this.client.deleteProxyToken(tokenId);
  }
}

export class Environment {
  constructor(
    private client: any,
    public id: string,
    public name: string,
    public workspaceId: string,
  ) {}

  static fromContext(client: any): Environment {
    throw new Error("Environment.fromContext() requires runtime context");
  }

  static async fromName(client: any, workspaceId: string, name: string): Promise<Environment> {
    const envs = await client.environments(workspaceId);
    const env = envs.find((e: any) => e.name === name);
    if (!env) throw new Error(`Environment '${name}' not found`);
    return new Environment(client, env.id, env.name, workspaceId);
  }

  objects(): ObjectManager {
    return new ObjectManager(this.client, this.id);
  }

  members(): Promise<Record<string, unknown>[]> {
    return this.client.listEnvironmentMembers(this.id);
  }

  billingReport(): Promise<Record<string, unknown>> {
    return this.client.billingReport({ environment_id: this.id });
  }

  delete(): Promise<{ deleted: boolean }> {
    return this.client.deleteEnvironment(this.id);
  }
}

export class ObjectManager {
  constructor(
    private client: any,
    private environmentId: string,
  ) {}

  create(key: string, data: Uint8Array): Promise<Record<string, unknown>> {
    throw new Error("Environment objects not yet implemented");
  }

  list(prefix = ""): Promise<Record<string, unknown>[]> {
    throw new Error("Environment objects not yet implemented");
  }

  delete(key: string): Promise<Record<string, unknown>> {
    throw new Error("Environment objects not yet implemented");
  }
}

export class Secret {
  constructor(
    private client: any,
    public id: string,
    public name: string,
    public value: string,
  ) {}

  static async fromName(client: any, name: string): Promise<Secret> {
    const secrets = await client.secrets.list();
    const s = secrets.find((sec: any) => sec.name === name);
    if (!s) throw new Error(`Secret '${name}' not found`);
    return new Secret(client, s.id, s.name, s.value || "");
  }

  static async fromDict(client: any, data: Record<string, string>): Promise<Secret[]> {
    const secrets: Secret[] = [];
    for (const [name, value] of Object.entries(data)) {
      const s = await client.secrets.create(name, value);
      secrets.push(new Secret(client, s.id, s.name, value));
    }
    return secrets;
  }

  static async fromLocalEnviron(client: any, prefix = "BOXTY_"): Promise<Secret[]> {
    const data: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix) && value !== undefined) {
        data[key] = value;
      }
    }
    return Secret.fromDict(client, data);
  }

  objects(): ObjectManager {
    return new ObjectManager(this.client, this.id);
  }

  update(value: string): Promise<Record<string, unknown>> {
    return this.client.secrets.update(this.id, value);
  }

  info(): Promise<Record<string, unknown>> {
    return this.client.secrets.get(this.id);
  }

  delete(): Promise<{ deleted: boolean }> {
    return this.client.secrets.delete(this.id);
  }
}

export class Image {
  constructor(
    private client: any,
    public id: string | null,
    public name: string,
    public dockerfile: string | null = null,
    public baseImage: string | null = null,
  ) {}

  static debianSlim(client: any, pythonVersion = "3.11"): Image {
    return new Image(client, null, `debian-slim-python${pythonVersion}`, null, `python:${pythonVersion}-slim`);
  }

  static fromRegistry(client: any, tag: string): Image {
    return new Image(client, null, tag, null, tag);
  }

  static async fromId(client: any, imageId: string): Promise<Image> {
    const img = await client.getImage(imageId);
    return new Image(client, imageId, img.name || "", null, img.base_image);
  }

  build(): Promise<Record<string, unknown>> {
    return this.client.buildImage(this.name, this.dockerfile, this.baseImage);
  }

  pipInstall(...packages: string[]): Image {
    return this;
  }

  uvPipInstall(...packages: string[]): Image {
    return this;
  }

  pipInstallFromRequirements(path: string): Image {
    return this;
  }

  pipInstallFromPyproject(path: string): Image {
    return this;
  }

  poetryInstallFromFile(path: string): Image {
    return this;
  }

  uvSync(path: string): Image {
    return this;
  }

  addLocalFile(localPath: string, remotePath: string): Image {
    return this;
  }

  addLocalDir(localPath: string, remotePath: string): Image {
    return this;
  }

  addLocalPythonSource(moduleName: string, path: string): Image {
    return this;
  }
}

export class Sandbox {
  constructor(
    private client: any,
    public id: string,
    public workloadId: string,
    public token: string | null = null,
  ) {}

  static async create(client: any, workloadId: string, requesterId: string, ttlSeconds = 900): Promise<Sandbox> {
    const result = await client.createSandboxSession(workloadId, requesterId, ttlSeconds);
    return new Sandbox(client, result.id, workloadId, result.token || null);
  }

  static fromName(client: any, name: string): Promise<Sandbox> {
    throw new Error("Sandbox.fromName() not yet implemented");
  }

  static fromId(client: any, sandboxId: string): Promise<Sandbox> {
    throw new Error("Sandbox.fromId() not yet implemented");
  }

  async wait(timeout = 60): Promise<Sandbox> {
    const start = Date.now();
    while (Date.now() - start < timeout * 1000) {
      const workload = await this.client.getWorkload(this.workloadId);
      if (workload.status === "running" || workload.status === "ready") {
        return this;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error(`Sandbox ${this.id} did not become ready within ${timeout}s`);
  }

  waitUntilReady(timeout = 60): Promise<Sandbox> {
    return this.wait(timeout);
  }

  terminate(): Promise<{ deleted: boolean }> {
    return this.client.deleteWorkload(this.workloadId);
  }

  poll(): Promise<Record<string, unknown>> {
    return this.client.getWorkload(this.workloadId);
  }

  runCommand(command: string[], timeoutSeconds = 60): Promise<Record<string, unknown>> {
    return this.client.sandboxExec(this.id, command, timeoutSeconds);
  }

  getTunnels(): Promise<Record<string, unknown>[]> {
    return this.client.listSandboxTunnels(this.id);
  }

  createTunnel(port: number, protocol = "tcp"): Promise<Record<string, unknown>> {
    return this.client.createSandboxTunnel(this.id, port, protocol);
  }

  createConnectToken(): Promise<string> {
    throw new Error("Sandbox connect tokens not yet implemented");
  }

  snapshotFilesystem(): Promise<Record<string, unknown>> {
    throw new Error("Sandbox snapshots not yet implemented");
  }

  snapshotDirectory(path: string): Promise<Record<string, unknown>> {
    throw new Error("Sandbox snapshots not yet implemented");
  }

  mountImage(imageId: string, mountPoint: string): Promise<Record<string, unknown>> {
    throw new Error("Sandbox image mounts not yet implemented");
  }

  unmountImage(mountPoint: string): Promise<Record<string, unknown>> {
    throw new Error("Sandbox image mounts not yet implemented");
  }

  filesystem(): FileSystemManager {
    return new FileSystemManager(this.client, this.id, this.workloadId);
  }
}

export class FileSystemManager {
  constructor(
    private client: any,
    private sandboxId: string,
    private workloadId: string,
  ) {}

  copyFromLocal(localPath: string, remotePath: string): Promise<Record<string, unknown>> {
    throw new Error("Filesystem copy not yet implemented");
  }

  copyToLocal(remotePath: string, localPath: string): Promise<Record<string, unknown>> {
    throw new Error("Filesystem copy not yet implemented");
  }

  listFiles(path = "/"): Promise<Record<string, unknown>[]> {
    return this.client.listSandboxFiles(this.sandboxId, path);
  }

  copyFiles(files: Record<string, unknown>[]): Promise<Record<string, unknown>> {
    return this.client.copySandboxFiles(this.sandboxId, files);
  }
}

export class Function {
  constructor(
    private client: any,
    public name: string,
    private func: ((...args: unknown[]) => unknown) | null = null,
  ) {}

  static fromName(client: any, name: string): Function {
    return new Function(client, name);
  }

  remote(...args: unknown[]): Promise<unknown> {
    throw new Error("Function.remote() requires runtime context");
  }

  remoteGen(...args: unknown[]): Promise<unknown> {
    throw new Error("Function.remoteGen() requires runtime context");
  }

  local(...args: unknown[]): Promise<unknown> {
    if (!this.func) throw new Error("No local function bound");
    return Promise.resolve((this.func as any)(...args));
  }

  spawn(...args: unknown[]): Promise<unknown> {
    throw new Error("Function.spawn() requires runtime context");
  }

  map(inputs: unknown[]): Promise<unknown[]> {
    throw new Error("Function.map() requires runtime context");
  }

  starmap(inputs: unknown[][]): Promise<unknown[]> {
    throw new Error("Function.starmap() requires runtime context");
  }

  forEach(inputs: unknown[]): Promise<void> {
    throw new Error("Function.forEach() requires runtime context");
  }

  spawnMap(inputs: unknown[]): Promise<unknown[]> {
    throw new Error("Function.spawnMap() requires runtime context");
  }

  getWebUrl(): Promise<string> {
    throw new Error("Function.getWebUrl() not yet implemented");
  }

  withOptions(options: Record<string, unknown>): Function {
    return this;
  }

  withConcurrency(limit: number): Function {
    return this;
  }

  withBatching(maxSize: number, waitMs: number): Function {
    return this;
  }

  updateAutoscaler(minContainers = 0, maxContainers = 10): Promise<Record<string, unknown>> {
    return this.client.updateFunctionAutoscaler(this.name, minContainers, maxContainers);
  }

  getCurrentStats(): Promise<Record<string, unknown>> {
    return this.client.getFunctionStats(this.name);
  }
}

export class Volume {
  constructor(
    private client: any,
    public id: string,
    public name: string,
  ) {}

  static async fromName(client: any, name: string): Promise<Volume> {
    const volumes = await client.listVolumes();
    const v = volumes.find((vol: any) => vol.name === name);
    if (!v) throw new Error(`Volume '${name}' not found`);
    return new Volume(client, v.id, v.name);
  }

  static async fromId(client: any, volumeId: string): Promise<Volume> {
    const v = await client.getVolume(volumeId);
    return new Volume(client, volumeId, v.name || "");
  }

  static ephemeral(client: any, name: string): Promise<Volume> {
    throw new Error("Ephemeral volumes not yet implemented");
  }

  objects(): ObjectManager {
    return new ObjectManager(this.client, this.id);
  }

  commit(): Promise<Record<string, unknown>> {
    throw new Error("Volume commit not yet implemented");
  }

  async reload(): Promise<Volume> {
    const v = await this.client.getVolume(this.id);
    this.name = v.name || this.name;
    return this;
  }

  async listdir(path = "/"): Promise<string[]> {
    const entries = await this.client.listVolumeEntries(this.id, path);
    return entries.map((e: any) => e.path || "");
  }

  readFile(path: string): Promise<Uint8Array> {
    throw new Error("Volume readFile not yet implemented");
  }

  removeFile(path: string): Promise<Record<string, unknown>> {
    throw new Error("Volume removeFile not yet implemented");
  }

  copyFiles(src: string, dst: string): Promise<Record<string, unknown>> {
    throw new Error("Volume copyFiles not yet implemented");
  }

  batchUpload(files: Record<string, Uint8Array>): Promise<Record<string, unknown>> {
    throw new Error("Volume batchUpload not yet implemented");
  }

  rename(newName: string): Promise<Record<string, unknown>> {
    return this.client.updateVolume(this.id, { name: newName });
  }

  createSnapshot(name = "snapshot"): Promise<Record<string, unknown>> {
    return this.client.createVolumeSnapshot(this.id, name);
  }

  listSnapshots(): Promise<Record<string, unknown>[]> {
    return this.client.listVolumeSnapshots(this.id);
  }
}

export class Period {
  constructor(
    public seconds = 0,
    public minutes = 0,
    public hours = 0,
    public days = 0,
  ) {}

  get totalSeconds(): number {
    return this.seconds + this.minutes * 60 + this.hours * 3600 + this.days * 86400;
  }
}

export class Cron {
  constructor(public cronString: string) {}
}

export class Proxy {
  constructor(
    public host: string,
    public port: number,
  ) {}
}

export class Probe {
  constructor(
    public path = "/health",
    public interval = 30,
  ) {}
}

export class NetworkFileSystem {
  constructor(
    public name: string,
    public mountPath: string,
  ) {}
}

export class CloudBucketMount {
  constructor(
    public bucketName: string,
    public mountPath: string,
    public provider = "s3",
  ) {}
}
