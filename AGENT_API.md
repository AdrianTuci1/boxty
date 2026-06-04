# Agent: Boxty API Server (Node.js)

## Rol
API-ul principal al platformei Boxty. Orchestrează sandbox-uri, useri, billing, workers, și expune REST + WebSocket.

## Director de lucru
`/Users/adriantucicovenco/Proiecte/boxty/api/`

## Tech Stack
- **Framework**: Fastify (Express-like, dar mai rapid)
- **Database**: DynamoDB (AWS SDK v3) — Single Table Design
- **Auth**: JWT (jsonwebtoken) + API keys
- **WebSocket**: ws (biblioteca)
- **Payment**: Stripe SDK
- **Logging**: pino

## Endpoint-uri de implementat

### Auth
- `POST /api/auth/register` — creează user, returnează JWT
- `POST /api/auth/login` — email+parolă, returnează JWT
- `POST /api/auth/api-keys` — generează cheie API pentru SDK

### Sandbox Lifecycle
- `POST /api/sandboxes` — creează sandbox nou
- `GET /api/sandboxes` — listează sandbox-urile userului
- `GET /api/sandboxes/:id` — detalii sandbox
- `DELETE /api/sandboxes/:id` — oprește și distruge sandbox
- `POST /api/sandboxes/:id/snapshot` — checkpoint numit
- `POST /api/sandboxes/restore` — restore din snapshot
- `POST /api/sandboxes/:id/forward` — port forwarding, returnează URL

### Exec
- `POST /api/sandboxes/:id/exec` — execută comandă, returnează stdout/stderr

### Workers (worker → API communication)
- `POST /api/workers/register` — worker-ul se înregistrează (X-Worker-Key auth)
- `GET /api/workers` — listează workers activi (admin)
- `POST /api/workers/:id/heartbeat` — worker-ul bate heartbeat la 5s

### Image Build (server-side image building — ca Modal Image)
- `POST /api/images/build` — build image declarativă
  body: { base_image: "python:3.12-slim", commands: ["pip install torch", "apt-get install ffmpeg"], name?: "my-image" }
  Returnează: { image_id, image_url: "registry.boxty.dev/user123/train-job:a1b2c3", status: "building" }
- `GET /api/images/:id` — status build + image_url final
- `GET /api/images` — listează imaginile userului
- `DELETE /api/images/:id` — șterge imaginea din registry
- `POST /api/images/build-from-dockerfile` — build din Dockerfile uploadat
  body: multipart (Dockerfile + context.tar.gz)
  Pentru SDK-uri: imaginea generată e accesibilă ca `registry.boxty.dev/<user_id>/<image_name>:<commit_hash>`
  Workers trebuie să facă docker login + docker push la registry la final de build

### Deployments (web endpoint API, ca Modal)
- `POST /api/deployments` — deploy funcție ca serviciu web
- `GET /api/deployments/:id` — status deployment
- `DELETE /api/deployments/:id` — undeploy
- `POST /api/deployments/:id/invoke` — invoke direct remote

### Billing
- `GET /api/billing/balance` — credite rămase
- `GET /api/billing/usage` — istoric consum
- `POST /api/billing/credits` — cumpără credite (Stripe Checkout)
- `POST /api/stripe/webhook` — Stripe webhook (fără auth)

### Secrets (env vars injectabile în sandboxuri)
- `POST /api/secrets` — creează secret criptat (aes-256-gcm local sau AWS KMS)
  body: { name: "HF_TOKEN", value: "hf_..." }
- `GET /api/secrets` — listează numele secretelor (NU expune valorile)
- `DELETE /api/secrets/:name` — șterge secret
- `POST /api/sandboxes/:id/secrets` — injectează secrets listate într-un sandbox
  body: { secret_names: ["HF_TOKEN", "OPENAI_KEY"] }

### Volumes (persistent S3-backed volumes)
- `POST /api/volumes` — creează volum nou
  body: { name: "my-data", size_gb: 50 }
  Returnează: { id, name, size_gb, status: "created", mount_url: "s3://boxty-volumes/user123/my-data" }
- `GET /api/volumes` — listează volumele userului
- `GET /api/volumes/:id` — detalii volum (dimensiune, sandbox-uri montate)
- `DELETE /api/volumes/:id` — șterge volum (doar dacă nu e montat)
- `POST /api/volumes/:id/mount` — montează volum pe un sandbox
  body: { sandbox_id, mount_path: "/data" }
- `POST /api/volumes/:id/unmount` — demontează de pe sandbox
  body: { sandbox_id }

Volumul ephemeral (implicit 10GB) e gestionat direct de worker — face parte din `POST /api/sandboxes` cu `disk_size_gb`. Acest volum e temporar, dispare când sandbox-ul moare.
Volumul persistent e S3-backed: worker-ul face mount S3 bucket via s3fs/goofys la boot. Datele rămân și după ce sandbox-ul moare.

### Scheduling (Cron / Period — ca Modal)
- `POST /api/schedules` — creează scheduled job
  body: { name, schedule_type: "cron"|"period", schedule_value: "0 6 * * *" | 3600, function_name, args, image, cpu, memory, gpu, timeout, secrets }
- `DELETE /api/schedules/:id` — șterge schedule
- `GET /api/schedules` — listează schedule-urile userului
- `GET /api/schedules/:id` — detalii (ultima rulare, următoarea, status)
- `PATCH /api/schedules/:id` — actualizează (schimbă frecvența, args)
- `POST /api/schedules/:id/trigger` — rulează manual acum

### CronEngine (background service)
API-ul include un CronEngine care rulează ca background job:
- La fiecare 60s interoghează DynamoDB GSI `SCHEDULE#active` pentru taskuri unde next_run <= now
- Când e cazul:
  1. Citește secretele asociate schedule-ului din `SECRET#<user_id>` (fetch doar nume și valori pentru secret_names din schedule config)
  2. Alege worker cu capacitate liberă (via Scheduler)
  3. Trimite `startSandbox({ sandboxId, image, cpu, memory, gpu, timeout, secrets: [{name, value}], schedule: true, cmd, scheduleId })` la worker
  4. Worker rulează cmd în sandbox, captează stdout/stderr/exitCode, trimite rezultatul la API
  5. API primește `POST /schedules/:scheduleId/logs` cu `{ exitCode, stdout, stderr, durationMs }`
  6. Loghează rezultatul în DynamoDB `SCHEDULE_LOG#<schedule_id>#<timestamp>`
  7. Calculează următorul next_run (CronExpression.next() sau Date.now() + periodSeconds)
  8. Actualizează `SCHEDULE#<id>` în DB cu noul next_run
- Suportă `Cron("0 6 * * *")` (librărie cron-parser) și `Period(seconds=3600)`
- API intern: `GET /api/admin/cron/status` (arată coada, ultimele execuții, erori)
- Endpoint pentru worker: `POST /api/schedules/:scheduleId/logs` — worker-ul trimite rezultatul execuției
  body: `{ scheduleId, sandboxId, exitCode, stdout, stderr, durationMs }`

### Admin
- `GET /api/admin/stats` — statistici (utilizare, workers, venit)
- `GET /api/admin/cron/status` — debugging cron engine
- `GET /health` — health check

## DynamoDB Single Table Schema

`Table: boxty` (PAY_PER_REQUEST)

### PK Patterns

```
USER#<id>                        → SK: PROFILE
SANDBOX#<id>                     → SK: META
SANDBOX#<id>                     → SK: SNAPSHOT#<name>
WORKER#<id>                      → SK: META
DEPLOYMENT#<id>                  → SK: META
BILLING#<user_id>                → SK: BALANCE
BILLING#<user_id>                → SK: TX#<timestamp>
USAGE#<user_id>                  → SK: <timestamp>
SECRET#<user_id>                 → SK: <secret_name>
SCHEDULE#<id>                    → SK: META
SCHEDULE_LOG#<schedule_id>       → SK: <timestamp>
VOLUME#<id>                      → SK: META
IMAGE#<id>                       → SK: META
IMAGE#<user_id>                  → SK: <image_id>
```

### GSI1 — Status queries
- PK: `STATUS#running` / `STATUS#stopped` / `SCHEDULE#active` / `SCHEDULE#paused`
- SK: `created_at`

### GSI2 — User-based listings
- PK: `USER_SANDBOXES#<user_id>` / `USER_SCHEDULES#<user_id>`
- SK: `created_at`

### GSI3 — Cron next-run (pentru CronEngine)
- PK: `SCHEDULE_NEXT_RUN`
- SK: `next_run_timestamp` (numeric)

## Worker Communication Protocol

API-ul comunică cu worker-ii via HTTP (portul 9001 pe worker). WorkerClient face:

```javascript
startSandbox({ sandboxId, image, cpu, memory, gpu, timeout, tunnelKey, secrets, schedule?, cmd?, scheduleId? })
  // secrets: [{ name, value }] — worker le injectează ca env vars
  // schedule: true — worker rulează comanda și raportează rezultatul înapoi
  // cmd: comanda de rulat pentru scheduled jobs
  // scheduleId: id-ul schedule-ului (pentru raportare loguri)
stopSandbox(sandboxId)
exec(sandboxId, command, timeout) → { stdout, stderr, exitCode, duration }
snapshot(sandboxId, name) → { s3Key }
restoreSandbox({ sandboxId, snapshotKey, image, cpu, memory, gpu, secrets })
health() → { ok, uptime, sandboxes, capacity }
```

## Scheduler & Capacity Manager

Scheduler alege worker-ul cu cea mai multă capacitate liberă (bin packing simplu). Când niciun worker nu are capacitate, CapacityManager:
1. Înregistrează cererea într-o coadă
2. Alege cel mai ieftin cloud provider cu preț spot
3. Lansează o nouă instanță worker (via cloud API)
4. Așteaptă heartbeat-ul de la worker
5. Alocă sandbox-ul

## Billing Engine

Rulează un tick la fiecare secundă. Pentru fiecare sandbox activ:
- Calculează credite consumate pe secundă bazat pe resurse (CPU, GPU, RAM)
- Scrie în DynamoDB o înregistrare de usage
- Scade din balanța userului

Worker-ul raportează idle timeout (5 min fără activitate) → API-ul face snapshot automat și oprește sandbox-ul.

## Env vars (expuse în .env.example)

```
PORT=3000
NODE_ENV=development
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_REGION=us-east-1
DYNAMODB_TABLE=boxty
JWT_SECRET=dev-secret
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
WORKER_API_KEY=boxty-worker-secret
S3_BUCKET_SNAPSHOTS=boxty-snapshots
S3_BUCKET_IMAGES=boxty-images
S3_BUCKET_VOLUMES=boxty-volumes
EPHEMERAL_DISK_DEFAULT_GB=10
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
FREE_TRIAL_CREDITS=1000
IDLE_TIMEOUT_SECONDS=300
IMAGE_REGISTRY=registry.boxty.dev
IMAGE_REGISTRY_USER=boxty
IMAGE_REGISTRY_PASS=
BUILD_WORKER_MAX_BUILDS=2  # câte build-uri simultane per worker
```

## Structura fișierelor de creat

```
api/
├── package.json
├── Dockerfile
├── .env.example
├── src/
│   ├── index.js              # entry point — Fastify + WS
│   ├── config.js             # env vars
│   ├── db/
│   │   └── schema.js         # DynamoDB client + helpers
│   ├── middleware/
│   │   └── auth.js           # JWT + API key auth
│   ├── routes/
│   │   ├── sandboxes.js      # sandbox CRUD + metrics
│   │   ├── exec.js           # exec în sandbox
│   │   ├── billing.js        # balance, usage, credits
│   │   ├── deployments.js    # web endpoint deployment
│   │   ├── workers.js        # worker registration + heartbeat
│   │   ├── secrets.js        # secrets CRUD
│   │   ├── images.js         # image build routes
│   │   ├── volumes.js        # volume CRUD + mount/unmount
│   │   ├── workspaces.js     # workspace CRUD
│   │   ├── environments.js   # environment CRUD per workspace
│   │   ├── apps.js           # App CRUD + stop + sandboxes + deployments + metrics + usage + logs
│   │   ├── schedules.js      # cron/period scheduling + worker log callback
│   │   └── admin.js          # health, stats
│   ├── services/
│   │   ├── billing-engine.js    # per-second credit meter
│   │   ├── scheduler.js         # worker selection
│   │   ├── capacity-manager.js  # auto-provision workers
│   │   ├── cron-engine.js       # CronEngine — scheduled job executor
│   │   ├── image-builder.js     # orchestrează build pe worker
│   │   ├── volume-manager.js    # S3 volume mount/unmount
│   │   ├── metrics-collector.js # agreghează metrics per-sandbox, per-app
│   │   ├── cloud-provider.js    # abstract multi-cloud (AWS/GCP/Azure)
│   │   └── worker-pool.js       # HTTP client to workers
│   └── ws/
│       └── sandbox-stream.js # WebSocket — stdout/stderr live
```

## Contract cu worker-ul

Worker-ul expune REST pe :9001 și WebSocket pe :9002.
API-ul face proxy: SDK-ul trimite comenzi la API → API forward la worker.

## Reguli
- Tot codul e ES modules (`import/export`)
- Fiecare route e într-un fișier separat
- Toate serviciile sunt decorate pe app (via `app.decorate`)
- Nu se rulează teste live — doar cod structural
