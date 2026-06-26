# Getting Started with Boxty

## Install CLI

### Quick Install (Recommended)

```bash
curl -fsSL https://cli.boxty.dev/install | sh
```

### Manual Download

Visit [https://cli.boxty.dev](https://cli.boxty.dev) to download binaries for your platform.

Supported platforms:
- Linux (x64, arm64)
- macOS (Intel, Apple Silicon)
- Windows (x64)

### Verify Installation

```bash
boxty --version
```

## First Steps

### 1. Create a Wallet

```bash
boxty wallet new
```

### 2. List Compute Tiers

```bash
boxty tiers
```

### 3. Deploy Your First Function

```bash
boxty init --lang py my-app
cd my-app
boxty function --wasm app.wasm
```

## Update CLI

```bash
boxty update
```

Or force update:

```bash
boxty update --force
```

## Next Steps

- [CLI Reference](cli/README.md)
- [Deploy Workers](workers/quickstart.md)
- [Python SDK](sdk/python.md)
- [JavaScript SDK](sdk/javascript.md)
