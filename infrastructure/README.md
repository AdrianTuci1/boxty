# Boxty Infrastructure

This directory contains the infrastructure-as-code and deployment automation for Boxty. It is designed for an existing VPS (no VPS provisioning via API) and uses Terraform for cloud resources, Ansible for server deployment, and GitHub Actions for orchestration.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Cloudflare                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ control.    │  │ cli.        │  │ app. / www.         │  │
│  │ boxty.dev   │  │ boxty.dev   │  │ boxty.dev           │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          ▼                ▼                    ▼
   ┌──────────────┐  ┌──────────┐      ┌───────────────┐
   │ Existing VPS │  │ R2 Bucket│      │ Cloudflare    │
   │ Control Plane│  │ Artifacts│      │ Pages (web)   │
   │ + Nginx      │  │ + Objects│      └───────────────┘
   └──────┬───────┘  └──────────┘
          │
          ▼
   ┌──────────────┐
   │ Worker VPS   │
   │ (Docker)     │
   └──────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AWS                                                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ DynamoDB single table: boxty-control-plane            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Directory Layout

```
infrastructure/
├── terraform/
│   ├── providers.tf          # Terraform backend and providers
│   ├── variables.tf          # Input variables
│   ├── main.tf               # Module wiring
│   ├── outputs.tf            # Output values
│   ├── aws/
│   │   ├── dynamodb.tf       # DynamoDB single table
│   │   ├── iam.tf            # IAM user for control plane
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── cloudflare/
│       ├── r2.tf             # R2 bucket and API token
│       ├── dns.tf            # DNS A records
│       ├── variables.tf
│       └── outputs.tf
├── ansible/
│   ├── inventory.yml         # Ansible inventory for existing VPS
│   ├── deploy-control-plane.yml
│   ├── deploy-workers.yml
│   └── templates/            # Jinja2 templates
├── scripts/
│   ├── sync-secrets.sh       # Upload local .env to GitHub Secrets
│   ├── sync-secrets.example.env
│   └── install.sh            # CLI installer served from cli.boxty.dev
└── README.md                 # This file
```

## Prerequisites

1. An existing VPS with:
   - Ubuntu 22.04+
   - Public IP
   - SSH access with key authentication
   - Ports 22, 80, 443 open

2. Cloud accounts:
   - AWS account (for DynamoDB)
   - Cloudflare account (for R2 and DNS)
   - Domain managed in Cloudflare

3. GitHub repository secrets:

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key for Terraform state and DynamoDB |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with DNS and R2 permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone ID for the domain |
| `CLOUDFLARE_PAGES_PROJECT` | Cloudflare Pages project name for web deployment |
| `CONTROL_PLANE_SSH_KEY` | SSH private key for control plane VPS |
| `WORKER_SSH_KEY` | SSH private key for worker VPS |
| `BOXTY_SECRET_ENCRYPTION_KEY` | AES-256 key for secret encryption |
| `BOXTY_PROVIDER_SHARED_TOKEN` | Shared token for worker registration |
| `BOXTY_R2_ACCOUNT_ID` | Cloudflare R2 account ID |
| `BOXTY_R2_BUCKET` | R2 bucket name |
| `BOXTY_R2_ACCESS_KEY_ID` | R2 access key |
| `BOXTY_R2_SECRET_ACCESS_KEY` | R2 secret key |
| `BOXTY_R2_PUBLIC_BASE_URL` | R2 public base URL |
| `BOXTY_DYNAMODB_TABLE_NAME` | DynamoDB table name |
| `BOXTY_DYNAMODB_REGION` | AWS region for DynamoDB |
| `CLI_BASE_URL` | Base URL for CLI downloads (default: `https://cli.boxty.dev`) |
| `PYPI_API_TOKEN` | PyPI API token for SDK/CLI publish |
| `NPM_TOKEN` | npm token for JS SDK publish |

### Web environment variables

The web build supports per-environment configuration via GitHub Secrets:

| Secret | Description |
|--------|-------------|
| `VITE_API_BASE_PRODUCTION` | Control plane API URL for production |
| `VITE_API_BASE_STAGING` | Control plane API URL for staging |
| `VITE_DEMO_MODE_PRODUCTION` | Enable demo mode in production (`true`/`false`) |
| `VITE_DEMO_MODE_STAGING` | Enable demo mode in staging (`true`/`false`) |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe publishable key |
| `VITE_POSTHOG_KEY` | PostHog project API key |
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking |

`VITE_DEV_MODE` and `VITE_USE_MOCKS` are always set to `false` in CI builds.

### Sync secrets from local .env file

1. Copy the example file:

```bash
cp infrastructure/scripts/sync-secrets.example.env infrastructure/scripts/.env
```

2. Fill in your real values.

3. Run the sync script:

```bash
./infrastructure/scripts/sync-secrets.sh
```

This uploads every non-empty, non-placeholder value to GitHub Secrets using the `gh` CLI.

## Setup

### 1. Configure Terraform Variables

Create `infrastructure/terraform/terraform.tfvars`:

```hcl
environment             = "production"
aws_region              = "eu-central-1"
cloudflare_account_id   = "your-account-id"
cloudflare_zone_id      = "your-zone-id"
domain                  = "boxty.dev"
control_plane_ip        = "203.0.113.10"
r2_bucket_name          = "boxty"
```

### 2. Initialize Terraform Backend

The Terraform state is stored in an S3 bucket. Create the bucket first:

```bash
cd infrastructure/terraform
aws s3 mb s3://boxty-terraform-state --region eu-central-1
terraform init
```

### 3. Configure Ansible Inventory

Edit `infrastructure/ansible/inventory.yml` and replace:
- `ansible_host` with your actual VPS IPs
- `ansible_ssh_private_key_file` with the path to your SSH keys

## Deployment Workflows

All workflows are triggered manually via `workflow_dispatch`.

### Provision Cloud Resources

```bash
gh workflow run provision-infrastructure.yml \
  -f environment=production \
  -f control_plane_ip=203.0.113.10 \
  -f terraform_action=apply
```

This creates:
- DynamoDB single table
- IAM user and access keys for the control plane
- Cloudflare R2 bucket
- DNS A records for `control`, `cli`, `app`, `www`
- Wildcard DNS `*.boxty.dev` for function endpoints

### Function endpoints

Functions can be exposed on custom subdomains such as:

```
myworkspace-myapp-myfunction.boxty.dev
```

Requirements:
- Wildcard DNS `*.boxty.dev` points to the control plane VPS.
- Nginx routes any `*.boxty.dev` request to the control plane.
- Control plane resolves the `Host` header to the correct function instance.
- A wildcard TLS certificate covers `*.boxty.dev`.

The control plane receives the original `Host` header and an additional `X-Boxty-Subdomain` header containing the subdomain part.

### Build and Publish Release

```bash
gh workflow run build-and-publish-release.yml \
  -f version=1.2.3 \
  -f web_environment=production
```

This publishes:
- Python SDK to PyPI
- JS SDK to npm
- Python CLI client to PyPI
- Rust CLI binaries to GitHub Releases and R2
- `install.sh` to `https://cli.boxty.dev/install.sh`
- `latest.json` manifest to `https://cli.boxty.dev/cli/latest.json`
- Web dashboard to Cloudflare Pages

The CLI can then be installed with:

```bash
curl -fsSL https://cli.boxty.dev/install.sh | sh
```

The web build uses environment-specific secrets (`VITE_API_BASE_PRODUCTION` or `VITE_API_BASE_STAGING`, etc.) based on the selected `web_environment`.

### Worker deployment model

Workers are **not** auto-provisioned. To add a worker:

1. Add the VPS to `infrastructure/ansible/inventory.yml` under `boxty_workers`.
2. Run the worker deploy workflow:

```bash
gh workflow run deploy-workers-contabo.yml \
  -f inventory_path=infrastructure/ansible/inventory.yml \
  -f target_group=boxty_workers
```

The worker playbook downloads the `boxty` binary from `https://cli.boxty.dev/cli/latest/` (always the latest release) and installs it as a systemd service. If you need a specific version, set `BOXTY_VERSION` in the workflow or override `boxty_version` in the inventory.

### latest/ is always overwritten

On every release, the `cli/latest/` prefix in R2 is overwritten with the new binaries, `install.sh`, and `latest.json`. This means:

- `curl -fsSL https://cli.boxty.dev/install.sh | sh` always installs the latest version.
- Workers deployed without an explicit version always run the latest binary.
- Pin to a specific version with `VERSION=1.2.3 curl -fsSL https://cli.boxty.dev/install.sh | sh` or by setting `BOXTY_VERSION=1.2.3`.

### Deploy Control Plane

```bash
gh workflow run deploy-control-plane-contabo.yml \
  -f environment=production \
  -f inventory_path=infrastructure/ansible/inventory.yml
```

This installs:
- Python 3.11 + venv
- Nginx + Certbot
- Control plane as systemd service
- TLS certificate via Let's Encrypt

### Deploy Workers

```bash
gh workflow run deploy-workers-contabo.yml \
  -f inventory_path=infrastructure/ansible/inventory.yml \
  -f target_group=boxty_workers
```

This installs:
- Docker
- Boxty worker binary from `https://cli.boxty.dev/cli/latest/`
- Worker config and secrets
- systemd service

### Deploy Everything

```bash
gh workflow run deploy-all.yml \
  -f version=1.2.3 \
  -f control_plane_ip=203.0.113.10 \
  -f environment=production
```

This runs the full pipeline:
1. Provision infrastructure
2. Build and publish release
3. Deploy control plane
4. Deploy worker fleet

## Local Deployment (without GitHub Actions)

### Provision resources

```bash
cd infrastructure/terraform
terraform apply
```

### Deploy control plane

```bash
cd infrastructure/ansible
export BOXTY_SECRET_ENCRYPTION_KEY=...
export BOXTY_PROVIDER_SHARED_TOKEN=...
# ... other secrets
ansible-playbook -i inventory.yml deploy-control-plane.yml
```

### Deploy workers

```bash
cd infrastructure/ansible
export BOXTY_VERSION=1.2.3
export BOXTY_PROVIDER_SHARED_TOKEN=...
# ... other secrets
ansible-playbook -i inventory.yml deploy-workers.yml
```

## Security Notes

- No secrets are stored in the repository.
- All secrets are injected via GitHub Secrets or environment variables.
- Terraform state bucket should have versioning and encryption enabled.
- IAM user has limited permissions to only the Boxty DynamoDB table.
- R2 API token has limited permissions to R2 storage operations.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Terraform state bucket missing | Create `boxty-terraform-state` S3 bucket first |
| Certbot fails | Ensure DNS records point to the VPS and port 80 is open |
| Worker cannot download binary | Verify R2 bucket and `BOXTY_R2_PUBLIC_BASE_URL` |
| DynamoDB connection fails | Check IAM credentials and table name |
