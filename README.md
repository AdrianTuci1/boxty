# Boxty — Programmable Sandbox Platform

**Boxty** e o platformă de sandbox-uri izolate programatic — GPU, scale-to-zero, per-second billing. Inspirat de Modal.

```python
import boxty as bx

s = bx.Sandbox.create(image="pytorch:latest", gpu="A100")
print(s.exec("python train.py").stdout)
```

## Arhitectură

```
  CLI / SDK  ──▶  Node.js API  ──▶  Worker Go   ──▶  Sandbox (container)
  (Python, JS)      │                  │                  │
                    ▼                  ▼                  ▼
               DynamoDB          gVisor + runc        S3 volumes
               Stripe billing    TCP tunnel           ECR registry
                                 /proc metrics
```

## Features

| Categorie | Ce oferă |
|---|---|
| **Sandbox-uri** | CPU/GPU on-demand, scale-to-zero, idle timeout, snapshots, volumes persistente |
| **Workspace & RBAC** | Workspace-uri + Environment-uri (`main` default), API keys cu scoping per workspace/env, permissions `read`/`write`/`deploy`/`admin` |
| **Autentificare** | Register (web), Login (JWT), API keys (`boxty_...`), CLI: `boxty login <key>` / `boxty whoami` |
| **Billing** | Per-second billing, free trial credits, Stripe Checkout |
| **GPU** | T4, A10, L40S, A100, H100 — provisioning automat pe AWS (EC2 Spot) |
| **Build de imagini** | Din Dockerfile sau comenzi, push automat în container registry |
| **CLI** | `boxty run`, `boxty deploy`, `boxty shell`, `boxty logs`, `boxty forward` |
| **SDK** | Python + TypeScript — client complet pentru toate resursele API |
| **Web Dashboard** | React — workspace-uri, sandbox-uri, secrets, billing, API keys |
| **Infrastructură** | Terraform AWS (EC2, DynamoDB, S3, ECR), Docker Compose (dev local), GitHub Actions CI/CD |

## Structure

```
boxty/
├── api/          # Node.js API server (Fastify)
│   ├── src/
│   │   ├── middleware/auth.js     # Auth, register, login, API keys, RBAC
│   │   ├── routes/                # sandboxes, apps, volumes, secrets, workspaces, environments, billing...
│   │   └── services/              # cloud-provider, capacity-manager, billing-engine, worker-pool...
│   └── docs/                      # OpenAPI spec
├── worker/       # Go worker agent
│   ├── cmd/worker/                # Main entrypoint
│   └── internal/                  # sandbox, imagebuilder, secrets, metrics...
├── sdk-py/       # Python SDK
│   └── src/boxty/
│       ├── client.py              # Client: workspaces, sandboxes, apps, secrets, volumes...
│       └── cli/                   # boxty CLI (login, whoami, run, deploy, shell...)
├── sdk-js/       # TypeScript SDK
│   └── src/
│       ├── client.ts              # Client: same API as Python SDK
│       └── cli/index.ts           # boxty CLI (same commands)
├── web/           # React dashboard (Vite + Tailwind)
│   └── src/
│       ├── pages/                 # LoginPage, RegisterPage, Dashboard, SettingsPage...
│       └── api/                   # auth, volumes, secrets, apps...
├── infra/
│   ├── docker/                    # Docker Compose (dev local)
│   ├── terraform/aws/             # AWS: EC2, DynamoDB, S3, ECR, IAM
│   └── packer/                    # AMI build for worker VMs
└── scripts/                       # run-boxty.sh (Hermes orchestrator)
```

## Quick Start

```bash
# Dev local
docker compose -f infra/docker/docker-compose.yml up

# Install Python SDK
cd sdk-py && pip install -e . && cd ..

# Register via Web UI → get API key → login
boxty login boxty_xxxxxxxxxxxx

# Run a sandbox
boxty run examples/train.py
```

## Docs

- [Architecture](docs/architecture.md)
- [Auth & RBAC](docs/auth.md)
- [Quick Start](docs/quickstart.md)
- [API Reference](docs/api-reference.md)

## License

MIT
