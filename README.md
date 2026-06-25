# Boxty

Boxty is being consolidated around a centralized FastAPI control plane, a dedicated worker runtime, the active CLI, and the existing root `web/` frontend.

## Active Repository Layout

```text
boxty/
├── control_plane/   # FastAPI control plane, user/worker/admin CLIs, tests
├── cli/             # Active CLI codebase retained from agentnet
├── ansible/         # Contabo deployment for control plane and workers
├── sdk/             # Python and JavaScript SDKs
├── landing/         # Marketing / landing frontend
├── web/             # Existing product frontend kept in place for now
├── docs/            # Current backend/runtime/platform documentation
├── examples/        # Example workloads and sample apps
└── scripts/         # Operator and setup scripts
```

## Current Direction

- No new work should depend on the old P2P/Solana architecture.
- The control plane is the source of truth for users, workspaces, environments, API keys, invites, providers, workloads, and billing.
- Workers now move toward a provider model that claims workloads from the control plane and executes them locally via Docker or Podman.
- The root `web/` frontend is intentionally left untouched in this phase.

## Key Docs

- [Platform Docs](docs/README.md)
- [Central Control Plane](docs/central-control-plane.md)
- [DynamoDB Single Table](docs/dynamodb-single-table.md)
- [Infrastructure: Contabo + R2](docs/infrastructure-contabo.md)
- [Runtime Migration Plan](docs/runtime-migration-plan.md)
