# Boxty Frontend / Backend / CLI Coverage Report

## Executive Summary

- Backend: 85 HTTP routes, most implemented in `InMemoryStore`. Stub count reduced: logs, sandbox operations, function invocations, profile lookups are now backed by real store logic.
- Frontend: mock fallbacks removed from Secrets, Volumes, AppLogs and Profile. Pages now hit real backend endpoints.
- CLI: 43 commands across 12 sub-command modules. CLI uses the Python SDK which covers 60 endpoint patterns.

## Recent Changes

### Backend
- Added `delete_sandbox_session` store method + route.
- Added sandbox tunnel/exec/filesystem persistence in store.
- Added `list_function_invocations_by_workload` and wired `/functions/{id}/invocations`.
- Added `SandboxFileEntry` model and store methods for sandbox files.
- Added `delete_volume_entry` and `delete_volume_snapshot` store methods.
- `invoke_workload_sync` and `update_workload_status` now write `WorkloadLogEntry` records so logs are populated.
- Schedule trigger also writes a log entry.

### Frontend
- `web/src/api/secrets.ts` and `volumes.ts` no longer fall back to mock data.
- `StoragePage` fetches real volumes and passes workspace id to delete.
- `SecretsPage` fetches real secrets with workspace id and deletes by workspace/name.
- `AppLogs` renders real logs from `/workloads/{id}/logs` instead of mock array.
- `ProfilePage` uses `/auth/me` then `/accounts/{user_id}`.
- `auth.ts` exports a `whoami()` helper.

## Verification

- `python -m py_compile` passes for `store.py` and `main.py`.
- `npm run build` in `web/` passes (0 TypeScript errors).
- `npm run test` in `web/` passes (23/23 tests).

## Remaining Gaps

- Python SDK still does not cover ~27 backend patterns (OAuth, password reset, billing reports/webhook, databases, environment/workspace members, function autoscaling/stats/invocations, proxy tokens, sandbox exec/tunnels/filesystem, advanced volume entries/snapshots, `/users/{id}`).
- CLI `app rollback` / `history` are still stubbed.
- Sandbox filesystem/exec remain simulated in-memory for local demo; real provider integration would require connected worker.
- `get_invoices` still returns empty list unless Stripe is enabled.

## Conclusion

Frontend pages that previously relied on mock data for Secrets, Volumes, Logs and Profile now use real backend endpoints. Backend stubs for logs, sandbox lifecycle, function invocations and file operations have been replaced with in-memory store logic. Build and test suites remain green.
