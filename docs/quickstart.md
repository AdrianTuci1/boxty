# Quick Start

## Local Development

### 1. Clone & start

```bash
git clone https://github.com/AdrianTuci1/boxty
cd boxty
docker compose -f infra/docker/docker-compose.yml up
```

Asta pornește:
- API server pe `http://localhost:3000`
- DynamoDB local pe `http://localhost:8000`
- Worker agent (mock)

### 2. Install SDK

```bash
# Python
cd sdk-py && pip install -e . && cd ..

# Node.js
cd sdk-js && npm install && npm run build && cd ..
```

### 3. Create account via Web UI

```bash
cd web && npm install && npm run dev
```

Deschide `http://localhost:5173` → Register → Login → Settings → Generate API key.

### 4. Login with CLI

```bash
boxty login boxty_xxxxxxxxxxxx
```

### 5. Run a sandbox

```bash
boxty run examples/train.py
```

## Python SDK

```python
import boxty as bx

# Client auto-loads ~/.boxty/config.json
client = bx.Client()

# Or explicit
client = bx.Client(api_key="boxty_xxx")

# Create a sandbox
s = client.create_sandbox(
    image="python:3.11",
    cpu=2,
    memory=4096,
    timeout=3600,
)

# Execute commands
s.exec("echo hello")
s.exec("pip install torch")
s.exec("python -c 'print(1+1)'")

# Get metrics
metrics = client.get_sandbox_metrics(s.id)
print(f"CPU: {metrics.get('cpu_pct')}%")

# Clean up
s.delete()

# Workspaces & RBAC
ws = client.create_workspace("team-ml")
env = client.create_environment(ws.id, "staging")

# Apps (long-running)
app = client.create_app(
    workspace_id=ws.id,
    env_id=env.id,
    name="my-api",
    image="nginx:latest",
    cpu=1,
    memory=2048,
)
client.deploy_app(app.id)

# Secrets (per workspace)
client.create_secret("OPENAI_KEY", "sk-xxx", workspace_id=ws.id)

# Volumes (persistent, S3-backed)
vol = client.create_volume("my-data", size_gb=50)
client.mount_volume(vol.id, s.id, "/data")

# Billing
balance = client.balance()
print(f"Credits: {balance}")
```

## Node.js SDK

```typescript
import { Client } from 'boxty';

// Auto-loads ~/.boxty/config.json
const client = new Client();

// Or explicit
const client = new Client({ apiKey: 'boxty_xxx' });

// Sandbox
const s = await client.createSandbox({
  image: 'python:3.11',
  cpu: 2,
  memory: 4096,
});
await s.exec('echo hello');
await client.deleteSandbox(s.id);

// Workspace
const ws = await client.createWorkspace('team-ml');

// Volume
const vol = await client.createVolume('data', 50);

// Balance
const balance = await client.balance();
```

## CLI Commands

```bash
boxty login <api_key>       # Save API key to ~/.boxty/config.json
boxty whoami                # Show user info, balance, workspaces

boxty run <file>            # Run script in sandbox
boxty deploy <file>         # Deploy as app
boxty shell                 # Interactive sandbox shell
boxty exec <id> <cmd>       # Execute command in sandbox
boxty ls                    # List sandboxes
boxty logs <id>             # Tail sandbox logs
boxty stop <id>             # Stop sandbox
boxty forward <id> <port>   # Port forward to sandbox

boxty image:build <file>    # Build image
boxty image:ls              # List images
boxty image:rm <id>         # Delete image

boxty secret:create <name>  # Create secret
boxty secret:ls             # List secrets
boxty secret:rm <name>      # Delete secret

boxty workspace:create <n>  # Create workspace
boxty workspace:ls          # List workspaces
boxty workspace:rm <id>     # Delete workspace

boxty billing               # Show billing history
```

## Production Deployment

### AWS (Terraform)

```bash
cd infra/terraform/aws
terraform init
terraform apply
```

Creează: DynamoDB, S3 buckets, ECR repository, IAM roles, ECR lifecycle policy.

Workers: Auto-provisioned via EC2 Spot când utilizatorul creează primul sandbox. Nu e nevoie de Terraform apply pentru workers.
