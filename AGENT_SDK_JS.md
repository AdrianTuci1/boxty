# Agent: Boxty Node.js SDK

## Rol
SDK-ul JavaScript/TypeScript pe care userii îl instalează cu `npm install boxty`. Include client API și CLI.

## Director de lucru
`/Users/adriantucicovenco/Proiecte/boxty/sdk-js/`

## Tech Stack
- **Runtime**: Node.js 18+ (ES modules)
- **Language**: TypeScript 5+
- **HTTP**: native `fetch` (Node 18+) sau `undici`
- **WebSocket**: `ws`
- **CLI**: `commander` sau `oclif`
- **Build**: `tsc` + `package.json`

## Sandbox API

```typescript
import { Client, Sandbox } from 'boxty';

const client = new Client({ apiKey: 'bxty_...' });

// Create sandbox
const sandbox = await client.createSandbox({
  image: 'pytorch:latest',
  cpu: 4,
  memory: 16384,
  gpu: 'A100',
  timeout: 3600,
});
console.log(sandbox.url); // https://sandbox-abc.boxty.dev

// Execute command
const result = await sandbox.exec('python train.py --epochs=10');
console.log(result.stdout);

// Event emitter for streaming
sandbox.on('stdout', (data) => process.stdout.write(data));
sandbox.on('stderr', (data) => process.stderr.write(data));

// Port forwarding
const url = await sandbox.forward(8080);
console.log(`Jupyter at ${url}`);

// Snapshots
await sandbox.checkpoint('experiment-3');
const restored = await Sandbox.restore('experiment-3');
```

### Image Building (server-side)

```typescript
import { Image } from 'boxty';

// Method chaining — ca Modal Image
const image = new Image('python:3.12-slim')
  .pipInstall('torch', 'transformers')
  .aptInstall('ffmpeg')
  .env({ HF_HOME: '/cache' })
  .copy('./train.py', '/app/train.py')
  .run('echo hello && whoami');

// Build pe worker Boxty
const imageUrl = await image.build();
// => 'registry.boxty.dev/user123/train-job:a1b2c3'

// Folosire
const sandbox = await client.createSandbox({ image: imageUrl, ... });
```

### Interfețe TypeScript

```typescript
interface ClientOptions {
  apiKey?: string;
  baseUrl?: string; // default: https://api.boxty.dev
}

interface SandboxOptions {
  image: string;
  cpu?: number;
  memory?: number; // MB
  gpu?: string;
  timeout?: number; // seconds
  diskSizeGb?: number;  // ephemeral storage, default 10GB
  volume?: string;      // optional persistent volume name
  volumeMountPath?: string; // mount point, default /mnt/volume
}

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

class Image {
  constructor(baseImage?: string);
  
  pipInstall(...packages: string[]): this;
  aptInstall(...packages: string[]): this;
  env(vars: Record<string, string>): this;
  copy(source: string, dest: string): this;
  run(cmd: string): this;
  
  build(name?: string): Promise<string>;          // sync: returnează imageUrl
  buildAsync(name?: string): Promise<ImageBuild>; // async: obiect cu wait()
  
  static fromDockerfile(path: string, context?: string): Image;
}

class ImageBuild {
  id: string;
  imageUrl: string | null;
  status: 'building' | 'done' | 'failed';
  error?: string;
  
  wait(): Promise<string>; // polling până e gata, returnează imageUrl
}

class Client {
  constructor(options: ClientOptions);
  
  createSandbox(options: SandboxOptions): Promise<Sandbox>;
  listSandboxes(): Promise<Sandbox[]>;
  getSandbox(id: string): Promise<Sandbox>;
  deleteSandbox(id: string): Promise<void>;
  
  buildImage(name: string, baseImage: string, commands: string[]): Promise<ImageBuild>;
  listImages(): Promise<ImageBuild[]>;
  deleteImage(id: string): Promise<void>;
  
  balance(): Promise<number>;
  usage(): Promise<UsageReport>;
  buyCredits(amount: number): Promise<string>; // checkout URL
  
  createSecret(name: string, value: string): Promise<Secret>;
  listSecrets(): Promise<Secret[]>;
  deleteSecret(name: string): Promise<void>;
  
  createSchedule(options: ScheduleOptions): Promise<Schedule>;
  listSchedules(): Promise<Schedule[]>;
  deleteSchedule(id: string): Promise<void>;
  triggerSchedule(id: string): Promise<void>;
}

interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface Environment {
  id: string;
  name: string;
  type: 'development' | 'staging' | 'production';
  workspaceId: string;
}

interface AppOptions {
  workspaceId: string;
  envId: string;
  name: string;
  description?: string;
  image: string;
  cpu?: number;
  memory?: number;
  gpu?: string;
  timeout?: number;
}

class App {
  id: string;
  name: string;
  status: 'active' | 'stopped' | 'deploying';
  url: string | null;
  createdAt: string;
  
  stop(): Promise<void>;
  deploy(options?: Partial<SandboxOptions>): Promise<Deployment>;
  sandboxes(): Promise<Sandbox[]>;
  deployments(): Promise<Deployment[]>;
  metrics(): Promise<AppMetrics>;
  usage(): Promise<UsageReport>;
  logs(): Promise<string[]>;
  delete(): Promise<void>;
}

interface AppMetrics {
  totalSandboxes: number;
  activeSandboxes: number;
  cpu: { max: number; avg: number; totalHours: number };
  memory: { maxMb: number; avgMb: number };
  gpu: { maxUtilPct: number; avgUtilPct: number; totalHours: number };
  network: { totalRxGb: number; totalTxGb: number };
  totalCost: number;
}

interface SandboxMetrics {
  startedAt: string;
  finishedAt: string;
  bootDurationMs: number;
  cpu: { maxPct: number; avgPct: number; usageSeconds: number };
  memory: { maxMb: number; avgMb: number };
  network: { rxBytes: number; txBytes: number };
  gpu?: { maxUtilPct: number; avgUtilPct: number; memoryMb: number };
}

class Sandbox extends EventEmitter {
  id: string;
  status: 'running' | 'stopped' | 'snapshotted';
  url: string;
  startedAt?: string;
  finishedAt?: string;
  bootDurationMs?: number;
  
  exec(command: string, timeout?: number): Promise<ExecResult>;
  forward(port: number): Promise<string>; // returns URL
  checkpoint(name: string): Promise<Snapshot>;
  stop(): Promise<void>;
  metrics(): Promise<SandboxMetrics>;
  
  // WebSocket stream events:
  on('stdout', (data: string) => void);
  on('stderr', (data: string) => void);
  on('exit', (code: number) => void);
  
  attachSecrets(secretNames: string[]): Promise<void>;
  
  static restore(snapshotKey: string): Promise<Sandbox>;
}

interface ScheduleOptions {
  name: string;
  scheduleType: 'cron' | 'period';
  scheduleValue: string | number;  // cron expr sau secunde
  functionName: string;
  args?: any;
  image?: string;
  cpu?: number;
  memory?: number;
  gpu?: string;
  timeout?: number;
  secrets?: string[];
}

class Schedule {
  id: string;
  name: string;
  scheduleType: 'cron' | 'period';
  scheduleValue: string | number;
  nextRun: string;
  status: 'active' | 'paused';
  
  delete(): Promise<void>;
  trigger(): Promise<void>;
}

class Secret {
  name: string;
  createdAt: string;
  // NU expune valoarea
}

// Web Endpoint API (opțional — poate fi mai simplu ca în Python)
class Deployment {
  id: string;
  url: string;
  status: 'deploying' | 'active' | 'failed';
  
  invoke(args: any): Promise<any>;
  map(inputs: any[]): AsyncIterable<any>;
  destroy(): Promise<void>;
}
```

## CLI

```bash
npx boxty run app.js              # rulează script în cloud
npx boxty deploy app.js            # deploy ca serviciu web
npx boxty shell                    # sandbox interactiv
npx boxty exec <id> "cmd"         # execută comandă
npx boxty ls                       # listează sandbox-uri
npx boxty logs <id>               # tail stdout/stderr
npx boxty stop <id>               # oprește sandbox
npx boxty cp <id>:/path ./local   # copiază fișiere
npx boxty forward <id> 8080       # port forward
npx boxty login                    # autentificare
npx boxty whoami                  # user info
npx boxty billing                 # istoric consum
npx boxty secret create <name>    # creează secret
npx boxty secret ls
npx boxty secret rm <name>
npx boxty schedule create         # creează scheduled job
npx boxty schedule ls
npx boxty schedule rm <id>
npx boxty schedule trigger <id>   # rulează acum
npx boxty image build            # build imagine din specificație
npx boxty image ls               # listează imaginile userului
npx boxty image rm <id>          # șterge imagine din registry
npx boxty workspace create <name>  # creează workspace
npx boxty workspace ls             # listează workspace-uri
npx boxty app create <name>        # creează App (interactiv)
npx boxty app ls                  # listează App-urile
npx boxty app stop <id>           # oprește toate sandbox-urile App-ului
npx boxty app logs <id>           # aggregated logs App
npx boxty app metrics <id>        # metrics App
```

## Structura fișierelor de creat

```
sdk-js/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts              # public exports
│   ├── client.ts             # Client class
│   ├── sandbox.ts            # Sandbox class
│   ├── types.ts              # interfaces + types
│   ├── errors.ts             # custom errors
│   └── cli/
│       ├── index.ts          # CLI entry (commander)
│   │   ├── sandbox.ts        # sandbox commands
│   │   ├── billing.ts        # billing commands
│   │   ├── auth.ts           # login, logout, whoami
│   │   ├── workspace.ts      # workspace commands
│   │   └── app.ts            # app commands
├── examples/
│   ├── train.js
│   └── deploy.js
└── test/
    └── client.test.ts
```

## Contract cu API-ul

La fel ca Python SDK — face call-uri la același API Node.js (`https://api.boxty.dev`).

- Autentificare: `Authorization: Bearer <api_key>`
- JSON request/response
- WebSocket: `wss://{worker-host}:9002/{sandbox-id}`

## CLI Note

CLI-ul poate fi mai simplu decât cel Python — aceleași comenzi de bază (run, deploy, shell, exec, ls, logs, stop, forward, login, whoami). CLI-ul e accesibil și via `npx boxty`.

## Reguli
- TypeScript strict mode
- ES modules (`"type": "module"` în package.json)
- Documentație JSDoc pe toate exporturile
- `package.json` cu bin entry pentru CLI
- Nu se rulează teste live
