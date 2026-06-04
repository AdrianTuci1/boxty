# Agent: Boxty Worker Agent (Go)

## Rol
Worker-ul rulează pe spot instances. Primește comenzi de la API, orchestrează sandbox-uri gVisor, face proxy, snapshots, idle detection.

## Director de lucru
`/Users/adriantucicovenco/Proiecte/boxty/worker/`

## Tech Stack
- **Limbaj**: Go 1.22+
- **Container runtime**: gVisor (`runsc`) — pentru izolare sandbox
- **Image builder**: Docker Engine CLI (`os/exec` apeluri la `docker build` / `docker push`) — build imagini server-side pe port 9004
- **HTTP server**: `net/http` + `gorilla/mux` sau `chi`
- **WebSocket**: `gorilla/websocket`
- **S3**: `aws-sdk-go-v2`
- **Auth**: API key simplă (header X-API-Key)

## Endpoint-uri pe care le EXPUNE worker-ul

### Port 9001 — REST API (comenzi de la API)

```
POST   /sandboxes                    — start sandbox
  body: { sandboxId, image, cpu, memory, gpu, timeout, tunnelKey, secrets: [{name, value}], diskSizeGb, volume?: { name, mountPath } }
  diskSizeGb = spațiu ephemeral pe disc (implicit 10GB, scrie un fișier imagine sau tmpfs)
  volume = volum persistent S3-backed (se montează la mountPath)
DELETE /sandboxes/:id                — stop sandbox
POST   /sandboxes/:id/exec           — executa comandă (timeout configurabil)
POST   /sandboxes/:id/snapshot       — CRIU checkpoint → S3
POST   /sandboxes/restore            — restore din S3 snapshot
  body: { sandboxId, snapshotKey, image, cpu, memory, gpu, secrets: [{name, value}] }
GET    /sandboxes/:id                — status sandbox
GET    /health                       — uptime, nr sandbox-uri, capacitate
```

### Port 9002 — WebSocket (bidirectional tunnel pentru forward + stream)

```
WS /:sandboxId                       — stream stdout/stderr live
WS /:sandboxId/:port                 — TCP tunnel pentru port forwarding (ex: jupyter :8888)
```

### Port 9003 — TCP proxy (subdomain-based forwarding)

Ascultă pe `*.boxty.dev` și face proxy la sandbox-uri interne.
Ex: `sandbox-abc.boxty.dev` → `sandbox-abc:8080`

### Port 9004 — Image Builder (server-side Docker build)

```
POST /images/build                   — build imagine dintr-o specificație
  body: { imageId, base_image, commands: ["RUN pip install torch", "COPY ..."], layers?: [{type, content}], registry_auth: {username, password} }
  Returnează: { imageId, status: "building" }
  Worker face: docker build -t registry.boxty.dev/user123/img:hash . && docker push ...
GET  /images/:imageId/status         — status build (building/done/failed + image_url final)
```

## Secrets Injection

Când primește `POST /sandboxes` sau `POST /sandboxes/restore` cu un array `secrets`
( `[{name: "DATABASE_URL", value: "postgres://..."}]` ):

- Worker scrie un fișier temporar `.env` în container înainte de `runsc run`
- Override ENV din imagine cu valorile din request
- După ce sandbox-ul se termină, worker șterge fișierul `.env` (cleanup)
- **Nu loghează și nu stochează** valorile secretelor pe disc — doar în memorie pe durata viații sandbox-ului

```go
// Inject secrets as container env vars before runsc run
func sandboxEnv(base []string, secrets []Secret) []string {
    for _, s := range secrets {
        base = append(base, fmt.Sprintf("%s=%s", s.Name, s.Value))
    }
    return base
}
```

## Cron / Scheduled Job Execution

Worker-ul suportă și rularea de job-uri programate (Cron/Period), nu doar sandbox-uri interactive:

- API trimite `POST /sandboxes` cu body care include `"schedule": true` + `cmd` + `timeout`
- Worker pornește containerul gVisor, rulează comanda `cmd`, captează stdout/stderr până la exit
- După ce comanda se termină (exit code 0 sau non-zero), worker:
  1. Trimite rezultatul la API: `POST /schedules/:scheduleId/logs` cu `{ exitCode, stdout, stderr, durationMs }`
  2. Face cleanup — `runsc delete`, șterge fișiere temporare
- Timeout-ul pentru job-uri se ia din `timeout` din request (default 10 minute)
- Worker **nu** reține stare de scheduling — API-ul decide ce și când rulează

```go
// Report cron job result back to API
func reportCronResult(apiURL, scheduleID, sandboxID string, exitCode int, stdout, stderr string, durationMs int64) error {
    body := map[string]interface{}{
        "scheduleId": scheduleID,
        "sandboxId":  sandboxID,
        "exitCode":   exitCode,
        "stdout":     stdout,
        "stderr":     stderr,
        "durationMs": durationMs,
    }
    // POST to API endpoint
}
```

## Lifecycle flow

1. API trimite `POST /sandboxes` cu `{ sandboxId, image, cpu, memory, gpu, timeout, tunnelKey, secrets, schedule?, cmd?, scheduleId? }`
2. Worker injectează secretele în env-ul containerului (dacă există)
3. Worker face `runsc run -detach` cu resursele specificate
4. Worker face WebSocket tunnel pe port 9002 pentru forward (doar pentru sandbox-uri interactive)
5. Dacă e job programat (`schedule: true`), worker rulează comanda, captează outputul, trimite rezultatul la API și face cleanup imediat
6. Pentru sandbox-uri interactive: worker monitorizează — dacă expiră timeout, face `runsc kill`
7. Când sandbox-ul se termină, worker reportează la API `PATCH /sandboxes/:id/stop` (sau trimite log cron)
8. Worker face cleanup: `runsc delete`, șterge fișierul `.env`, șterge temporarele

## gVisor Integration

Worker-ul rulează gVisor containers pentru sandbox-uri. Fiecare sandbox e un container gVisor cu:
- Resurse limitate (CPU, memory, GPU)
- Network izolat (per sandbox)
- Root filesystem din imaginea specificată (lazy loading din S3 sau imagine locală)

```go
// Exemplu conceptual — worker-ul face exec la runsc
runsc --rootless run -c sandbox-config.json sandbox-abc
```

gVisor e instalat pe worker la boot (prin cloud-init sau golden AMI). Worker-ul doar face apeluri la `runsc`.

## Snapshot & Restore (CRIU)

Worker-ul face checkpoint la sandbox-urile idle și le încarcă în S3:

```go
// Checkpoint
runsc checkpoint sandbox-abc
tar czf snapshot.tar.gz /run/containerd/.../checkpoint/
upload to S3: boxty-snapshots/sandbox-abc/snapshot-1.tar.gz

// Restore
download from S3: boxty-snapshots/sandbox-abc/snapshot-1.tar.gz
tar xzf ...
runsc restore sandbox-abc
```

## Idle Detector

Worker-ul rulează un goroutine care:
- La fiecare 10 secunde verifică sandbox-urile active
- Dacă un sandbox n-a avut activitate (exec/stream) în ultimele N secunde (config: 300s implicit)
- Face snapshot automat → S3
- Oprește sandbox-ul
- Notifică API-ul că sandbox-ul e snapshotted

## Sandbox Metrics Collection

Worker-ul colectează metrics pentru fiecare sandbox activ:

### La fiecare 30s (per sandbox):
Worker trimite `POST /api/sandboxes/:id/metrics` la API cu:
```json
{
  "cpu_pct": 45.2,
  "memory_mb": 2048,
  "network_rx_bytes": 1048576,
  "network_tx_bytes": 524288,
  "gpu_util_pct": 78.5,
  "gpu_memory_mb": 4096
}
```

### La stop (raport final):
Când sandbox-ul se termină, worker trimite raportul final cu toate metrics:
```json
{
  "started_at": "2024-01-01T00:00:00Z",
  "finished_at": "2024-01-01T01:00:00Z",
  "boot_duration_ms": 2340,
  "cpu": { "max_pct": 95.0, "avg_pct": 45.2, "usage_seconds": 3200 },
  "memory": { "max_mb": 4096, "avg_mb": 2048 },
  "network": { "rx_bytes": 52428800, "tx_bytes": 10485760 },
  "gpu": { "max_util_pct": 95.0, "avg_util_pct": 65.0, "memory_mb": 4096 }
}
```

### Cum colectează:
- `cpu_pct`: citit din `/sys/fs/cgroup/cpu.stat` al containerului gVisor
- `memory_mb`: din `/sys/fs/cgroup/memory.current`
- `network_rx/tx_bytes`: din `runsc events --stats sandbox-id`
- `gpu_util_pct`: via `nvidia-smi` dacă sandbox-ul are GPU
- `boot_duration_ms`: timpul dintre `runsc run` și prima conexiune WebSocket / primul exec

## Heartbeat

Worker-ul trimite un POST la `api:3000/api/workers/:id/heartbeat` la fiecare 5 secunde cu:
```json
{
  "cpu": { "total": 8, "used": 3.5 },
  "memory": { "total_gb": 32, "used_gb": 12 },
  "sandboxes_running": 3,
  "uptime_seconds": 86400,
  "region": "us-east-1",
  "provider": "aws"
}
```

## Cloud Provider Integration (la boot)

Worker-ul primește la boot (via env sau cloud-init):
- `PROVIDER` = aws | gcp | azure
- `REGION`
- `API_URL` = adresa API-ului
- `WORKER_API_KEY` = cheia secretă partajată

Worker-ul se înregistrează la API automat la pornire.

## Structura fișierelor de creat

```
worker/
├── go.mod
├── go.sum
├── Dockerfile
├── cmd/
│   └── worker/
│       └── main.go           # entry point
├── internal/
│   ├── sandbox/
│   │   ├── manager.go        # gVisor lifecycle (create, start, stop, exec)
│   │   └── config.go         # sandbox configuration builder
│   ├── scheduler/
│   │   └── local.go          # tracks local capacity, bin packing
│   ├── tunnel/
│   │   ├── websocket.go      # WebSocket handler (port 9002)
│   │   └── tcp_proxy.go      # TCP reverse proxy (port 9003)
│   ├── snapshot/
│   │   └── criu.go            # CRIU checkpoint/restore + S3 upload
│   ├── secrets/
│   │   └── injector.go       # secrets injection as env vars + cleanup
│   ├── cronjob/
│   │   └── runner.go         # scheduled job execution (run cmd, capture output, report)
│   ├── imagebuilder/
│   │   └── builder.go        # server-side Docker build + push to registry
│   └── cloud/
│       └── register.go       # heartbeat + registration with API
```

## Reguli
- Toate configurările vin din environment variables (12-factor app)
- Logare structurată (nu `fmt.Println`)
- Graceful shutdown: la SIGTERM, face snapshot la toate sandbox-urile active
- Nu se rulează teste live — doar cod structural care compilează
