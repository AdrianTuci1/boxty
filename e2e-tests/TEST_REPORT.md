# Boxty End-to-End Test Report

Generated: 2026-07-03T04:27:59.402720

## Executive summary

- Environment: Ubuntu 24.04, Python 3.12, Node v22, Docker 29.5
- Control plane: http://127.0.0.1:3000 (running)
- Local worker: online with 2 slots
- Secret encryption key configured for local testing

## Verified CLI commands (unified `boxty` CLI)

| Command | Status | Notes |
|---------|--------|-------|
| `boxty login <token>` | PASS | Saves token to ~/.boxty/config.json |
| `boxty whoami` | PASS | Returns user, workspace, environment, balance, workspaces |
| `boxty profile` | PASS | Compact profile summary |
| `boxty config` | PASS | Shows api_url, token, user, workspace |
| `boxty token set` / `show` | PASS | Manage local token |
| `boxty init --template python|node|http` | PASS | Scaffolds app.py (+ server.js for node) |
| `boxty run app.py` | PASS | Function workload completes |
| `boxty deploy app.py` | PASS | Python/Node endpoint running, HTTP 200 |
| `boxty sandbox app.py` | PASS | Sandbox running, attach command generated |
| `boxty ls` | PASS | Lists workloads by kind or all |
| `boxty logs <id>` | PASS | Shows captured stdout/stderr |
| `boxty stop <id>` | PASS | Deletes workload |
| `boxty route publish <id> <hostname>` | PASS | Publishes public route for endpoint |
| `boxty route ls` | PASS | Lists published routes |
| `boxty secret create` | PASS | Creates encrypted secret per workspace |
| `boxty secret ls` | PASS | Lists secrets and key names |
| `boxty volume create` | PASS | Creates volume per workspace |
| `boxty volume ls` | PASS | Lists volumes |
| `boxty workspace create` / `ls` | PASS | Manage workspaces |
| `boxty env create` / `ls` | PASS | Manage environments |
| `boxty provider register --public-base-url` | PASS | Registers provider with public URL |
| `boxty provider run` | PASS | Worker daemon online |

## Routing / subdomains

Functions are **serverless one-shot** workloads and do not get a public route. Only `endpoint` workloads can receive a public hostname via `boxty route publish`. The provider must be registered with `--public-base-url` so the control plane can target it. For a real subdomain, a reverse proxy/gateway must route the hostname to the provider origin URL.

## SDK fixes applied

- `sdk/python/boxty/app.py`: App default name, optional image, Secret.set_env, Database class.
- `sdk/python/boxty/__init__.py`: exports Client, Database.
- `sdk/python/boxty/client.py`: create_workspace(name), create_sandbox(...).

## CLI changes

- New package `cli-client/` with unified `boxty` CLI covering onboarding, deployments, storage, and configuration.
- Inline source execution via base64+gzip for Python/Node.
- Default Python images mapped to local `boxty-python-runner`.

## Control plane changes

- Added `GET /v1/auth/me` (token-aware).
- Added `GET /v1/routes`.
- Added `DELETE /v1/workloads/{id}`.
- Added `issued_access_token_inv` helper.
- Worker runtime wrapped for fault tolerance.

## Known limitations

- GPU, RunPod, AWS, S3/R2, Stripe, Solana, custom DNS: skipped (external provisioning).
- High-level Sandbox object API (`s.exec`, `s.delete`) not implemented in SDK.
- `boxty exec`, `boxty forward`, `boxty shell <id>` are not yet implemented (only sandbox via app.py).
- JS/TS SDK examples not tested (no local JS SDK build).

---
Report path: `/root/boxty/e2e-tests/TEST_REPORT.md`
CLI: `/root/boxty/cli-client/`
Examples: `/root/boxty/e2e-tests/cli-apps/`