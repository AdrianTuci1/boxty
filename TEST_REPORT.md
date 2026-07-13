# Boxty End-to-End Test Report — Provider/Worker Architecture

**Date:** 2026-07-13
**Scope:** Control plane + Python worker end-to-end validation, including auth, schedules, volumes, secrets, provider lifecycle, stale expiration, CLI deploy, function invoke, endpoint serving, and image-aware scheduling.

## What was implemented

1. **E2E test harness (`e2e-tests/run_e2e.py`)**
   - Picks a free ephemeral port so parallel runs do not collide.
   - Starts a fresh control plane with in-memory state and filesystem object storage.
   - Stands up a shared provider for the early auth/schedule/volume/secret/provider tests.
   - Runs provider stale expiration against a separate control plane with a short TTL so the main provider stays healthy.
   - Starts a real `boxty-worker run-daemon` for the deploy/invoke/endpoint phase.
   - Cleans up Docker containers, local object storage, and the isolated CLI config after each run.

2. **Control-plane fixes discovered during E2E**
   - Added CORS middleware so the web device-code page can call the local API during development.
   - Reordered volume routes so `DELETE /v1/volumes/{locator}/blob` is matched before `DELETE /v1/volumes/{workspace_id}/{locator}`. This fixes the 404 seen when deleting a volume blob.
   - Shortened the scheduler tick to 5 seconds and made it also call `expire_stale_providers()` and `reclaim_expired_assignments()` every tick.

3. **Provider/worker scheduling**
   - A shared heartbeat provider is used only for the early tests; its heartbeat is stopped before deploy so the worker daemon is the only online provider when workloads are scheduled.
   - The worker daemon is started with `--poll-seconds 2` and the full control-plane environment so it can claim and run workloads quickly.

## Test results

### End-to-end suite (`e2e-tests/run_e2e.py`)
```
PASSED: auth register
PASSED: auth login
PASSED: auth login-web device code
PASSED: schedule create + interval trigger
PASSED: volume blob lifecycle
PASSED: secret lifecycle
PASSED: provider lifecycle
PASSED: provider stale expiration
PASSED: deploy function
PASSED: function running
PASSED: invoke function
PASSED: deploy endpoint
PASSED: endpoint running
PASSED: endpoint route
PASSED: image-aware scheduling

=== E2E results ===
PASSED: auth register
PASSED: auth login
PASSED: auth login-web device code
PASSED: schedule create + interval trigger
PASSED: volume blob lifecycle
PASSED: secret lifecycle
PASSED: provider lifecycle
PASSED: provider stale expiration
PASSED: deploy function
PASSED: function running
PASSED: invoke function
PASSED: deploy endpoint
PASSED: endpoint running
PASSED: endpoint route
PASSED: image-aware scheduling
```
Runtime: ~35 seconds.

### What is verified

| Flow | Status | How tested |
| --- | --- | --- |
| User registration | ✅ PASS | `PASSED: auth register` |
| User login | ✅ PASS | `PASSED: auth login` |
| Device-code web login | ✅ PASS | `PASSED: auth login-web device code` |
| Schedule create + interval trigger | ✅ PASS | `PASSED: schedule create + interval trigger` |
| Volume create + blob write/read/delete | ✅ PASS | `PASSED: volume blob lifecycle` |
| Secret create + list + delete | ✅ PASS | `PASSED: secret lifecycle` |
| Provider register/heartbeat/unregister | ✅ PASS | `PASSED: provider lifecycle` |
| Provider stale expiration | ✅ PASS | `PASSED: provider stale expiration` |
| Function deploy via CLI | ✅ PASS | `PASSED: deploy function` |
| Function reaches running | ✅ PASS | `PASSED: function running` |
| Function invoke via API | ✅ PASS | `PASSED: invoke function` |
| Endpoint deploy via CLI | ✅ PASS | `PASSED: deploy endpoint` |
| Endpoint reaches running | ✅ PASS | `PASSED: endpoint running` |
| Endpoint HTTP route | ✅ PASS | `PASSED: endpoint route` |
| Image-aware scheduling | ✅ PASS | `PASSED: image-aware scheduling` |

## Files changed

- `e2e-tests/run_e2e.py` — rewritten to cover the full flow above.
- `control_plane/app/main.py` — CORS middleware; reordered volume DELETE routes.
- `control_plane/app/scheduler.py` — 5-second tick; stale/lease reclamation every tick.
- `TEST_REPORT.md` — this report.

## Known gaps / next steps

1. **GPU scheduling** — `gpu` and `gpu_type` are passed through but no GPU test was run.
2. **Multi-provider / multi-region** — scheduling filters are in place but only one region/pool was exercised end-to-end.
3. **Public providers** — routes point to `127.0.0.1:<host_port>` which works on a single VPS; a public provider would need `public_base_url`.
4. **Web device-code page in real browser** — API endpoints are tested; a real browser automation test is not included yet.
5. **Volume contents inside a workload** — volume blobs are tested via the API but not mounted and read inside a running function.
6. **Secret values inside a workload** — secrets are created via API but not injected into a running workload.

## How to run the tests

```bash
# Full control-plane unit suite (runs in CI)
python -m pytest /root/boxty/control_plane/tests -v

# Standalone e2e script (local only — requires Docker, CLI, and SDK installed)
cd /root/boxty
python e2e-tests/run_e2e.py

# CLI and SDK Python unit tests (local only — require the SDK package installed)
python -m pytest /root/boxty/cli/tests -v
python -m pytest /root/boxty/sdk/python/tests -v
```

E2E and CLI/Python SDK tests are intentionally **local-only** because they require a local Docker daemon and the `boxty`/`boxty-cli` packages installed from the repository. GitHub Actions runs only the control-plane unit tests, plus the SDK JS and web builds.

## How to add a worker to a VPS

1. Install Docker on the VM and make sure it can reach the control plane.
2. Install the worker CLI:
   ```bash
   cd /root/boxty/control_plane
   pip install -e .
   ```
3. Register the worker:
   ```bash
   export BOXTY_API_URL=https://boxty.example.com
   boxty-worker register \
     --provider-name "worker-01" \
     --region "eu-central" \
     --pool "general" \
     --auto-detect-resources \
     --supports-endpoints \
     --supports-image-builds
   ```
   Save the printed `provider_id` and `provider_token`.
4. Start the daemon:
   ```bash
   boxty-worker run-daemon \
     --provider-id $PROVIDER_ID \
     --provider-token $PROVIDER_TOKEN \
     --auto-detect-resources \
     --supports-endpoints \
     --supports-image-builds \
     --warm-images "python:3.11-slim,node:18-slim" \
     --warm-pool-size 2
   ```
5. The control plane will now schedule workloads to this VM when resources and image availability match.

## How to use `boxty auth login-web` (CLI web login)

Automatic flow (same machine with browser):
```bash
export BOXTY_API_URL=https://boxty.example.com
boxty auth login-web
# Open the printed URL in a browser, confirm the user code, and return to the terminal.
# The CLI saves the token to ~/.boxty/config.json automatically.
```

Manual paste (browser on another device / no auto-redirect):
```bash
export BOXTY_API_URL=https://boxty.example.com
boxty auth login-web --prompt
# Open the URL, confirm the user code on the web page, then paste the
# access token shown in the browser into the terminal prompt.
```

For headless servers, use an API key instead of web login.

## How to create an API key for a server on a VPS

```bash
# On your local machine (or after logging in via CLI):
boxty auth login-web
boxty token new "server-01" --json
# Copy the `token_value` and use it on the server.
```

On the server, set the API key as an environment variable or pass it directly to the SDK:

```python
from boxty import Boxty

client = Boxty(base_url="https://boxty.example.com", token="bx_...")
workloads = client.list_workloads()
```

Or with the environment variable:

```bash
export BOXTY_TOKEN="bx_..."
python my_server.py
```

## Architecture note

The control plane is still an in-memory store (mirrored to DynamoDB/R2 via optional adapters). It is sufficient for local/VPS validation. For production, the single-table persistence path should be hardened and a real queue should replace the in-memory claim loop.
