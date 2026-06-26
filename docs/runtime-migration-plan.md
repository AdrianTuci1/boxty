# Boxty Runtime Migration Plan

This plan deliberately excludes the legacy `web/` and frontend routing stack. The platform now has an intermediate FastAPI control plane, so frontend routing must be redesigned later rather than patched incrementally.

## Scope for the current backend/runtime phase

- central control plane remains authoritative
- worker execution becomes real on provider machines
- user CLI and worker CLI operate without the legacy P2P transport
- web/frontend routing is out of scope for this phase

## What was missing before this phase

### 1. No real worker executor

The control plane could register providers and schedule workloads, but no daemon could actually claim and run workloads on provider machines.

### 2. No provider pull loop

There was no lease polling or assignment claiming flow from worker to control plane.

### 3. No real invite delivery

Invites existed only as data records and were not sent through SMTP or another mail provider.

### 4. No external persistence integration

The data model described DynamoDB single-table persistence, but the live store remained in-memory only.

### 5. No separation between worker and admin CLI

There was a user CLI and a supervisor-like CLI, but not a concrete worker CLI dedicated to offering resources and executing workloads.

## What is implemented now

### Worker execution

- `boxty-worker` exists as a dedicated provider CLI
- providers can register, heartbeat, claim assigned workloads, and run them
- execution uses Docker or Podman via a real subprocess-based runtime

### Workload lifecycle

- the control plane exposes `assignments/next`
- workers claim scheduled workloads
- workers update workload status to `claimed`, `running`, or `completed`
- runtime metadata such as container IDs and local origin ports is persisted

### Invite delivery

- SMTP sending is wired when SMTP settings are configured
- console fallback remains available for local/dev operation

### Persistence hooks

- DynamoDB single-table mirroring is wired through integration hooks
- entity writes and key deletions can be mirrored to the configured table
- in-memory state remains the test/runtime fallback until the repository is fully replaced

## What still remains

### 1. Replace in-memory store with a repository abstraction

Today the store mirrors to DynamoDB opportunistically. The next step is:

- define repository interfaces
- make DynamoDB the primary implementation
- keep the in-memory store only for tests

### 2. Real object-storage-backed volumes and artifacts

Cloudflare R2 config is present, but workload storage is not yet mounted through a real volume/object abstraction in the worker runtime.

### 3. Sandbox attach broker

Sandbox session tokens exist, but the worker still needs a session bridge that maps control-plane-issued attach rights to `docker exec` or equivalent interactive access.

### 4. Endpoint ingress redesign

The old `web/`-driven local routing flow should not be revived. A new ingress layer should be built later against control-plane-managed endpoint metadata.

### 5. Rust CLI migration

The legacy Rust CLI still contains P2P-era execution logic. The next runtime phase should either:

- replace it with the new Python-based control-plane CLIs, or
- port the same control-plane flows into Rust and retire the old libp2p/Solana paths

## Recommended execution order

1. Make DynamoDB the primary store.
2. Add real R2-backed artifact and volume operations.
3. Implement sandbox attach over `docker exec` with session-token verification.
4. Replace the old Rust provider path with the new worker flow.
5. Only then start the frontend and ingress cleanup.
