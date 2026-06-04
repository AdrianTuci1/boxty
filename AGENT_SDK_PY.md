# Agent: Boxty Python SDK

## Rol
SDK-ul Python pe care userii îl instalează cu `pip install boxty`. Include client API, decorator-based web endpoint API, și CLI.

## Director de lucru
`/Users/adriantucicovenco/Proiecte/boxty/sdk-py/`

## Tech Stack
- **Python**: 3.10+
- **HTTP**: `httpx` (async + sync)
- **WebSocket**: `websockets`
- **CLI**: `click` sau `typer`
- **Build**: `pyproject.toml` (PEP 621)

## Sandbox API (interactiv)

```python
import boxty as bx

# Creează client
client = bx.Client(api_key="bxty_...")

# Creează sandbox
sandbox = client.create_sandbox(
    image="pytorch:latest",
    cpu=4,
    memory=16384,
    gpu="A100",
    timeout=3600,
)
print(sandbox.url)  # https://sandbox-abc.boxty.dev

# Execută comenzi
result = sandbox.exec("python train.py --epochs=10")
print(result.stdout)
print(result.stderr)
print(result.exit_code)

# Port forwarding
with sandbox.forward(8080) as url:
    print(f"Jupyter at {url}")  # https://sandbox-abc-8080.boxty.dev

# Snapshots
sandbox.checkpoint("experiment-3")
sandbox2 = bx.Sandbox.restore("experiment-3")

# List sandbox-uri
for sb in client.list_sandboxes():
    print(sb.id, sb.status)
```

### Image Building (server-side)

```python
# Method chaining — ca Modal Image
image = bx.Image("python:3.12-slim")
image.pip_install("torch", "transformers", "datasets")
image.apt_install("ffmpeg", "libsm6")
image.env({"HF_HOME": "/cache"})
image.copy("./train.py", "/app/train.py")
image.run("echo 'hello' && whoami")  # RUN command

# Sau din Dockerfile
image = bx.Image.from_dockerfile("Dockerfile", context=".")

# Build — se întâmplă pe worker Boxty, nu local
image_id = image.build()  # POST /api/images/build
# Returnează: "registry.boxty.dev/user123/my-image:a1b2c3"

# Folosire în sandbox
sandbox = client.create_sandbox(image="registry.boxty.dev/user123/my-image:a1b2c3")
```

### Clase de implementat

```
Client(api_key=None, base_url="https://api.boxty.dev")
  # Workspace & Environment
  .create_workspace(name, description?) → Workspace
  .list_workspaces() → list[Workspace]
  .get_workspace(id) → Workspace
  .delete_workspace(id)
  .create_environment(workspace_id, name, type: "development"|"staging"|"production") → Environment
  .list_environments(workspace_id) → list[Environment]
  
  # Apps (ca Modal)
  .create_app(workspace_id, env_id, name, image, cpu, memory, gpu, timeout) → App
  .list_apps(workspace_id?, env_id?) → list[App]
  .get_app(id) → App
  .delete_app(id)
  .stop_app(id)  # oprește toate sandbox-urile App-ului
  .deploy_app(id, image?, cpu?, memory?, gpu?) → Deployment
  .get_app_sandboxes(id) → list[Sandbox]
  .get_app_deployments(id) → list[Deployment]
  .get_app_metrics(id) → AppMetrics
  .get_app_usage(id) → UsageReport
  .get_app_logs(id) → list[str]
  
  # Sandbox
  .create_sandbox(image, cpu, memory, gpu, timeout, disk_size_gb=10, volume=None, volume_mount_path=None, app_id=None, env_id=None) → Sandbox
  .list_sandboxes(app_id?, status?) → list[Sandbox]
  .get_sandbox(id) → Sandbox
  .delete_sandbox(id)
  .get_sandbox_metrics(id) → SandboxMetrics
  
  # Billing
  .balance() → int
  .usage() → UsageReport
  .buy_credits(amount) → CheckoutURL
  
  # Images
  .build_image(name: str, base_image: str, commands: list[str], files?: dict) → ImageBuild
  .list_images() → list[ImageBuild]
  .delete_image(id: str)
  
  # Secrets
  .create_secret(name, value) → Secret
  .list_secrets() → list[Secret]
  .delete_secret(name)
  .attach_secrets(sandbox_id, secret_names)
  
  # Schedules
  .create_schedule(name, schedule_type, schedule_value, function_name, args, image, cpu, memory, gpu, timeout, secrets) → Schedule
  .list_schedules() → list[Schedule]
  .delete_schedule(id)
  .trigger_schedule(id)
  
  # Volumes
  .create_volume(name, size_gb) → Volume
  .list_volumes() → list[Volume]
  .delete_volume(id)
  .mount_volume(volume_id, sandbox_id, mount_path)
  .unmount_volume(volume_id, sandbox_id)

Workspace
  .id, .name, .description, .created_at
  .environments() → list[Environment]
  .delete()

Environment
  .id, .name, .type (development/staging/production), .workspace_id
  .delete()

App
  .id, .name, .status, .url, .created_at
  .stop()  # oprește toate sandbox-urile
  .deploy(image?, cpu?, memory?, gpu?) → Deployment
  .sandboxes() → list[Sandbox]
  .deployments() → list[Deployment]
  .metrics() → AppMetrics
  .usage() → UsageReport
  .logs() → list[str]
  .delete()

AppMetrics
  .total_sandboxes: int
  .active_sandboxes: int
  .cpu: { max: float, avg: float, total_hours: float }
  .memory: { max_mb: float, avg_mb: float }
  .gpu: { max_util_pct: float, avg_util_pct: float, total_hours: float }
  .network: { total_rx_gb: float, total_tx_gb: float }
  .total_cost: float

Image(base_image: str = "python:3.12-slim")
  .pip_install(*packages) → self
  .apt_install(*packages) → self
  .env(**vars) → self
  .copy(source: str, dest: str) → self
  .run(cmd: str) → self
  .from_dockerfile(path: str, context: str = ".") → Image
  .build(name: str = None) → str
  .build_async(name: str = None) → ImageBuild

ImageBuild
  .id, .image_url, .status (building/done/failed)
  .wait()

Sandbox
  .id, .status, .url, .ws_url
  .started_at, .finished_at, .boot_duration_ms
  .exec(command, timeout=60) → ExecResult
  .forward(port) → context manager → str (URL)
  .checkpoint(name) → Snapshot
  .stop()
  .metrics() → SandboxMetrics
  .attach_secrets(secret_names)
  .on("stdout", callback)

SandboxMetrics
  .started_at: datetime
  .finished_at: datetime
  .boot_duration_ms: int
  .cpu: { max_pct: float, avg_pct: float, usage_seconds: float }
  .memory: { max_mb: float, avg_mb: float }
  .network: { rx_bytes: int, tx_bytes: int }
  .gpu: { max_util_pct: float?, avg_util_pct: float?, memory_mb: float? }

ExecResult
  .stdout: str
  .stderr: str
  .exit_code: int
  .duration: float (seconds)
```

## Web Endpoint API (ca Modal)

```python
import boxty as bx

app = bx.App("my-ml-service")

@app.function(image="pytorch:latest", gpu="A100", cpu=8, memory=32768)
@bx.web_endpoint(method="POST")
def predict(data: dict):
    # Rulează pe workers Boxty
    return model.predict(data["input"])

# Deploy
app.deploy()  # → https://predict-my-ml-service.boxty.dev

# Invocare directă
result = predict.remote({"input": "..."})

# Paralel
results = predict.map([{"input": "a"}, {"input": "b"}])

# Fire-and-forget
predict.spawn({"input": "long_job"})
```

### Clase de implementat

```
App(name)
  .function(image, cpu, memory, gpu, timeout) → decorator
  .deploy() → URL
  .undeploy()

Schedule
  .id, .name, .schedule_type, .schedule_value, .next_run, .status
  .delete()
  .trigger()  # rulează manual

Secret
  .name, .created_at (NU expune valoarea)

web_endpoint(method="GET", timeout=60) → decorator
fastapi_endpoint() → decorator  # FastAPI integration

Function
  .remote(*args, **kwargs) → return value
  .map(inputs: list) → iterable
  .spawn(*args, **kwargs) → FunctionCall
  .web_url: str
```

## CLI

```bash
boxty run app.py              # rulează script în cloud
boxty deploy app.py            # deploy ca serviciu web
boxty shell                    # sandbox interactiv în terminal
boxty exec <id> "cmd"          # execută comandă
boxty ls                       # listează sandbox-uri active
boxty logs <id>                # tail stdout/stderr
boxty stop <id>                # oprește sandbox
boxty cp <id>:/path ./local    # copiază fișiere
boxty forward <id> 8080        # port forward
boxty init                     # creează schelet proiect
boxty login                    # autentificare
boxty logout
boxty whoami                   # user info + credit balance
boxty billing                  # istoric consum
boxty secret create <name>     # creează secret (ascunde input)
boxty secret rm <name>
boxty secret ls
boxty schedule create          # creează scheduled job (interactiv)
boxty schedule ls
boxty schedule rm <id>
boxty schedule trigger <id>    # rulează acum
boxty volume create <name>     # creează volum persistent
boxty volume rm <name>
boxty volume ls
boxty image build <file>      # build imagine din specificație YAML/TOML
boxty image ls                # listează imaginile userului
boxty image rm <id>           # șterge imagine din registry
boxty workspace create <name> # creează workspace
boxty workspace ls             # listează workspace-uri
boxty workspace rm <id>       # șterge workspace
boxty app create <name>       # creează App (interactiv — alege workspace, env)
boxty app ls                  # listează App-urile
boxty app stop <id>           # oprește toate sandbox-urile App-ului
boxty app logs <id>           # aggregated logs App
boxty app metrics <id>        # metrics App
```

## Structura fișierelor de creat

```
sdk-py/
├── pyproject.toml
├── README.md
├── src/
│   └── boxty/
│       ├── __init__.py           # public exports
│       ├── client.py             # Client class, HTTP + WS to API
│       ├── sandbox.py            # Sandbox class
│       ├── app.py                # App, function, web_endpoint decorators
│       ├── image.py              # Image builder (method chaining)
│       ├── secret.py             # Secret management
│       ├── schedule.py           # Schedule management (Cron/Period)
│       ├── volume.py             # Volume management
│       ├── exceptions.py         # BoxtyError, etc.
│       └── cli/
│           ├── __init__.py       # CLI entry (typer)
│           ├── sandbox_cmd.py    # sandbox commands
│           ├── billing_cmd.py    # billing commands
│           ├── config_cmd.py     # login, logout, whoami
│           ├── secret_cmd.py     # secret management
│           ├── workspace_cmd.py  # workspace commands
│           └── app_cmd.py        # app commands
├── examples/
│   ├── train.py                  # exemplu sandbox
│   └── deploy.py                 # exemplu web endpoint
└── tests/
    ├── test_client.py
    └── test_sandbox.py
```

## Contract cu API-ul

Python SDK face call-uri la API-ul Node.js (`https://api.boxty.dev`). Endpoint-urile API sunt documentate în `AGENT_API.md`.

- Autentificare: `Authorization: Bearer <jwt>` sau `Authorization: Bearer <api_key>`
- Toate request-urile/response-urile sunt JSON
- WebSocket pentru stream live: `wss://{worker-host}:9002/{sandbox-id}`

## Reguli
- Suportă async (`await client.create_sandbox(...)`) și sync (`.result()`)
- Type hints peste tot
- pyproject.toml cu setuptools sau hatchling
- CLI funcțional cu `boxty` command după `pip install`
- Nu se rulează teste live
