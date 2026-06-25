# Boxty Control Plane

This service is the central orchestration layer for the non-P2P Boxty architecture.

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

## Current scope

The current implementation is an API skeleton with in-memory state. It defines the contracts needed to migrate the CLI and provider agent away from libp2p/Solana flows.

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
