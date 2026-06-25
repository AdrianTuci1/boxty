# Boxty Central Control Plane Migration

## Goal

Move Boxty from a peer-to-peer Solana/libp2p network to a centralized control plane that preserves:

- the current CLI and SDK developer experience
- programmatic launch of sandboxes, functions, and endpoints
- easy provider onboarding on commodity VPS instances
- optional GPU/image build/endpoint serving through RunPod serverless when Boxty does not own GPU capacity

The control plane becomes the source of truth for identity, quotas, routing, billing, provider registration, and workload lifecycle.

New accounts receive a bootstrap credit of `20 USD`, and usage metering must account for CPU, RAM, GPU, and storage time, not only GPU.

Each new account must also create:

- a default workspace named exactly like the user identifier
- a default environment named `main` inside that workspace

These defaults cannot be deleted independently; they disappear only when the account is deleted.

## Target Architecture

```text
CLI / SDK
    |
    v
FastAPI Control Plane
    |- Identity / API tokens / orgs / users
    |- Provider registry / health / scheduling
    |- Workload lifecycle / endpoint routing
    |- Usage metering / billing events
    |- Sandbox-only SSH broker
    |- RunPod arbitration adapter
    |
    +--> VPS Providers
    |      |- sandbox workloads
    |      |- CPU functions
    |      `- public endpoints through control-plane routing
    |
    `--> RunPod Serverless
           |- image build jobs
           |- GPU inference endpoints
           `- no SSH exposure
```

## Core Decisions

### 1. Replace P2P discovery with a control-plane registry

Current provider discovery is based on `libp2p`, local fleet state, and signaling/bootstrap concepts. Replace it with:

- `provider register`
- `provider heartbeat`
- `provider drain/undrain`
- `provider capabilities`
- `provider lease assignment`

Provider identity should be a Boxty-issued API credential or signed registration token, not a peer ID.

### 2. Keep CLI/SDK stable by swapping transport, not abstractions

The current abstractions are still useful:

- `function`
- `sandbox` / `shell`
- `deploy`
- `attach`
- secrets
- volumes
- databases

These should call HTTPS control-plane APIs instead of signaling/libp2p/Solana flows. That lets you keep the product surface while replacing the execution fabric underneath.

### 3. Separate sandbox access from served application traffic

SSH or interactive shell must only exist for workloads explicitly created as sandboxes.

Rules:

- `sandbox` workloads may receive ephemeral SSH/session tokens
- `function` and `endpoint` workloads never expose SSH
- public traffic always goes through routed endpoints, never direct provider SSH
- the provider agent must expose separate internal executors for shell and serving

### 4. Use RunPod as an execution backend, not as the product interface

RunPod should be treated as a backend selected by the scheduler when:

- the workload requires GPU
- the user requests image builds that need accelerators
- there is no compatible Boxty-managed provider capacity

Boxty still owns:

- API surface
- identity
- endpoint URLs
- metering
- deployment records
- logs and state model

Users launch workloads through Boxty; Boxty arbitrates to RunPod.

## Workload Classes

### Sandbox

- interactive
- SSH/session allowed
- private by default
- intended for development, debugging, ad-hoc execution

### Function

- short-lived execution
- no SSH
- request/response oriented
- can run on provider pools or RunPod serverless

### Endpoint

- long-lived service
- no SSH
- routed via control-plane ingress
- may target VPS provider or RunPod

### Build Job

- internal workload for image build or packaging
- no SSH
- can be offloaded to RunPod serverless

## Tenant Model

### Workspace

- top-level isolation boundary for apps, secrets, routes, workloads, invites, and API keys
- default workspace is created at signup

### Environment

- scoped execution context inside a workspace
- use for `main`, `staging`, `preview`, `prod`, and similar lifecycle stages
- default environment `main` is created at signup

### API Keys

- created per workspace + environment
- used by SDK/CLI/automation
- should be revocable and auditable

### Email Invites

- workspace owner invites collaborators by email
- invite acceptance should attach the collaborator to the target workspace
- sending is owned by the control plane, not by workers

## Control Plane Responsibilities

### Identity

- users, organizations, API tokens
- workspaces, environments, API keys
- email invites
- provider enrollment tokens
- scoped workload access
- sandbox session grants

### Scheduling

- provider capability filtering
- pool selection
- region awareness
- workload-to-provider lease creation
- fallback to RunPod

### Routing

- stable Boxty endpoint URLs
- provider private-origin mapping
- health-based failover
- endpoint lifecycle attach/detach

### Metering and Billing

- CPU seconds
- memory-seconds
- GPU seconds
- storage
- egress
- RunPod passthrough costs plus Boxty margin

This should be event-based and independent of blockchain settlement.

## Provider Model

Each VPS runs a lightweight provider agent. It should not require gVisor or KVM-dependent virtualization.

Recommended provider responsibilities:

- register with control plane
- heartbeat capabilities and available slots
- launch sandbox/function/endpoint workloads
- enforce local cgroup/container isolation where available
- return logs, status, and usage
- accept control-plane-issued session tokens for sandbox attach

Recommended non-goals for provider nodes:

- no peer discovery
- no direct public control API for users
- no wallet-based payment logic
- no SSH to endpoint runtimes

## RunPod Model

For RunPod-backed execution:

- control plane creates a backend workload
- stores external provider IDs
- binds a Boxty workload ID to a RunPod resource
- streams logs/status back into Boxty state
- exposes a Boxty URL instead of exposing raw RunPod URLs

Constraints:

- no SSH passthrough to RunPod instances
- secrets injected by Boxty control plane
- endpoint publish happens only after health validation

## Migration Phases

### Phase 1. Introduce centralized control plane

- add FastAPI service
- define auth, workspaces, environments, api keys, invites, providers, workloads, routes, and usage APIs
- keep current CLI behavior mocked if needed

### Phase 2. Add provider agent registration path

- switch Ansible worker config from gateway/signaling language to control-plane language
- issue provider tokens
- start heartbeats and provider capability reporting

### Phase 3. Switch CLI/SDK transport

- replace `signaling`/`peer` assumptions with `control_plane_url`
- map `boxty sandbox/function/deploy/attach` to HTTP APIs
- preserve commands and SDK semantics

### Phase 4. Introduce centralized ingress and endpoint routing

- stable Boxty domains
- path/subdomain routing to provider or RunPod origins
- endpoint health checks

### Phase 5. Replace Solana billing with internal ledger

- account balances
- usage events
- invoices / prepaid credits / Stripe or invoice billing
- margin-aware passthrough for RunPod-backed jobs

### Phase 6. Decommission P2P-only codepaths

- remove libp2p bootstrap/discovery from default flow
- remove Solana escrow dependence from core execution path
- retain any useful cryptographic signing only where it still serves auth

## Immediate Refactors In The CLI

The CLI should move toward these runtime concepts:

- `boxty-user`
- `boxty-supervisor`
- `--control-plane-url`
- `BOXTY_CONTROL_PLANE_URL`
- `provider register`
- `provider heartbeat`
- `workload create`
- `sandbox attach`

The old `--signaling` argument should become deprecated compatibility sugar, then removed.

## Risks

### Scheduling drift

If provider heartbeats are stale, the scheduler can over-assign workloads. Solve with short TTL leases and heartbeat expiration.

### SSH leakage into served runtimes

If sandbox and endpoint launchers are not separated, users may gain shell access to serving instances. Solve with workload-type-specific executors and a session broker that only works for sandbox workloads.

### RunPod vendor lock-in

Hide provider-specific IDs behind a Boxty backend adapter interface so you can add other backends later.

### Rewriting too much at once

Do not refactor the entire CLI first. Stand up the control plane and provider registration path before switching user-facing commands.

## Recommended Next Implementation Steps

1. Land the control plane API skeleton and provider config changes.
2. Add a Rust `control_plane` client module and thread it through CLI command handlers.
3. Convert `boxty provider` from libp2p bootstrap to HTTP registration + heartbeat.
4. Convert `boxty sandbox` and `boxty deploy` to create workloads through the control plane.
5. Add a real RunPod adapter behind the workload scheduler.
