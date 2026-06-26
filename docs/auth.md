# Auth & RBAC

## Flow

```
Web UI                    API                       CLI/SDK
  │                       │                           │
  ├─ Register ───────────▶│                           │
  │  POST /api/auth/      │                           │
  │  register             │                           │
  │                       ├─ Creates user             │
  │                       ├─ Creates default          │
  │                       │  workspace (immutable)    │
  │                       └─ Creates 'main'           │
  │                          environment (immutable)  │
  │                                                  │
  ├─ Login ──────────────▶│                          │
  │  POST /api/auth/login │                          │
  │◀────── {token,        │                          │
  │         workspace_id} │                          │
  │                       │                          │
  ├─ Settings → Generate  │                          │
  │  API Key ────────────▶│                          │
  │  POST /api/auth/      │                          │
  │  api-keys             │                          │
  │◀──── {id, key,        │                          │
  │       key_preview}    │                          │
  │                       │                          │
  │                       │        ┌─ boxty login ──▶│
  │                       │        │  POST /api/auth/│
  │                       │        │  api-keys?      │
  │                       │        │  (w/ Token <key>)│
  │                       │        │◀─── whoami ◀────┤
  │                       │        │                  │
  │                       │        └─ All subsequent  │
  │                       │           calls use       │
  │                       │           Token <key>     │
```

## Authentication Methods

| Method | Header | Use case |
|---|---|---|
| JWT | `Authorization: Bearer <jwt>` | Web UI (7 day expiry) |
| API Key | `Authorization: Token <key>` | CLI / SDK |
| API Key | `Authorization: ApiKey <key>` | Legacy, same as Token |

## API Keys RBAC

La creare, fiecare API key poate fi restrânsă:

```json
{
  "id": "uuid",
  "key": "boxty_xxxxxxxxxxxx",
  "name": "ci-pipeline",
  "workspace_id": "ws-123",   // "*" = all workspaces
  "environment_ids": ["env-456"],  // ["*"] = all environments
  "permissions": ["read", "write", "deploy"]
}
```

### Permissions

| Permission | Descriere |
|---|---|
| `read` | Listare resurse, vizualizare status, metrics |
| `write` | Creare sandbox-uri, apps, secrets, volumes |
| `deploy` | Deploy apps, trigger builds |
| `admin` | Full access — create/delete workspaces, manage API keys |

### Scoping în middleware

Când autentificarea e via JWT (web UI) → **full access** (toate workspace-urile).

Când e via API key:
```js
request.user = {
  id: keyItem.user_id,
  apiKey: true,
  workspace_id: keyItem.workspace_id,   // sau '*'
  environment_ids: keyItem.environment_ids, // sau ['*']
  permissions: keyItem.permissions,
};
```

## Endpoints

| Method | Path | Auth | Descriere |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Creare cont + default workspace + env `main` |
| `POST` | `/api/auth/login` | None | JWT login, returnează `{ token, user_id, workspace_id }` |
| `GET` | `/api/auth/whoami` | Required | User info, balance, workspaces, RBAC scope |
| `POST` | `/api/auth/api-keys` | Required | Generează API key cu RBAC |
| `GET` | `/api/auth/api-keys` | Required | Listează API keys (fără valoarea completă) |
| `DELETE` | `/api/auth/api-keys/:key` | Required | Revocă API key |

## Workspaces & Environment Defaults

La register se creează automat:

```
WORKSPACE#<wsId>  { name: user.name, is_default: true }
ENV#<envId>       { workspace_id: wsId, name: 'main', is_default: true }
```

Default workspace și environment **nu pot fi șterse** (400: "Cannot delete default workspace/environment"). Se pot crea workspace-uri și environment-uri adiționale.
