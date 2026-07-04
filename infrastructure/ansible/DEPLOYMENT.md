# Boxty Deployment Guide

This guide covers the complete production deployment of Boxty on Contabo VPS using Ansible. The architecture consists of:

- **1 control plane** (public VPS, needs public IP + port 443/80)
- **N workers** (VPS without public IP required, connects via reverse tunnel)
- **ECR** for container images (or Docker Hub / GHCR)
- **DynamoDB** for state persistence (or in-memory for testing)
- **Cloudflare R2** for object storage

## Prerequisites

| Requirement | Control Plane | Worker |
|-------------|---------------|--------|
| OS | Ubuntu 22.04+ | Ubuntu 22.04+ |
| vCPU | 2+ | 2+ (recommended 4–8) |
| RAM | 4 GB+ | 4 GB+ (recommended 8 GB) |
| Disk | 40 GB SSD | 100 GB+ SSD (Docker layer caching) |
| Docker | Not required | **Required** |
| Public IP | **Required** | Not required (reverse tunnel) |
| Python | 3.11+ (installed by Ansible) | Not required |

Ansible must be installed on the machine running the playbooks:
```bash
pip install ansible
```

## Inventory Configuration

Edit `infrastructure/ansible/inventory.yml` to match your VPS infrastructure:

```yaml
all:
  children:
    boxty_control_plane:
      hosts:
        control-01:
          ansible_host: 198.51.100.20
          ansible_user: root
          ansible_ssh_private_key_file: ~/.ssh/control_plane
          boxty_region: eu-central
      vars:
        ansible_python_interpreter: /usr/bin/python3
        boxty_provider_pool: general
        boxty_secret_encryption_key: "change-me-32-chars-long"  # REQUIRED
        boxty_provider_shared_token: "bwp_production_shared_token_2024"  # REQUIRED

    boxty_workers:
      hosts:
        worker-01:
          ansible_host: 203.0.113.10
          ansible_user: root
          ansible_ssh_private_key_file: ~/.ssh/boxty_workers
          boxty_region: eu-central
          boxty_labels:
            gpu: "true"
            tier: premium
        worker-02:
          ansible_host: 203.0.113.11
          ansible_user: root
          ansible_ssh_private_key_file: ~/.ssh/boxty_workers
          boxty_region: eu-west
      vars:
        ansible_python_interpreter: /usr/bin/python3
        boxty_control_plane_url: https://control.boxty.dev
        boxty_provider_pool: general
        boxty_concurrency: 4
        boxty_max_memory: 2048
        boxty_max_cpu: 2
        boxty_gateway_port: 0  # 0 = tunneled only (no public gateway)
```

### Environment Variables (control plane)

| Variable | Description | Required |
|----------|-------------|----------|
| `boxty_secret_encryption_key` | AES-256 key for secret encryption (32+ chars) | **Yes** |
| `boxty_provider_shared_token` | Shared token for worker registration (Ansible injects this) | **Yes** |
| `boxty_r2_account_id` | Cloudflare R2 account ID | **Yes** (for volumes) |
| `boxty_r2_bucket` | R2 bucket name | **Yes** |
| `boxty_r2_access_key_id` | R2 access key | **Yes** |
| `boxty_r2_secret_access_key` | R2 secret key | **Yes** |
| `boxty_r2_public_base_url` | R2 public base URL | **Yes** |
| `boxty_dynamodb_table_name` | DynamoDB table name | Yes (for prod persistence) |
| `boxty_dynamodb_region` | AWS region for DynamoDB | eu-central-1 |
| `boxty_runpod_enabled` | Enable RunPod GPU fallback | true |
| `boxty_runpod_api_key` | RunPod API key | Optional |
| `boxty_smtp_host` | SMTP host for invite emails | Optional |
| `boxty_smtp_username` | SMTP username | Optional |
| `boxty_smtp_password` | SMTP password | Optional |

### Environment Variables (workers)

| Variable | Description | Default |
|----------|-------------|---------|
| `boxty_control_plane_url` | URL to control plane API | https://control.boxty.dev |
| `boxty_provider_pool` | Worker pool / tier | general |
| `boxty_concurrency` | Max concurrent workloads | 4 |
| `boxty_max_memory` | Memory limit per workload (MB) | 2048 |
| `boxty_max_cpu` | CPU cores per workload | 2 |
| `boxty_gateway_port` | Local gateway port (0 = tunneled only) | 0 |
| `boxty_runpod_enabled` | Allow RunPod GPU fallback | true |
| `boxty_runpod_default_template` | RunPod template ID | gpu-inference |

## Deployment Steps

### 1. Control Plane

Trigger the GitHub workflow **Deploy Control Plane Contabo** (or run locally with the same secrets):

```bash
cd ansible
ansible-playbook -i inventory.yml deploy-control-plane.yml
```

If running locally, export all required secrets as environment variables first (see [Required GitHub Secrets](#required-github-secrets)).

What the playbook does:
- Creates `boxty` user and `/opt/boxty-control-plane`
- Installs Python 3.11 + venv
- Copies `control_plane/` source code
- Creates virtual environment and installs dependencies via `pip install -e .`
- Deploys systemd service with env file
- Starts and enables the service

Verify:
```bash
ssh root@198.51.100.20
systemctl status boxty-control-plane
curl http://localhost:8000/healthz
```

### 2. Workers

**Before deploying workers**, you need to build the CLI binary for the target architecture and upload it to a CDN or S3 bucket accessible via `cli_base_url` in the playbook.

Then trigger the GitHub workflow **Deploy Workers Contabo** (or run locally):

```bash
cd ansible
ansible-playbook -i inventory.yml deploy-workers.yml
```

What the playbook does:
- Creates `boxty` user and installs Docker
- Downloads the prebuilt `boxty` CLI binary
- Deploys `worker.json` configuration and `secrets.env`
- Starts systemd service that runs `boxty worker --config worker.json`
- Opens a **reverse WebSocket tunnel** to the control plane automatically

Verify:
```bash
ssh root@203.0.113.10
systemctl status boxty-worker
journalctl -u boxty-worker -f
```

### 3. Reverse Tunnel Verification

The worker connects via WebSocket to:
```
wss://control.boxty.dev/v1/providers/{provider_id}/tunnel?token=...
```

This tunnel is used for **all endpoint traffic**. The worker does not need a public IP. On the control plane:

```bash
# Check active tunnels (in-memory, no persistence)
# Only visible in logs or metrics:
curl http://localhost:8000/healthz
# Check providers list via API:
curl -H "Authorization: Bearer ..." http://localhost:8000/v1/providers
```

## Reverse Tunnel Architecture

```
User Request
    ↓
Internet / DNS (control.boxty.dev)
    ↓
Control Plane Nginx (reverse proxy 443 → 8000)
    ↓
FastAPI `/r/{endpoint_name}` (proxy_endpoint)
    ↓
WebSocket tunnel → specific worker
    ↓
Worker local gateway (127.0.0.1:port) → Docker container
```

Key points:
- Workers **do not need** public IPs or firewall rules
- The tunnel is **persistent** (WebSocket) and auto-reconnects every 5s
- Request/response correlation uses `request_id` + async futures
- Gateway port on worker is tunneled only (port 0) by default
- If you want **direct local gateway access** for debugging, set `boxty_gateway_port: 8080`

## GitHub Secrets & Variables

All secrets are read from GitHub Secrets at deploy time. The workflows pass them as environment variables to Ansible, and the J2 templates use `lookup('env', ...)` to resolve them. This means **no secrets live in the repository** — not in `inventory.yml`, not in the templates, and not in any committed file.

### Required GitHub Secrets

| Secret | Used By | Description |
|--------|---------|-------------|
| `CONTROL_PLANE_SSH_KEY` | Control Plane | SSH private key for Ansible to reach the control plane VPS |
| `WORKER_SSH_KEY` | Workers | SSH private key for Ansible to reach worker VPS |
| `BOXTY_SECRET_ENCRYPTION_KEY` | Control Plane | AES-256 key for encrypting secrets (32+ chars) |
| `BOXTY_PROVIDER_SHARED_TOKEN` | Both | Shared token used by workers to register with the control plane |
| `BOXTY_R2_ACCOUNT_ID` | Both | Cloudflare R2 account ID |
| `BOXTY_R2_BUCKET` | Both | R2 bucket name |
| `BOXTY_R2_ACCESS_KEY_ID` | Both | R2 access key |
| `BOXTY_R2_SECRET_ACCESS_KEY` | Both | R2 secret key |
| `BOXTY_R2_PUBLIC_BASE_URL` | Both | R2 public base URL |
| `BOXTY_DYNAMODB_TABLE_NAME` | Control Plane | DynamoDB table name |
| `BOXTY_DYNAMODB_REGION` | Control Plane | AWS region (default: `eu-central-1`) |
| `BOXTY_RUNPOD_API_KEY` | Both | RunPod API key (optional) |
| `BOXTY_RUNPOD_DEFAULT_TEMPLATE` | Workers | RunPod template ID (default: `gpu-inference`) |
| `BOXTY_SMTP_HOST` | Control Plane | SMTP host (optional) |
| `BOXTY_SMTP_PORT` | Control Plane | SMTP port (default: `587`) |
| `BOXTY_SMTP_USERNAME` | Control Plane | SMTP username (optional) |
| `BOXTY_SMTP_PASSWORD` | Control Plane | SMTP password (optional) |
| `BOXTY_INVITE_EMAIL_FROM` | Control Plane | From address for invite emails (optional) |
| `BOXTY_CONTROL_PLANE_URL` | Workers | Control plane URL (default: `https://control.boxty.dev`) |
| `BOXTY_NODE_KEY` | Workers | Node identity key (optional) |
| `BOXTY_LLM_API_KEY` | Workers | LLM API key (optional) |

### How It Works

1. GitHub workflow runs with `secrets.*` injected as env vars.
2. Ansible playbook receives them via the shell environment.
3. J2 templates use `lookup('env', 'BOXTY_SECRET_ENCRYPTION_KEY')` to read the value.
4. If the env var is missing, the template falls back to the Ansible variable (for local testing).

## Updating the Deployment

### Control Plane Update
```bash
ansible-playbook -i inventory.yml deploy-control-plane.yml
```
Source code is re-synced and service is restarted.

### Worker Binary Update
1. Build new binary (`cargo build --release`)
2. Upload to CDN
3. Set `BOXTY_VERSION` env var to bust cache:
```bash
BOXTY_VERSION=v1.0.1 ansible-playbook -i inventory.yml deploy-workers.yml
```

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Control plane 502 | venv not created | Check `pip install -e` output |
| Worker "docker not found" | Docker not installed | Run playbook again or install manually |
| Worker "invalid token" | Provider token mismatch | Check `BOXTY_PROVIDER_TOKEN` in env |
| Tunnel disconnected | Worker restarted | Wait 5s for auto-reconnect |
| Endpoint 503 | No active tunnel | Worker is offline or not registered |
| Endpoint 404 | Wrong endpoint name | Check workload `endpoint_name` field |

## Security Checklist

- [ ] All secrets are in **GitHub Secrets** — never in git
- [ ] `BOXTY_SECRET_ENCRYPTION_KEY` is 32+ random characters
- [ ] `BOXTY_PROVIDER_SHARED_TOKEN` is unique per environment
- [ ] SSH keys (`CONTROL_PLANE_SSH_KEY`, `WORKER_SSH_KEY`) are stored in GitHub Secrets, not in the repo
- [ ] Control plane firewall allows only 443 and 22
- [ ] Worker firewall blocks all inbound (except 22 for SSH)
- [ ] `boxty_gateway_port: 0` on workers (no public gateway)
- [ ] systemd `ProtectSystem=strict` and `NoNewPrivileges=true` enabled
