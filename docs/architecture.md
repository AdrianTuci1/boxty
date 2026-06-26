# Boxty Architecture

## High-Level Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  User    │────▶│   Gateway    │────▶│   API        │────▶│  Worker Pool     │
│  Browser │     │  (Go, TLS)   │     │  (Fastify)   │     │  (Go agents)     │
│  HTTPS   │     │  *.boxty.dev │     │              │     │                  │
└──────────┘     └──────┬───────┘     └──────┬───────┘     └────────┬─────────┘
                        │                     │                      │
      Sandbox URL       │  Internal routes    │  DynamoDB             │  runsc
      abc123-8080       │  + cold start       │  (state)              │  containers
      .boxty.dev        │                     │                      │
                                                                    ▼
                                                             ┌──────────────┐
                                                             │  S3 / ECR    │
                                                             │  images,     │
                                                             │  volumes,    │
                                                             │  snapshots   │
                                                             └──────────────┘
```

### Request Flow

1. Client connects to `https://<sandboxId>-<port>.boxty.dev`
2. Gateway terminates TLS, parses sandboxId from Host header
3. Gateway looks up sandboxId → worker IP in local cache
4. Cache miss → Gateway asks API: `GET /internal/route/:sandboxId`
5. If sandbox is stopped → API performs cold start (creates sandbox on a worker)
6. Gateway returns worker IP, forwards TCP to `worker:9003`
7. Worker TCP proxy routes to the correct container port
8. After idle timeout (300s default), worker stops sandbox + notifies API → gateway cache cleared

## Components

### API Server (`api/`) — Node.js, Fastify

Poartă de intrare pentru toate interacțiunile. Oferă:

- **Auth**: register, login (JWT), API key management, RBAC middleware
- **Sandbox lifecycle**: create, start, stop, terminate, metrics, logs
- **Resources**: workspaces, environments, apps, volumes, secrets, schedules, deployments
- **Billing**: per-second usage tracking, Stripe integration, balance
- **Scheduling**: capacity management, worker selection, provisioning triggers
- **WebSocket**: real-time sandbox streams (stdout/stderr)

Serviciile interne sunt în `api/src/services/` și se înregistrează ca plugin-uri Fastify:
- `cloud-provider.js` — provisioning VM-uri pe AWS/GCP/Azure (AWS SDK real)
- `capacity-manager.js` — coadă de cereri + auto-scale
- `worker-pool.js` — tracking workers activi, selectare
- `billing-engine.js` — calcul per-second cost
- `scheduler.js` — matching sandbox → worker
- `cron-engine.js` — scheduled sandboxes
- `image-builder.js` — proxy către worker pentru build-uri
- `volume-manager.js` — S3-backed volume persistence
- `metrics-collector.js` — aggregation from workers

### Gateway (`gateway/`) — Go

Reverse proxy public care asigură accesul la sandbox-uri:

- **TLS termination**: wildcard certificate `*.boxty.dev`
- **Route resolution**: parsează Host header → sandboxId + port
- **Route cache**: în memorie, notificat de API la start/stop
- **API fallback**: cache miss → `GET /internal/route/:sandboxId` (API face cold start)
- **TCP forwarding**: trimite conexiunea brută la `worker_host:9003`
- **Admin endpoints**: `/health`, `/internal/route/upsert` (key auth)

### Worker Agent (`worker/`) — Go

Rulează pe fiecare VM de worker. Responsabilități:

- **Sandbox manager**: creează containere (runc) cu izolare gVisor
- **Image builder**: `docker build && docker push` la registry
- **TCP tunnel**: port forwarding către sandbox-uri
- **Metrics**: /proc polling — CPU, memory, disk I/O
- **Secrets injector**: mount env vars din API
- **Registry**: webhook-uri de stare build
- **Cloud init**: self-registration la API la boot

### Internal API Endpoints

Aceste endpoint-uri nu sunt expuse public — sunt folosite intern de gateway și workeri:

- `GET /internal/route/:sandboxId` — Gateway cere locația unui sandbox. Dacă e oprit, face cold start.
- `POST /internal/gateway/upsert` — Gateway primește notificări de rutare de la API.
- `POST /internal/sandbox/:id/stopped` — Worker notifică API când oprește un sandbox (idle timeout).

### Python SDK (`sdk-py/`)

```python
import boxty as bx

client = bx.Client(api_key="boxty_xxx")  # sau citit din ~/.boxty/config.json

# Workspaces & RBAC
ws = client.create_workspace("my-team")
env = client.create_environment(ws.id, "staging")

# Sandbox-uri
s = client.create_sandbox(image="pytorch:latest", gpu="A100")
s.exec("python train.py")
s.delete()

# Apps (namespace + instance configs)
app = client.create_app(ws.id, env.id, "api", image="nginx:latest")
inst = client.create_instance(app.id, "cpu-small", cpu=2, memory=4096)
client.deploy_app(app.id, inst.id)

# CLI
# boxty login boxty_xxx
# boxty shell <sandbox_id>
# boxty run train.py
# boxty logs <sandbox_id>
```

### TypeScript SDK (`sdk-js/`)

Aceleași capabilități ca Python SDK, în TypeScript. Config citit din `~/.boxty/config.json`.

### Web Dashboard (`web/`) — React + Vite + Tailwind

- **Login / Register** — autentificare cu redirect
- **Dashboard** — overview sandbox-uri, apps, usage
- **Settings** — generare/listare/ștergere API keys
- **Sandbox-uri** — create, exec, logs, metrics
- **Workspaces** — listare, creare, management
- **Secrets** — add/remove per workspace
- **Volumes** — create, mount, delete
- **Billing** — balance, usage history

## Data Model (DynamoDB)

```
USER#<email>           → META          { id, email, name, created_at }
                       → PASSWORD#hash { user_id }

API_KEY#<key>          → META          { id, user_id, name, workspace_id, environment_ids, permissions }

WORKSPACE#<id>         → META          { id, user_id, name, is_default }
USER_WS#<userId>       → WORKSPACE#id  { workspace_id }

ENV#<id>               → META          { id, workspace_id, user_id, name, is_default }
WS_ENVS#<workspaceId>  → ENV#id        { environment_id }

SANDBOX#<id>           → META          { id, user_id, workspace_id, env_id, image, cpu, memory, gpu, status }

APP#<id>               → META          { id, user_id, workspace_id, env_id, name, image, timeout }
APP_INSTANCE#<iid>     → META          { id, app_id, name, cpu, memory, gpu, min_containers, max_containers, scaledown_window }
APP_INSTANCES#<appId>  → <created>     { instance_id }
INSTANCE_SANDBOXES#<iid> → <created>   { sandbox_id, status }

SECRET#<workspaceId>   → <name>        { name, value }

DEPLOYMENT#<id>        → META          { id, app_id, image, cpu, memory, status }

BILLING#<userId>       → BALANCE       { credits }
USAGE#<userId>         → <timestamp>   { sandbox_id, cost, cpu, memory, gpu }
```

## Provisioning Flow

```
User requests sandbox (2 CPU, 4 GB)
         │
         ▼
capacity-manager.enqueue()
         │
         ▼
processQueue() → no idle worker?
         │
         ▼
_provisionAndRetry()
  ├─ selectInstanceType('aws', cpu=2, memoryMb=4096)
  │   + HYPERVISOR_OVERHEAD (+1 CPU, +2 GB)
  │   → c6a.xlarge (4 CPU, 8 GB)
  │
  ├─ EC2 RunInstances (Spot, UserData with BOXY_WORKER_ID)
  │
  ├─ Poll: wait for worker registration (up to 120s)
  │
  └─ processQueue() again → start sandbox on worker
```

## Instance Type Selection

Pentru CPU: overhead hipervizor (+1 vCPU, +2 GB RAM) → cel mai mic VM care acoperă.

| User cere | Total (cu overhead) | AWS | GCP | Azure |
|---|---|---|---|---|
| 1 CPU, 1 GB | 2 CPU, 3 GB | t3.medium | n2-standard-2 | Standard_B2s |
| 2 CPU, 2 GB | 3 CPU, 4 GB | t3.medium | n2-standard-2 | Standard_B2s |
| 2 CPU, 4 GB | 3 CPU, 6 GB | c6a.xlarge | n2-standard-4 | Standard_B2s |
| 4 CPU, 8 GB | 5 CPU, 10 GB | c6a.xlarge | n2-standard-4 | Standard_D4s_v5 |
| 8 CPU, 16 GB | 9 CPU, 18 GB | c6a.2xlarge | n2-standard-8 | Standard_D8s_v5 |
| 16 CPU, 32 GB | 17 CPU, 34 GB | c6a.4xlarge | n2-standard-16 | Standard_D16s_v5 |

Pentru GPU: se alege direct după model (T4, A10, L40S, A100, H100), fără overhead. Nu se mapează CPU/memory — userul specifică doar GPU model, iar VM-ul gazdă are deja resursele necesare (hipervizorul rulează pe resursele rămase).
