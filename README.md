# Boxty — Programmable Sandbox Platform

**Boxty** e un serviciu care îți permite să pornești sandbox-uri izolate programatic, cu GPU, scale-to-zero, și per-second billing. Ca Modal, dar mai simplu și mai ieftin.

```python
import boxty as bx

sandbox = bx.Sandbox.create(image="pytorch:latest", gpu="A100")
result = sandbox.exec("python train.py")
print(result.stdout)
```

## Arhitectură

```
Python SDK ──▶  Node.js API  ──HTTP──▶  Workers (Go)
Node.js SDK ──▶        │                      │
                       ▼                      ▼
                  DynamoDB                gVisor sandbox
                  Stripe                  S3 snapshots
                  Cloudflare Tunnel       TCP proxy
```

## Componente

| Componentă | Director | Limbaj | Rol |
|---|---|---|---|
| **API Server** | `api/` | Node.js | Auth, lifecycle, billing, scheduler |
| **Worker Agent** | `worker/` | Go | gVisor, proxy, snapshots, idle detector |
| **Python SDK** | `sdk-py/` | Python | Client library + CLI |
| **Node.js SDK** | `sdk-js/` | TypeScript | Client library + CLI |
| **Infrastructure** | `infra/` | HCL/YAML | Docker Compose, Terraform, CI/CD |

## Quick Start

```bash
git clone https://github.com/boxty/sandbox-platform
cd boxty

# Dev local
docker compose -f infra/docker/docker-compose.yml up

# Instalează SDK
pip install -e sdk-py/

# Rulează un sandbox
boxty run examples/train.py
```

## License

MIT
