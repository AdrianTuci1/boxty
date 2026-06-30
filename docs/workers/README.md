# Worker Deployment

## Overview

Boxty workers are provider agents registered into the Boxty control plane. Deploy them across multiple VPS instances for CPU workloads, sandbox workloads, and endpoint serving.

## Quick Start

### 1. Prepare VPS Nodes

Ensure each VPS has:
- SSH access with key authentication
- Python 3 installed
- Docker (optional, for sandbox isolation)
- outbound HTTPS access to the control plane

### 2. Configure Inventory

Edit `infrastructure/ansible/inventory.yml`:

```yaml
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
  vars:
    boxty_control_plane_url: https://control.boxty.dev
    boxty_provider_pool: general
    boxty_allow_public_ssh: false
    boxty_runpod_enabled: true
```

### 3. Deploy

```bash
cd ansible
ansible-playbook -i inventory.yml deploy-workers.yml -e "BOXTY_VERSION=1.2.3"
```

## Configuration

### Worker Config

Each worker reads `/opt/boxty/config/worker.json`:

```json
{
  "node": {
    "id": "worker-01",
    "region": "eu-central",
    "labels": { "gpu": "true", "tier": "premium" }
  },
  "control_plane": {
    "url": "https://control.boxty.dev",
    "provider_pool": "general",
    "retry_interval_ms": 5000
  },
  "worker": {
    "concurrency": 4,
    "heartbeat_interval_sec": 30
  },
  "sandbox": {
    "ssh_mode": "sandbox_only"
  },
  "backends": {
    "runpod_enabled": true,
    "runpod_default_template": "gpu-inference"
  }
}
```

### Secrets

Secrets are stored in `/opt/boxty/config/secrets.env`:

```bash
BOXTY_CONTROL_PLANE_URL=https://control.boxty.dev
BOXTY_PROVIDER_TOKEN=xxx
BOXTY_NODE_KEY=xxx
```

Sandbox policy:

- interactive SSH/session access is allowed only for sandbox workloads
- served endpoints and functions are never exposed through SSH
- GPU-heavy workloads can be arbitraged to RunPod when local provider capacity is missing

## Monitoring

Check worker status:

```bash
ssh worker-01 systemctl status boxty-worker
```

View logs:

```bash
ssh worker-01 journalctl -u boxty-worker -f
```

## Scaling

Add more workers by adding entries to `inventory.yml` and re-running the playbook.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Worker won't start | Check `secrets.env` permissions (600) |
| Can't connect to control plane | Verify firewall allows outbound HTTPS |
| Binary not found | Ensure `boxty` binary is executable |
