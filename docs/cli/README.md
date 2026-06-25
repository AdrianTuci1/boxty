# CLI Reference

## Commands

### Core Commands

| Command | Description |
|---------|-------------|
| `boxty function` | Execute a serverless function |
| `boxty run` | Alias for function |
| `boxty sandbox` | Start interactive sandbox |
| `boxty shell` | Alias for sandbox |
| `boxty deploy` | Deploy containerized workload |
| `boxty attach` | Attach to running sandbox |

### Resource Management

| Command | Description |
|---------|-------------|
| `boxty secret` | Manage secrets |
| `boxty volume` | Manage persistent volumes |
| `boxty database` | Manage databases |
| `boxty app` | Manage active applications |

### Node Operations

| Command | Description |
|---------|-------------|
| `boxty provider` | Share compute as provider |
| `boxty gateway` | Start local HTTP gateway |
| `boxty wallet` | Manage wallet |

### Utility

| Command | Description |
|---------|-------------|
| `boxty init` | Scaffold new app |
| `boxty tiers` | List compute tiers |
| `boxty update` | Update CLI to latest |
| `boxty version` | Show version info |

## Global Flags

| Flag | Description |
|------|-------------|
| `--signaling` | P2P signaling server address |
| `--bypass-escrow` | Bypass payment validation |

## Examples

### Execute Function

```bash
boxty function --wasm app.wasm --secret OPENAI_API_KEY --volume my-vol:/data
```

### Deploy with Scale-to-Zero

```bash
boxty deploy --image python:3.10-slim --serve 8000 --idle-timeout 300
```

### Start Provider

```bash
boxty provider --tier pro --disk 100 --instances 4
```
