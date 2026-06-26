/**
 * Declarative API for Boxty — define your deployment entirely in code.
 *
 * Usage:
 *   import { BoxtyApp, Image, Volume, Secret } from "@boxty/sdk/app";
 *
 *   const app = new BoxtyApp("my-app");
 *
 *   const vol = Volume.fromName("model-weights");
 *   const secret = Secret.fromName("huggingface-token");
 *   const image = Image.debianSlim().pipInstall("fastapi");
 *
 *   app.function({
 *     name: "my-handler",
 *     image,
 *     volumes: { "/data": vol },
 *     secrets: [secret],
 *     handler: async () => { ... }
 *   });
 *
 *   app.webEndpoint({
 *     name: "serve",
 *     port: 8000,
 *     image,
 *     handler: () => { ... }
 *   });
 */

// ---------------------------------------------------------------------------
// Resource types
// ---------------------------------------------------------------------------

export interface VolumeManifest {
  name: string;
  persistent: boolean;
  sizeGb: number;
  type: string;
  createIfMissing: boolean;
}

/**
 * A persistent volume that survives across deployments.
 * Use for data that must outlive individual sandbox runs.
 *
 * Contrast with ``Mount``, which is ephemeral workspace.
 */
export class Volume {
  constructor(
    public name: string,
    public persistent: boolean = true,
    public sizeGb = 10,
    public volumeType: string = "block-storage",
    public createIfMissing = true,
  ) {}

  static fromName(name: string, opts: Partial<Omit<Volume, "name" | "persistent">> = {}): Volume {
    return new Volume(name, true, opts.sizeGb, opts.volumeType, opts.createIfMissing);
  }

  static persisted(name: string, opts: Partial<Omit<Volume, "name" | "persistent">> = {}): Volume {
    return new Volume(name, true, opts.sizeGb, opts.volumeType, opts.createIfMissing);
  }

  toManifest(): VolumeManifest {
    return {
      name: this.name,
      persistent: this.persistent,
      sizeGb: this.sizeGb,
      type: this.volumeType,
      createIfMissing: this.createIfMissing,
    };
  }
}

export interface MountManifest {
  localDir: string;
  remotePath: string;
  include?: string[];
  exclude?: string[];
}

/**
 * An ephemeral mount of local files into the sandbox workspace.
 * Files are uploaded per-run and destroyed afterwards.
 *
 * Contrast with ``Volume``, which is persistent storage.
 */
export class Mount {
  constructor(
    public localDir: string = ".",
    public remotePath: string = "/workspace",
    public include: string[] = [],
    public exclude: string[] = [],
  ) {}

  static fromLocalDir(
    localDir: string = ".",
    opts: { remotePath?: string; include?: string[]; exclude?: string[] } = {},
  ): Mount {
    return new Mount(
      localDir,
      opts.remotePath ?? "/workspace",
      opts.include ?? [],
      opts.exclude ?? [],
    );
  }

  toManifest(): MountManifest {
    const m: MountManifest = {
      localDir: this.localDir,
      remotePath: this.remotePath,
    };
    if (this.include.length) m.include = this.include;
    if (this.exclude.length) m.exclude = this.exclude;
    return m;
  }
}

export interface SecretManifest {
  name: string;
  createIfMissing: boolean;
}

export class Secret {
  constructor(
    public name: string,
    public createIfMissing = true,
  ) {}

  static fromName(name: string, opts: Partial<Omit<Secret, "name">> = {}): Secret {
    return new Secret(name, opts.createIfMissing);
  }

  toManifest(): SecretManifest {
    return { name: this.name, createIfMissing: this.createIfMissing };
  }
}

export interface ImageManifest {
  base: string;
  pipPackages?: string[];
  runCommands?: string[];
  pythonVersion?: string;
  aptPackages?: string[];
  env?: Record<string, string>;
}

export class Image {
  private pipPackages: string[] = [];
  private runCommands: string[] = [];
  private aptPackages: string[] = [];
  private envVars: Record<string, string> = {};
  private pythonVer: string | undefined;

  constructor(private base: string) {}

  static debianSlim(): Image {
    return new Image("debian:slim");
  }

  static fromDockerfile(tag: string): Image {
    return new Image(tag);
  }

  pipInstall(...packages: string[]): this {
    this.pipPackages.push(...packages);
    return this;
  }

  runCommand(...commands: string[]): this {
    this.runCommands.push(...commands);
    return this;
  }

  env(vars: Record<string, string>): this {
    Object.assign(this.envVars, vars);
    return this;
  }

  pythonVersion(version: string): this {
    this.pythonVer = version;
    return this;
  }

  aptInstall(...packages: string[]): this {
    this.aptPackages.push(...packages);
    return this;
  }

  toManifest(): ImageManifest {
    const m: ImageManifest = { base: this.base };
    if (this.pipPackages.length) m.pipPackages = this.pipPackages;
    if (this.runCommands.length) m.runCommands = this.runCommands;
    if (this.pythonVer) m.pythonVersion = this.pythonVer;
    if (this.aptPackages.length) m.aptPackages = this.aptPackages;
    if (Object.keys(this.envVars).length) m.env = this.envVars;
    return m;
  }
}

// ---------------------------------------------------------------------------
// Function / Endpoint definitions
// ---------------------------------------------------------------------------

export interface FunctionManifest {
  name: string;
  timeout: number;
  image?: ImageManifest;
  mounts?: MountManifest[];
  volumes?: Record<string, VolumeManifest>;
  secrets?: SecretManifest[];
  gpu?: string;
}

export interface WebEndpointManifest {
  name: string;
  port: number;
  timeout: number;
  public: boolean;
  image?: ImageManifest;
  mounts?: MountManifest[];
  volumes?: Record<string, VolumeManifest>;
  secrets?: SecretManifest[];
  gpu?: string;
}

export interface FunctionConfig {
  name: string;
  handler: (...args: unknown[]) => unknown | Promise<unknown>;
  image?: Image;
  mounts?: Mount[];
  volumes?: Record<string, Volume>;
  secrets?: Secret[];
  timeout?: number;
  gpu?: string;
}

export interface WebEndpointConfig {
  name: string;
  handler: () => void | Promise<void>;
  port?: number;
  image?: Image;
  mounts?: Mount[];
  volumes?: Record<string, Volume>;
  secrets?: Secret[];
  timeout?: number;
  gpu?: string;
  public?: boolean;
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export interface AppManifest {
  name: string;
  image: null;
  volumes: VolumeManifest[];
  secrets: SecretManifest[];
  functions: FunctionManifest[];
  endpoints: WebEndpointManifest[];
}

export class BoxtyApp {
  private functions: FunctionConfig[] = [];
  private endpoints: WebEndpointConfig[] = [];
  private volumes: Map<string, Volume> = new Map();
  private secrets: Secret[] = [];

  constructor(public name: string) {}

  /** Register a serverless function. */
  function(config: FunctionConfig): this {
    this.functions.push(config);
    return this;
  }

  /** Register an HTTP endpoint (starts an HTTP server on the given port). */
  webEndpoint(config: WebEndpointConfig): this {
    this.endpoints.push(config);
    return this;
  }

  /** Create and register a volume. */
  volume(
    name: string,
    sizeGb = 10,
    volumeType: string = "block-storage",
    createIfMissing = true,
  ): Volume {
    const vol = new Volume(name, true, sizeGb, volumeType, createIfMissing);
    this.volumes.set(name, vol);
    return vol;
  }

  /** Create and register a secret. */
  secret(name: string, createIfMissing = true): Secret {
    const s = new Secret(name, createIfMissing);
    this.secrets.push(s);
    return s;
  }

  // -- manifest ---------------------------------------------------------------

  toManifest(): AppManifest {
    const fnManifests: FunctionManifest[] = this.functions.map((f) => {
      const m: FunctionManifest = {
        name: f.name,
        timeout: f.timeout ?? 300,
      };
      if (f.image) m.image = f.image.toManifest();
      if (f.mounts?.length) m.mounts = f.mounts.map((mount) => mount.toManifest());
      if (f.volumes) {
        m.volumes = {};
        for (const [mount, vol] of Object.entries(f.volumes)) {
          m.volumes[mount] = vol.toManifest();
        }
      }
      if (f.secrets?.length) m.secrets = f.secrets.map((s) => s.toManifest());
      if (f.gpu) m.gpu = f.gpu;
      return m;
    });

    const epManifests: WebEndpointManifest[] = this.endpoints.map((e) => {
      const m: WebEndpointManifest = {
        name: e.name,
        port: e.port ?? 8000,
        timeout: e.timeout ?? 300,
        public: e.public ?? true,
      };
      if (e.image) m.image = e.image.toManifest();
      if (e.mounts?.length) m.mounts = e.mounts.map((mount) => mount.toManifest());
      if (e.volumes) {
        m.volumes = {};
        for (const [mount, vol] of Object.entries(e.volumes)) {
          m.volumes[mount] = vol.toManifest();
        }
      }
      if (e.secrets?.length) m.secrets = e.secrets.map((s) => s.toManifest());
      if (e.gpu) m.gpu = e.gpu;
      return m;
    });

    return {
      name: this.name,
      image: null,
      volumes: [...this.volumes.values()].map((v) => v.toManifest()),
      secrets: this.secrets.map((s) => s.toManifest()),
      functions: fnManifests,
      endpoints: epManifests,
    };
  }

  toManifestJson(): string {
    return JSON.stringify(this.toManifest(), null, 2);
  }

  // -- runtime ----------------------------------------------------------------

  /** Run the app locally — serves the first web endpoint. */
  run(): void {
    const endpointName = typeof process !== "undefined"
      ? process.env?.BOXTY_RUN_ENDPOINT
      : undefined;

    if (endpointName) {
      const ep = this.endpoints.find((e) => e.name === endpointName);
      if (ep) {
        ep.handler();
        return;
      }
      console.error(`Error: endpoint '${endpointName}' not found in app`);
      if (typeof process !== "undefined") process.exit(1);
      return;
    }

    if (this.endpoints.length > 0) {
      this.endpoints[0].handler();
    } else {
      console.error("Error: no web endpoints defined in app");
      if (typeof process !== "undefined") process.exit(1);
    }
  }
}
