# Boxty Control Plane

This service is the central orchestration layer for the Boxty provider/worker architecture.

It is responsible for:

- user and provider identity
- provider registration and heartbeats
- workload creation and scheduling
- account bootstrap credits and CPU/RAM/GPU metering
- sandbox-only session brokering
- endpoint route ownership
- backend arbitration to VPS providers or RunPod
- worker assignment claiming and local execution
- DynamoDB single-table mirroring
- SMTP workspace invites

## Run locally

```bash
cd control_plane
python -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload
```

## Architecture

Providers are no longer P2P nodes. They register directly with the control plane over
HTTPS and report their available CPU, memory, disk, GPU, and locally cached images.
Scheduling picks a provider that has the requested resources and, when possible, already
has the requested image available locally. This enables sub-second warm starts when the
worker keeps a warm pool of ready containers.

## Included CLIs

- `boxty-user`
  - signup
  - balance
  - create-workload
  - workloads
  - sandbox-session
- `boxty-supervisor`
  - register-provider
  - heartbeat
  - meter-usage
  - dispatch-runpod
  - publish-route
- `boxty-worker`
  - register
  - heartbeat
  - claim-once
  - run-daemon

## Registering a worker

On the VM that will host the worker:

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

The command prints a `provider_id` and `provider_token`. Keep the token secure; it is used
for every heartbeat and claim. Then start the daemon:

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

The daemon heartbeats, claims workloads from the control plane, and keeps the requested
images warm. Increasing `--warm-pool-size` keeps more idle containers ready and reduces
startup latency at the cost of reserved memory on the VM.

## Worker registration flow

1. Operator installs Docker on the VM and authenticates it with the registry used by the
   control plane.
2. Operator installs the `boxty-worker` Python CLI from the `control_plane` package.
3. Operator registers the worker via the `register` command. The control plane stores the
   provider record and returns an authentication token.
4. Operator starts the daemon. The daemon detects host resources, reports them in the first
   heartbeat, and optionally pre-pulls and warms the requested images.
5. The control plane schedules workloads to this provider based on resources, image
   availability, and pool/region constraints.
6. The daemon claims assigned workloads, runs them in Docker containers, and reports status
   back to the control plane.
7. When the operator wants to drain the worker, send SIGTERM or use `--status draining` on a
   final heartbeat. The control plane will stop assigning new workloads and return existing
   resources once running workloads finish.
