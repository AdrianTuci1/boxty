# Boxty Frontend / Backend / CLI Coverage Report

## Executive Summary

- Backend: 85 HTTP routes, most implemented in `InMemoryStore`. ~18 small read-only stubs.
- Frontend: wired to backend via `apiFetch` + `client.ts`. Secrets and Volumes fall back to mock data when `VITE_DEMO_MODE`, `VITE_USE_MOCKS`, or `VITE_DEV_MODE` is enabled. Most other pages call real endpoints.
- CLI: 43 commands across 12 sub-command modules. CLI uses the Python SDK (`boxty` package) which implements 60 endpoint patterns. ~11 CLI commands are explicitly stubbed with `not yet implemented` messages.

## Frontend API Coverage

All API calls go through `web/src/api/client.ts` (apiFetch). API modules:

| Module | Wired to Backend | Mock Fallback | Notes |
|--------|------------------|---------------|-------|
| apps | yes | no | full workload CRUD |
| auth | yes | no | login/register/oauth/api-keys |
| workspaces | yes | no | CRUD + members |
| environments | yes | no | CRUD |
| sandboxes | yes | no | workload-based |
| images | yes | no | build/status/delete |
| schedules | yes | no | full CRUD |
| billing | yes | no | balance/usage/credits |
| dashboard | yes | no | summary + workloads |
| secrets | yes | **yes** | `shouldUseMocks()` in dev/demo |
| volumes | yes | **yes** | `shouldUseMocks()` in dev/demo |

Mock data lives in `web/src/core/mocks/` (apps, sandboxes, workspaces). The demo/dev switcher uses `mock-decider.service.ts`.

## Backend Route Coverage

`control_plane/app/main.py` exposes 85 routes. Categorized:

| Area | Routes | Notes |
|------|--------|-------|
| Auth / OAuth | 7 | register/login/oauth/me/password-reset |
| Workspaces | 7 | CRUD + members |
| Environments | 6 | CRUD + members |
| Workloads | 7 | CRUD + metrics/logs/invoke/status |
| Sandboxes | 6 | sessions/exec/tunnels/filesystem |
| Secrets | 3 | CRUD |
| Volumes | 12 | CRUD + blobs + entries + snapshots |
| API Keys | 3 | CRUD |
| Billing | 8 | balance/usage/credits/checkout/webhook/invoices |
| Schedules | 6 | full CRUD + trigger |
| Images | 5 | build/status |
| Routes | 3 | publish/list/delete |
| Providers | 5 | register/heartbeat/assignments/tunnel |
| Dashboard | 2 | summary + full dashboard |
| Invites | 3 | create/accept/list |
| Proxy Tokens | 5 | CRUD |
| Databases | 3 | schema/batch/transactions |
| Functions | 4 | autoscaler/stats/invocations |
| RunPod | 1 | dispatch |
| Admin | 1 | dynamodb items |

## Backend Implementation Status (Store layer)

| Feature | Implemented | Stubs | Missing |
|---------|-------------|-------|---------|
| Workloads | 6/7 | workload_logs (3 lines) | — |
| Sandboxes | 2/3 | — | delete_sandbox_session |
| Secrets | 3/3 | — | — |
| Volumes | 7/7 | — | snapshots not wired to frontend |
| Workspaces | 3/4 | get_workspace_member | — |
| Environments | 2/3 | list_environments | — |
| Auth | 2/4 | get_user, get_account | — |
| Billing | 6/8 | — | get_invoices, create_billing_report |
| Schedules | 5/6 | get_schedule | — |
| Images | 3/4 | get_image | — |
| Routes | 3/3 | — | — |
| API Keys | 3/3 | — | — |

## SDK Coverage

The Python SDK (`sdk/python/boxty/`) covers 60 endpoint patterns. It is missing 27 backend patterns, notably:
- OAuth flows
- Password reset
- Billing reports / webhook
- Databases endpoints
- Environment / workspace members
- Function autoscaler/stats/invocations
- Proxy tokens
- Sandbox exec/tunnels/filesystem
- Advanced volume entries/snapshots
- `/users/{user_id}`

## CLI Coverage

The CLI (`cli/boxty_cli/`) has 43 commands:

| Module | Commands | Status |
|--------|----------|--------|
| auth | login, logout, whoami | fully implemented |
| workspaces | list, create, switch, delete | implemented (uses SDK) |
| environments | list, create, delete | implemented |
| apps | deploy, serve, run, list, logs, stop, delete, rollback, history | deploy/serve/run/list/logs/stop/delete implemented; rollback/history stubbed |
| volumes | list, create, delete, ls, get, put, rm, cp | implemented |
| secrets | list, create, delete | implemented |
| tokens | set, new | implemented (local config) |
| containers | list, logs, exec, stop | implemented |
| launch | list, new | implemented (local scaffolding) |
| profile | list, activate, current | implemented (local config) |
| config_cmd | show, set-environment | implemented (local config) |
| shell | — | implemented |

## Frontend vs Backend Gap Analysis

| Frontend Page | Backend Support | Notes |
|---------------|-----------------|-------|
| Dashboard | yes | real workloads + summary |
| Apps list | yes | real workloads |
| App detail | yes | real workload |
| Logs | partial | backend `workload_logs` is stub (3 lines) |
| Schedules | yes | full CRUD |
| Storage/Volumes | yes (with mocks in dev) | real endpoints exist; frontend uses mocks in dev |
| Secrets | yes (with mocks in dev) | real endpoints exist; frontend uses mocks in dev |
| Billing | yes | balance/usage/credits |
| Workspaces | yes | real CRUD |
| Settings | partial | profile page uses `/users/{user_id}` (stub) |
| Images | yes | build/status/delete |
| Sandbox detail | partial | sessions implemented, exec/tunnels not in SDK/CLI |

## CLI vs Backend Gap Analysis

| CLI Feature | Backend Support | Status |
|-------------|-----------------|--------|
| App deploy | yes | fully wired |
| App run/invoke | yes | fully wired |
| App stop/delete | yes | fully wired |
| Volume CRUD | yes | fully wired |
| Secret CRUD | yes | fully wired |
| Workspace/Env CRUD | yes | fully wired |
| OAuth login | yes | backend supports, CLI uses direct login |
| Rollback / history | no | explicitly stubbed in CLI |
| Sandbox exec/tunnels | partial | backend exists but not in SDK/CLI |
| Function autoscaling | no | backend route exists, not in SDK/CLI |
| Proxy tokens | no | backend route exists, not in SDK/CLI |
| Database endpoints | no | backend exists, not in SDK/CLI |

## Conclusion

- Backend is the most complete layer: ~85 routes, most backed by real `InMemoryStore` logic.
- Frontend is mostly wired to backend but has mock fallbacks for secrets/volumes in dev/demo mode and some read-only stubs for logs/users.
- CLI relies on the Python SDK, which covers ~74% of backend patterns. The biggest gaps are advanced features (OAuth, sandbox exec, function autoscaling, proxy tokens, databases).
- Recommended next steps: fill backend read-only stubs (logs, users, accounts, environments list, member lookups), extend SDK to cover missing patterns, and remove mock fallbacks in frontend once backend dev endpoints are stable.
