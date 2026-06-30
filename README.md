# Boxty

Boxty is a serverless platform with a centralized FastAPI control plane, provider workers, SDKs, and web frontends. It replaces the legacy P2P/Solana architecture with a clean provider model where workers claim workloads from the control plane and execute them locally via Docker or Podman.

## Active Repository Layout

```text
boxty/
├── control_plane/   # FastAPI control plane, user/worker/admin CLIs, tests
├── cli/             # Rust CLI codebase retained from agentnet
├── infrastructure/  # Terraform, Ansible, and deployment scripts
├── sdk/             # Python and JavaScript SDKs
├── landing/         # Marketing / landing frontend
├── web/             # Product dashboard frontend
├── docs/            # Backend/runtime/platform documentation
├── examples/        # Example workloads and sample apps
└── scripts/         # Operator and setup scripts
```

## Services

### `control_plane/` — Central Control Plane

The control plane is a **FastAPI** application that is the single source of truth for the entire platform.

**Responsibilities:**
- **Identity & Access** — user registration, API tokens, workspaces, environments, email invites, and provider enrollment tokens.
- **Scheduling** — provider capability filtering, pool selection, region awareness, workload-to-provider lease assignment, and fallback to RunPod for GPU workloads.
- **Routing** — stable Boxty endpoint URLs, provider private-origin mapping, health-based failover, and endpoint lifecycle attach/detach.
- **Metering & Billing** — event-based usage tracking for CPU seconds, memory-seconds, GPU seconds, storage, and egress. Includes a $20 bootstrap credit for new accounts.
- **Workload Lifecycle** — creation and tracking of sandbox, function, endpoint, and build workloads.
- **Persistence** — DynamoDB single-table mirroring (with in-memory fallback for local dev).

**Included CLIs:**
- `boxty-user` — end-user CLI for signup, balance, workspaces, environments, API keys, secrets, volumes, and workload creation.
- `boxty-supervisor` — admin/operator CLI for provider registration, heartbeats, usage metering, RunPod dispatch, route publishing, and DynamoDB inspection.
- `boxty-worker` — provider daemon CLI that registers the node, sends heartbeats, claims assigned workloads, and runs them locally via `ContainerWorkerRuntime` (Docker/Podman).

**Tech stack:** Python 3.11+, FastAPI, uvicorn, boto3 (DynamoDB), Pydantic models.

### `web/` — Product Dashboard

The main product frontend is a **React 18 + TypeScript + Vite + Tailwind CSS** application.

**Features:**
- Workspace / environment-scoped navigation (`/apps/:workspace/:environment`).
- App dashboard with filtering, sorting, and metrics cards.
- Sandbox detail pages with telemetry, instances, and file browsers.
- Billing, secrets, volumes, schedules, images, and logs management.
- Settings sub-pages (profile, workspaces, email, usage, API tokens).
- Auth provider with dev-mode fallback and protected routes.

**Architecture:**
- `core/` — domain models, services, use-cases, utilities, and mocks.
- `api/` — typed API clients for each domain (apps, auth, billing, volumes, etc.).
- `hooks/` — reusable React hooks (`useAuth`, `useApps`, `useWorkspaces`, `useSandboxes`).
- `components/` — ~25+ UI components (Layout, Sidebar, Navbar, AppCard, ChartCard, etc.).
- `pages/` — ~20 page-level components.

### `landing/` — Marketing Site

A lightweight **React 19 + Vite** landing page. Built separately from the product dashboard so it can be deployed independently (e.g., to Cloudflare Pages).

### `cli/` — Rust CLI

The legacy Rust CLI (`cli/sdk/`) is a cross-platform binary built with **Cargo**. It still contains P2P-era code (libp2p, Solana, WASM runtime) but is actively built and published as part of releases. The long-term plan is to migrate the Rust CLI to the same control-plane flows or retire it in favor of the Python-based `boxty-user` CLI.

**Supported platforms:** Linux (x64, arm64), macOS (Intel, Apple Silicon), Windows (x64).

### `sdk/` — Client SDKs

- **`sdk/python/`** — Python SDK (`boxty` package) for secrets, volumes, databases, and app state. Requires Python 3.9+. Built with `hatchling` and published to PyPI.
- **`sdk/js/`** — JavaScript/TypeScript SDK (`@boxty/sdk`) for the same surface. Distributed as ESM + CJS with TypeScript declarations. Published to npm.

### `infrastructure/` — Infrastructure Deployment

Terraform, Ansible, and GitHub Actions for deploying Boxty onto an existing VPS and managing cloud resources (AWS DynamoDB, Cloudflare R2 + DNS).

- `terraform/` — AWS DynamoDB, IAM, Cloudflare R2 bucket, DNS records.
- `ansible/` — playbooks and inventory for deploying the control plane and worker fleet onto existing VPS instances.
- `scripts/` — helper scripts including `sync-secrets.sh` for uploading local `.env` files to GitHub Secrets.

**Deployment model:**
- Control plane: one existing VPS.
- Workers: manual fleet expansion by adding entries to `infrastructure/ansible/inventory.yml` and running the playbook. No Kubernetes required at this stage.
- All workflows are triggered manually via `workflow_dispatch`.

See `infrastructure/README.md` for full setup instructions.

### `docs/` — Platform Documentation

- `central-control-plane.md` — architecture and design decisions for the control plane.
- `runtime-migration-plan.md` — migration status from P2P to the provider model.
- `infrastructure-contabo.md` — Contabo + Cloudflare R2 deployment guide.
- `dynamodb-single-table.md` — single-table schema and access patterns.
- `workers/` — worker deployment and configuration reference.

### `scripts/` — Operator Scripts

- `install-agentnet.sh` — legacy installer template for the Rust CLI.
- `setup-secrets.sh` — environment secrets setup.
- `run-boxty.sh`, `tmux-boxty.sh` — local operator helper scripts.

## Current Direction

- No new work should depend on the old P2P/Solana architecture.
- The control plane is the source of truth for users, workspaces, environments, API keys, invites, providers, workloads, and billing.
- Workers claim workloads from the control plane via `assignments/next` and execute them locally via Docker or Podman.
- RunPod is used as a GPU/image-build backend, not as the primary product interface.
- The frontend is being incrementally refactored with a layered `core/` architecture (models, services, use-cases) while the old routing remains functional.

## Key Docs

- [Platform Docs](docs/README.md)
- [Central Control Plane](docs/central-control-plane.md)
- [Infrastructure Deployment](infrastructure/README.md)
- [DynamoDB Single Table](docs/dynamodb-single-table.md)
- [Worker Deployment](docs/workers/README.md)
