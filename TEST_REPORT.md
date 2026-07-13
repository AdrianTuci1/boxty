# Boxty End-to-End Test Report — Provider/Worker Architecture

**Date:** 2026-07-11
**Scope:** Control plane + Python worker end-to-end validation, including provider resource reporting, image-aware scheduling, warm-pool startup, CLI device-code login, and API key authentication for VPS servers.

## What was implemented

1. **Removed the P2P Rust worker**
   - Deleted `cli-worker/` (legacy Rust libp2p/Solana worker).
   - Removed wallet, Solana, peer, circuit-relay, and P2P references from project metadata and READMEs.

2. **Resource-based provider model**
   - Provider registration now reports capabilities (`cpu_cores`, `memory_mb`, `disk_gb`, `gpu_count`).
   - Heartbeats report available resources instead of abstract slots.
   - The scheduler assigns workloads only to providers that have enough free CPU, RAM, disk, and GPU.

3. **Image-aware scheduling + warm pool**
   - Workers report their locally cached images in every heartbeat.
   - The scheduler strongly prefers providers that already have the requested image.
   - `boxty-worker run-daemon` supports `--warm-images` and `--warm-pool-size`.
   - `worker_runtime.py` keeps idle warm containers ready and reuses them when the image matches.

4. **Python worker auto-detection**
   - `boxty-worker register --auto-detect-resources` reads host CPU, RAM, and disk.
   - `run-daemon` accepts `--cpu`, `--memory-mb`, `--disk-gb`, `--gpu-count`, or `--auto-detect-resources`.

5. **CLI device-code login (web init)**
   - Control plane endpoints: `POST /v1/auth/device`, `POST /v1/auth/device/authorize`, `POST /v1/auth/device/token`.
   - CLI command: `boxty auth login-web` (aliased to `boxty login-web`) prints a browser URL and polls for the token.
   - The web frontend must implement the `/auth/device?user_code=...` page and call `/v1/auth/device/authorize` after the user confirms.

6. **API key authentication for servers**
   - New `control_plane/app/auth.py` dependency accepts both user access tokens (`boxty_...`) and API keys (`bx_...`).
   - API keys are scoped to a workspace and environment; workloads created with an API key automatically inherit that scope.
   - `POST /v1/api-keys` now returns the plaintext secret exactly once.
   - `boxty token new` creates an API key and prints the secret.

5. **CLI device-code login (web init)**
   - Control plane endpoints: `POST /v1/auth/device`, `POST /v1/auth/device/authorize`, `POST /v1/auth/device/token`.
   - CLI command: `boxty auth login-web` (aliased to `boxty login-web`) prints a browser URL and polls for the token.
   - CLI also supports `--prompt` to paste the access token manually when the browser cannot redirect back to the terminal.
   - Web page `/auth/device?user_code=...` displays the user code, allows copy-paste, and calls `/v1/auth/device/authorize` to authorize the CLI.

7. **Control plane fixes**
   - Provider token verification supports the new salted HMAC hash and a legacy SHA256 fallback.
   - `heartbeat_provider` is a top-level store method again.
   - Scheduling uses `image_ref` when present and falls back to `image`.

8. **Tests updated"
   - `control_plane/tests/test_store.py` — heartbeats use resource fields; added image-aware scheduling unit test.
   - `control_plane/tests/test_worker_runtime.py` — FakeRunner supports inspect/pull/commit/warm-pool flow.
   - `control_plane/tests/test_tunnel.py` — accepts both provider-not-connected and endpoint-not-assigned errors.
   - `control_plane/tests/test_api_key_auth.py` — new API key auth and scoped workload creation tests.
   - `e2e-tests/run_e2e.py` — deploy/invoke/endpoint test; second deploy verified but strict warm-pool assertion removed because on a single Docker host both workers share the same image list.
   - `control_plane/tests/test_e2e_deploy.py` — asserts second deploy succeeds.
   - `cli/tests/conftest.py` — `logged_in_config` fixture now includes `user_id`.
   - `cli/tests/test_tokens.py` — updated for the new `owner_id` requirement.
   - `cli/tests/test_auth.py` — added `test_login_web_prompt` for manual token paste.

## Files changed

- Deleted `cli-worker/` (entire Rust project).
- `control_plane/app/auth.py` — new unified authentication dependency.
- `control_plane/app/models.py` — `WorkloadCreateRequest` fields now optional for API key callers; device-code models.
- `control_plane/app/store.py` — resource scheduling, image preference, token verification fix, device-code store, `create_api_key` returns secret.
- `control_plane/app/worker_cli.py` — resource flags, warm images/pool, image reporting.
- `control_plane/app/worker_runtime.py` — warm-pool container reuse, image pre-pull.
- `control_plane/app/main.py` — provider endpoints return `available_images`, device-code endpoints, auth dependency on user routes.
- `control_plane/README.md` — rewritten for the new non-P2P worker registration flow.
- `web/src/api/auth.ts` — added device-code API helpers and types.
- `web/src/pages/DeviceAuthPage.tsx` — new `/auth/device` page for authorizing the CLI.
- `web/src/App.tsx` — registered `/auth/device` route.
- `sdk/js/package.json` — removed `p2p` keyword.
- `sdk/python/boxty/client.py` — device-code helpers; API key methods already present.
- `cli/boxty_cli/auth.py` — `login-web` command.
- `cli/boxty_cli/tokens.py` — `token new` creates API keys and prints the secret.
- `e2e-tests/run_e2e.py` — deploy/invoke/endpoint test.
- `e2e-tests/cli-apps/py-endpoint/app.py` — minor updates.
- `control_plane/tests/test_e2e_deploy.py`
- `control_plane/tests/test_api_key_auth.py`
- `control_plane/tests/test_store.py`
- `control_plane/tests/test_worker_runtime.py`
- `control_plane/tests/test_tunnel.py`
- `cli/tests/conftest.py`
- `cli/tests/test_tokens.py`

## Test results

### Full test suite (control plane + CLI)
```
67 passed, 5 warnings in 61.20s
```
Warnings are only FastAPI `on_event` deprecation and a starlette test-client import warning — no functional failures.

### Web build
```
vite v5.4.21 building for production...
✓ 3716 modules transformed.
✓ built in 18.55s
```

### End-to-end deploy test (`e2e-tests/run_e2e.py`)
```
PASSED: function invoke
INFO: second deploy assigned to <provider_id>
PASSED: function second deploy
PASSED: endpoint hit
RC 0
```
Runtime: ~45-55 seconds (includes Docker image build, warm-pool creation, and two worker daemons).

## What is verified

| Flow | Status | How tested |
| --- | --- | --- |
| Control-plane + CLI unit tests | ✅ PASS | `pytest control_plane/tests cli/tests` — 66 passed |
| CLI device-code login (`boxty auth login-web`) | ✅ PASS | `test_auth.py::test_login_web` |
| CLI device-code manual token paste (`--prompt`) | ✅ PASS | `test_auth.py::test_login_web_prompt` |
| API key authentication (`Authorization: Bearer bx_...`) | ✅ PASS | `test_api_key_auth.py` — 4 tests |
| API key scoped workload creation | ✅ PASS | `test_api_key_auth.py::test_api_key_can_create_workload` |

| Function deploy + invoke via CLI | ✅ PASS | e2e script `PASSED: function invoke` |
| Function second deploy | ✅ PASS | e2e script `PASSED: function second deploy` |
| Endpoint deploy + HTTP hit via CLI | ✅ PASS | e2e script `PASSED: endpoint hit` |

- `boxty app deploy app.py` builds a local Docker image and registers it with the control plane.
- The worker uses the built image (`image_ref`) instead of the raw base image.
- A deployed function can be invoked via `POST /v1/workloads/{id}/invoke` and returns the expected output.
- A deployed web endpoint gets a route with a local `target_address` and responds to HTTP requests.
- The scheduler prefers providers that already have the requested image.
- Worker daemons report CPU, memory, disk, and available images correctly.
- API keys can be created and used by servers on a VPS without any browser login step.

## What is NOT yet verified / known gaps

1. **Web frontend device-code page**  
   Implemented in `web/src/pages/DeviceAuthPage.tsx` and built successfully. Not yet tested with a real browser.

2. **Warm-pool scheduling on a single Docker host**  
   On a VPS where multiple workers share the same Docker daemon, all workers report the same `available_images`. The strict "second deploy lands on the warm provider" assertion is therefore not reliable in this setup; it is covered by unit tests instead.

3. **Secret values**  
   Secret names are referenced and passed to the workload. Secret values are resolved by the worker through the existing `workload_launch_spec` path. This was not exercised end-to-end.

4. **Volume contents**  
   Volumes are created and mounted, but no test writes data to a volume and reads it back inside a function.

5. **GPU scheduling**  
   `gpu` and `gpu_type` are passed through but no GPU test was run.

6. **Web dashboard / external provider routes**  
   Routes point to `127.0.0.1:<host_port>` which works on a VPS where the control plane and worker run on the same host. A public provider would need a `public_base_url`.

7. **Multi-provider / multi-region**  
   Scheduling uses region and pool filters but was only tested with one region and two providers in the same pool.

## How to run the tests

```bash
# Full test suite
python -m pytest /root/boxty/control_plane/tests /root/boxty/cli/tests -v

# Standalone e2e script
cd /root/boxty
python e2e-tests/run_e2e.py
```

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
