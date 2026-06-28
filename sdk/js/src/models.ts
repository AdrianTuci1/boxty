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

  async members(): Promise<any[]> {
    return this.client.listInvites(this.id);
  }

  async billingReport(): Promise<any> {
    throw new Error("Workspace billing not yet implemented in backend");
  }

  proxyTokens(): ProxyTokenManager {
    return new ProxyTokenManager(this.client, this.id);
  }
}

export class ProxyTokenManager {
  constructor(
    private client: any,
    private workspaceId: string,
  ) {}

  async create(name: string): Promise<any> {
    throw new Error("Proxy tokens not yet implemented in backend");
  }

  async list(): Promise<any[]> {
    throw new Error("Proxy tokens not yet implemented in backend");
  }

  async allow(tokenId: string): Promise<any> {
    throw new Error("Proxy tokens not yet implemented in backend");
  }

  async revoke(tokenId: string): Promise<any> {
    throw new Error("Proxy tokens not yet implemented in backend");
  }

  async delete(tokenId: string): Promise<any> {
    throw new Error("Proxy tokens not yet implemented in backend");
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
    const envs = await client.listEnvironments(workspaceId);
    for (const env of envs) {
      if (env.name === name) {
        return new Environment(client, env.id, env.name, workspaceId);
      }
    }
    throw new Error(`Environment '${name}' not found in workspace ${workspaceId}`);
  }

  objects(): ObjectManager {
    return new ObjectManager(this.client, this.id);
  }

  async members(): Promise<any[]> {
    throw new Error("Environment RBAC not yet implemented in backend");
  }

  async billingReport(): Promise<any> {
    throw new Error("Environment billing not yet implemented in backend");
  }
}

export class ObjectManager {
  constructor(
    private client: any,
    private id: string,
  ) {}

  async create(key: string, data: Uint8Array): Promise<any> {
    throw new Error("Environment objects not yet implemented in backend");
  }

  async list(prefix = ""): Promise<any[]> {
    throw new Error("Environment objects not yet implemented in backend");
  }

  async delete(key: string): Promise<any> {
    throw new Error("Environment objects not yet implemented in backend");
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
    const secrets = await client.listSecrets();
    for (const s of secrets) {
      if (s.name === name) {
        return new Secret(client, s.id, s.name, s.value || "");
      }
    }
    throw new Error(`Secret '${name}' not found`);
  }

  static async fromDict(client: any, data: Record<string, string>): Promise<Secret[]> {
    const secrets: Secret[] = [];
    for (const [name, value] of Object.entries(data)) {
      const s = await client.createSecret(name, value);
      secrets.push(new Secret(client, s.id, s.name, value));
    }
    return secrets;
  }

  static async fromLocalEnviron(client: any, prefix = "BOXTY_"): Promise<Secret[]> {
    const data: Record<string, string> = {};
    if (typeof process !== "undefined") {
      for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith(prefix) && value !== undefined) {
          data[key] = value;
        }
      }
    }
    return Secret.fromDict(client, data);
  }

  async update(value: string): Promise<any> {
    return this.client.updateSecret(this.id, value);
  }

  async info(): Promise<any> {
    return this.client.getSecret(this.id);
  }
}

export class Image {
  constructor(
    private client: any,
    public id: string | null,
    public name: string,
    public dockerfile?: string,
    public baseImage?: string,
  ) {}

  static debianSlim(client: any, pythonVersion = "3.11"): Image {
    return new Image(client, null, `debian-slim-python${pythonVersion}`, undefined, `python:${pythonVersion}-slim`);
  }

  static fromRegistry(client: any, tag: string): Image {
    return new Image(client, null, tag, undefined, tag);
  }

  static async fromId(client: any, imageId: string): Promise<Image> {
    const img = await client.getImage(imageId);
    return new Image(client, imageId, img.name || "", undefined, img.base_image);
  }

  async build(): Promise<any> {
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
    public token?: string,
  ) {}

  static async create(
    client: any,
    workloadId: string,
    requesterId: string,
    ttlSeconds = 900,
  ): Promise<Sandbox> {
    const result = await client.createSandboxSession(workloadId, requesterId, ttlSeconds);
    return new Sandbox(client, result.id, workloadId, result.token);
  }

  static async fromName(client: any, name: string): Promise<Sandbox> {
    throw new Error("Sandbox.fromName() not yet implemented");
  }

  static async fromId(client: any, sandboxId: string): Promise<Sandbox> {
    throw new Error("Sandbox.fromId() not yet implemented");
  }

  async wait(timeout = 60000): Promise<Sandbox> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const workload = await this.client.getWorkload(this.workloadId);
      if (workload.status === "running" || workload.status === "ready") {
        return this;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    throw new Error(`Sandbox ${this.id} did not become ready within ${timeout}ms`);
  }

  async waitUntilReady(timeout = 60000): Promise<Sandbox> {
    return this.wait(timeout);
  }

  async terminate(): Promise<any> {
    return this.client.deleteWorkload(this.workloadId);
  }

  async poll(): Promise<any> {
    return this.client.getWorkload(this.workloadId);
  }

  async exec(command: string[]): Promise<any> {
    throw new Error("Sandbox.exec() not yet implemented in backend");
  }

  async tunnels(): Promise<any[]> {
    throw new Error("Sandbox tunnels not yet implemented in backend");
  }

  async createConnectToken(): Promise<string> {
    throw new Error("Sandbox connect tokens not yet implemented");
  }

  async snapshotFilesystem(): Promise<any> {
    throw new Error("Sandbox snapshots not yet implemented");
  }

  async snapshotDirectory(path: string): Promise<any> {
    throw new Error("Sandbox snapshots not yet implemented");
  }

  async mountImage(imageId: string, mountPoint: string): Promise<any> {
    throw new Error("Sandbox image mounts not yet implemented");
  }

  async unmountImage(mountPoint: string): Promise<any> {
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

  async copyFromLocal(localPath: string, remotePath: string): Promise<any> {
    throw new Error("Filesystem copy not yet implemented");
  }

  async copyToLocal(remotePath: string, localPath: string): Promise<any> {
    throw new Error("Filesystem copy not yet implemented");
  }
}

export class Function {
  constructor(
    private client: any,
    public name: string,
    private fn?: (...args: any[]) => any,
  ) {}

  static async fromName(client: any, name: string): Promise<Function> {
    return new Function(client, name);
  }

  async remote(...args: any[]): Promise<any> {
    throw new Error("Function.remote() requires runtime context");
  }

  async remoteGen(...args: any[]): Promise<any> {
    throw new Error("Function.remoteGen() requires runtime context");
  }

  local(...args: any[]): any {
    if (!this.fn) throw new Error("No local function bound");
    return this.fn(...args);
  }

  async spawn(...args: any[]): Promise<any> {
    throw new Error("Function.spawn() requires runtime context");
  }

  async map(inputs: any[]): Promise<any[]> {
    throw new Error("Function.map() requires runtime context");
  }

  async starmap(inputs: any[][]): Promise<any[]> {
    throw new Error("Function.starmap() requires runtime context");
  }

  async forEach(inputs: any[]): Promise<void> {
    throw new Error("Function.forEach() requires runtime context");
  }

  async spawnMap(inputs: any[]): Promise<any[]> {
    throw new Error("Function.spawnMap() requires runtime context");
  }

  getWebUrl(): string {
    throw new Error("Function.getWebUrl() not yet implemented");
  }

  withOptions(options: any): Function {
    return this;
  }

  withConcurrency(limit: number): Function {
    return this;
  }

  withBatching(maxSize: number, waitMs: number): Function {
    return this;
  }

  async updateAutoscaler(minContainers: number, maxContainers: number): Promise<any> {
    throw new Error("Autoscaler not yet implemented in backend");
  }

  async getCurrentStats(): Promise<any> {
    throw new Error("Function stats not yet implemented");
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
    for (const v of volumes) {
      if (v.name === name) {
        return new Volume(client, v.id, v.name);
      }
    }
    throw new Error(`Volume '${name}' not found`);
  }

  static async fromId(client: any, volumeId: string): Promise<Volume> {
    const v = await client.getVolume(volumeId);
    return new Volume(client, volumeId, v.name || "");
  }

  static async ephemeral(client: any, name: string): Promise<Volume> {
    throw new Error("Ephemeral volumes not yet implemented");
  }

  objects(): ObjectManager {
    return new ObjectManager(this.client, this.id);
  }

  async commit(): Promise<any> {
    throw new Error("Volume commit not yet implemented");
  }

  async reload(): Promise<Volume> {
    const v = await this.client.getVolume(this.id);
    this.name = v.name || this.name;
    return this;
  }

  async listdir(path = "/"): Promise<string[]> {
    throw new Error("Volume listdir not yet implemented");
  }

  async readFile(path: string): Promise<Uint8Array> {
    throw new Error("Volume readFile not yet implemented");
  }

  async removeFile(path: string): Promise<any> {
    throw new Error("Volume removeFile not yet implemented");
  }

  async copyFiles(src: string, dst: string): Promise<any> {
    throw new Error("Volume copyFiles not yet implemented");
  }

  async batchUpload(files: Record<string, Uint8Array>): Promise<any> {
    throw new Error("Volume batchUpload not yet implemented");
  }

  async rename(newName: string): Promise<any> {
    return this.client.updateVolume(this.id, { name: newName });
  }
}

export class Period {
  seconds: number;

  constructor(seconds = 0, minutes = 0, hours = 0, days = 0) {
    this.seconds = seconds + minutes * 60 + hours * 3600 + days * 86400;
  }

  toString(): string {
    return `Period(seconds=${this.seconds})`;
  }
}

export class Cron {
  constructor(public cronString: string) {}

  toString(): string {
    return `Cron('${this.cronString}')`;
  }
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
