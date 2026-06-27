# Boxly CLI: Command Reference

This document details all available commands in the `boxly` Command Line Interface (CLI). 

The binary acts dually, both as a **Client** (submitting tasks to the network) and as a **Provider** (donating/selling computational resources).

## General Syntax
```bash
boxly <SUBCOMMAND> [OPTIONS]
```

---

## CLI Command List

Below are all available commands, listed sequentially for clear visibility:

- `boxly function --wasm <PATH> [--replication <NUMBER>]`
  Runs a pure serverless task on the P2P network (Wasm sandbox). The function is deployed to the network, executed, returns the result (e.g., API response/data processing), and then the container immediately shuts down completely. (Default replication is set to 3 nodes for Raft consensus).

- `boxly sandbox --image <IMAGE> [--timeout <SECONDS>]`
  Starts an interactive sandbox (a persisted container with a timeout). You can enter the shell, test things, and the instance self-destructs only if it reaches the idle timeout (default 300 seconds).

- `boxly attach <TASK_ID>`
  Reconnects to the interactive terminal of an already running `sandbox`.

- `boxly deploy --image <IMAGE> [--install <DEP_COMMAND>] [--serve <PORT>] [--idle-timeout <SECONDS>]`
  Transforms an image into a persisted service / endpoint on the network (e.g., a web application or a full API). Natively supports "Scale-to-Zero": if it receives no requests for the duration of `--idle-timeout` (default 300 seconds), the instance suspends and stops billing the user until the next wake-up (cold start).

- `boxly tiers`
  Displays a list of all available resource options and pricing plans (nano, micro, standard, pro, max).

- `boxly provider [--tier <NAME>] [--disk <GB>]`
  Starts the node as a provider (Worker), punching through NAT and accepting jobs from the P2P network. You can specify the provided resource tier (e.g., nano, micro, standard, pro, max) and allocated storage (dynamic, min 10GB, max 100GB).

- `boxly wallet new`
  Generates a new Ed25519 cryptographic identity keypair / wallet.

- `boxly wallet status`
  Display current wallet address (PeerID) and balance.

- `boxly wallet export`
  Export the private key hex to connect to the Web Console.

---
*For an exhaustive list and specific help per command, use the `--help` option (e.g., `boxly function --help`).*
