# API Reference

Base URL: `https://api.boxty.dev` (local: `http://localhost:3000`)

## Auth

`POST /api/auth/register`

```json
{ "email": "user@example.com", "password": "...", "name": "John" }
→ { "user_id": "uuid", "email": "...", "workspace_id": "uuid", "environment_id": "uuid" }
```

`POST /api/auth/login`

```json
{ "email": "user@example.com", "password": "..." }
→ { "token": "jwt...", "user_id": "uuid", "workspace_id": "uuid" }
```

`GET /api/auth/whoami`

```
Authorization: Bearer <jwt> | Token <api_key>
→ { "user_id": "uuid", "email": "...", "balance": 1000, "workspace_id": "*", "workspaces": [...] }
```

`POST /api/auth/api-keys`

```json
{ "name": "ci-key", "workspace_id": "uuid", "permissions": ["read","write"] }
→ { "id": "uuid", "name": "...", "key": "boxty_...", "key_preview": "boxty_ab...", "permissions": [...] }
```

---

## Sandboxes

`POST /api/sandboxes`

```json
{
  "image": "python:3.11",
  "cpu": 2, "memory": 4096,
  "gpu": "A100", "timeout": 3600,
  "workspace_id": "uuid", "env_id": "uuid"
}
→ { "id": "uuid", "status": "provisioning", ... }
```

`GET /api/sandboxes`
`GET /api/sandboxes/:id`
`DELETE /api/sandboxes/:id`

`POST /api/sandboxes/:id/exec`

```json
{ "command": ["python", "-c", "print(1+1)"], "timeout": 30 }
→ { "stdout": "2\\n", "stderr": "", "exit_code": 0 }
```

`POST /api/sandboxes/:id/stop`

`POST /api/sandboxes/:id/snapshot`

```json
{ "name": "checkpoint" }
→ { "snapshot_id": "uuid", "status": "creating" }
```

`GET /api/sandboxes/:id/metrics`

```json
→ { "cpu_pct": 12.5, "memory_mb": 512, "disk_io_mb": 1.2 }
```

---

## Workspaces

`POST /api/workspaces`

```json
{ "name": "team-ml", "description": "ML workspace" }
→ { "id": "uuid", "name": "team-ml", "is_default": false, ... }
```

`GET /api/workspaces` → `[{ id, name, is_default, ... }]`
`GET /api/workspaces/:id`
`DELETE /api/workspaces/:id` (blocat pentru default)

---

## Environments

`POST /api/environments`

```json
{ "workspace_id": "uuid", "name": "staging", "type": "production" }
→ { "id": "uuid", "name": "staging", "workspace_id": "...", ... }
```

`GET /api/environments?workspace_id=uuid` → `[{ id, name, type, ... }]`
`GET /api/environments/:id`
`DELETE /api/environments/:id` (blocat pentru `main`)

---

## Apps

App = namespace, fără resurse. CPU/RAM/GPU sunt pe Instance Configs.

`POST /api/apps`

```json
{
  "workspace_id": "uuid", "env_id": "uuid",
  "name": "my-api", "image": "nginx:latest",
  "timeout": 3600
}
→ { "id": "uuid", "status": "active", ... }
```

`GET /api/apps`
`GET /api/apps/:id` → `{ ..., "instances": [...] }`
`DELETE /api/apps/:id`
`POST /api/apps/:id/stop`

## Instance Configs

Resource pools per app — fiecare cu autoscaling independent.

`POST /api/apps/:id/instances`

```json
{
  "name": "cpu-small",
  "cpu": 2, "memory": 4096,
  "gpu": null,
  "min_containers": 1, "max_containers": 10,
  "scaledown_window": 300
}
→ { "id": "uuid", "app_id": "...", "name": "cpu-small", ... }
```

`GET /api/apps/:id/instances`
`GET /api/apps/:id/instances/:iid`
`DELETE /api/apps/:id/instances/:iid`
`GET /api/apps/:id/instances/:iid/sandboxes`

## Deployments

`POST /api/apps/:id/deploy`

```json
{ "instance_id": "uuid", "image": "nginx:latest" }
→ { "id": "uuid", "status": "deploying", ... }
```

`GET /api/apps/:id/deployments`

## App Monitoring

`GET /api/apps/:id/metrics`
`GET /api/apps/:id/usage`
`GET /api/apps/:id/logs`

## Sandbox Forwarding

`POST /api/sandboxes/:id/forward`

```json
{ "port": 8080 }
→ { "url": "https://<sandboxId>-8080.boxty.dev" }
```

Gateway-ul face TLS termination și rutează automat. Dacă sandbox-ul e oprit (idle timeout), face cold start la următoarea cerere.

---

## Images

`POST /api/images/build`

```json
{ "name": "my-image", "base_image": "python:3.11", "commands": ["RUN pip install torch"] }
→ { "imageId": "uuid", "status": "building" }
```

`POST /api/images/build-from-dockerfile`

```json
{ "name": "my-image", "dockerfile": "FROM python:3.11\\nRUN pip install torch" }
```

`GET /api/images`
`GET /api/images/:id`
`DELETE /api/images/:id`

---

## Secrets

`POST /api/secrets`

```json
{ "name": "OPENAI_KEY", "value": "sk-xxx", "workspace_id": "uuid" }
→ { "name": "OPENAI_KEY", "workspace_id": "...", ... }
```

`GET /api/secrets?workspace_id=uuid` (require workspace)
`DELETE /api/secrets/:name`

`POST /api/secrets/attach/:sandboxId`

```json
{ "secret_names": ["OPENAI_KEY"], "workspace_id": "uuid" }
→ { "attached": ["OPENAI_KEY"], "workspace_id": "..." }
```

---

## Volumes

`POST /api/volumes`

```json
{ "name": "my-data", "size_gb": 50 }
→ { "id": "uuid", "name": "my-data", ... }
```

`GET /api/volumes`
`GET /api/volumes/:id`
`DELETE /api/volumes/:id`

`POST /api/volumes/:id/mount`

```json
{ "sandbox_id": "uuid", "mount_path": "/data" }
```

`POST /api/volumes/:id/unmount`

```json
{ "sandbox_id": "uuid" }
```

---

## Billing

`GET /api/billing/balance` → `{ "balance": 1000 }`
`GET /api/billing/usage` → `{ "total_cost": 0.05, "items": [...] }`
`POST /api/billing/credits` → `{ "amount": 5000, "checkout_url": "..." }`

`GET /api/billing/history` → `[{ "timestamp": "...", "amount": -5, "description": "sandbox-xxx cpu+mem", ... }]`

---

## Schedules

`POST /api/schedules`

```json
{
  "name": "daily-job", "schedule_type": "cron", "schedule_value": "0 9 * * *",
  "function_name": "main", "args": {}, "image": "python:3.11",
  "cpu": 2, "memory": 4096, "timeout": 600, "secrets": ["OPENAI_KEY"]
}
```

`GET /api/schedules`
`DELETE /api/schedules/:id`
`POST /api/schedules/:id/trigger`

---

## Workers

`GET /api/workers` → `[{ "id": "...", "status": "active", "provider": "aws", ... }]`
`GET /api/workers/:id`
`DELETE /api/workers/:id`

---

## Deployments

`POST /api/deployments`

```json
{ "app_id": "uuid", "image": "...", "cpu": 2, "memory": 4096 }
```

`GET /api/deployments`
`GET /api/deployments/:id`
`DELETE /api/deployments/:id`
`POST /api/deployments/:id/invoke`
