# CLI Worker (boxty-worker) ↔ Control Plane Integration Checklist

## Sursa: cli-worker/src/cli/worker.rs, cli-worker/src/cli/provider.rs, cli-worker/src/cli/client.rs

## 1. WORKER LIFECYCLE
- [x] Worker: load config from JSON file
- [x] Worker: detect system resources (CPU, RAM, disk)
- [x] Worker: register provider with control plane
- [x] Worker: heartbeat loop (available_slots, running_jobs, status)
- [x] Worker: claim next assignment from control plane
- [x] Worker: launch assignment (Docker/container execution)
- [x] Worker: reconcile jobs (check status, cleanup)
- [x] Worker: graceful shutdown (SIGTERM/SIGINT handling)
- [x] Worker: unregister provider on shutdown
- [x] Worker: retry logic with max_retries
- [x] Worker: state persistence (provider.json)
- [x] Worker: tunnel loop for P2P connectivity
- [x] Worker: auto-start gateway

## 2. PROVIDER MANAGEMENT
- [x] Provider: detect system resources
- [x] Provider: register with control plane
- [x] Provider: heartbeat
- [x] Provider: claim assignments
- [x] Provider: launch workloads
- [x] Provider: status reporting (online, draining, error)
- [x] Provider: tier selection (nano, micro, standard, pro, max)
- [x] Provider: resource limits (max_memory_mb, max_cpu_cores)
- [x] Provider: concurrency control
- [x] Provider: pool assignment

## 3. WORKLOAD EXECUTION
- [x] Workload: launch from assignment
- [x] Workload: Docker container execution
- [x] Workload: volume mounts
- [x] Workload: secret injection
- [x] Workload: environment variables
- [x] Workload: resource limits (CPU, memory, disk)
- [x] Workload: status updates (pending, running, completed, failed)
- [x] Workload: metrics reporting (cpu_seconds, ram_gb_seconds, etc.)
- [x] Workload: log collection
- [x] Workload: sandbox session support
- [x] Workload: image builds
- [x] Workload: endpoint serving

## 4. SANDBOX MANAGEMENT
- [x] Sandbox: create session
- [x] Sandbox: verify session token
- [x] Sandbox: attach to running session
- [x] Sandbox: SSH mode support
- [x] Sandbox: idle timeout
- [x] Sandbox: volume mounts
- [x] Sandbox: secret injection

## 5. GATEWAY
- [x] Gateway: HTTP proxy for P2P apps
- [x] Gateway: local port binding (default 8080)
- [x] Gateway: task routing
- [x] Gateway: auto-start with worker

## 6. TUNNEL
- [x] Tunnel: P2P tunnel loop
- [x] Tunnel: control plane connectivity

## 7. WALLET
- [x] Wallet: generate new Ed25519 identity
- [x] Wallet: status check
- [x] Wallet: export private key
- [x] Wallet: Solana escrow integration
- [x] Wallet: payment state channels

## 8. RESOURCES
- [x] Resources: secret management (list, save, delete)
- [x] Resources: volume management (list, create, delete)
- [x] Resources: database management (list, create, delete, query)
- [x] Resources: volume data directory
- [x] Resources: secret env var resolution

## 9. P2P NETWORKING
- [x] P2P: libp2p integration
- [x] P2P: signaling server connection
- [x] P2P: peer discovery
- [x] P2P: task replication (consensus)
- [x] P2P: micro-cluster sync
- [x] P2P: state sync manager

## 10. CLI COMMANDS (boxty-worker binary)
- [x] Command: `boxty-worker function` (execute serverless function)
- [x] Command: `boxty-worker run` (alias for function)
- [x] Command: `boxty-worker sandbox` (interactive sandbox)
- [x] Command: `boxty-worker shell` (alias for sandbox)
- [x] Command: `boxty-worker deploy` (deploy containerized workload)
- [x] Command: `boxty-worker attach` (attach to running task)
- [x] Command: `boxty-worker app` (manage active applications)
- [x] Command: `boxty-worker provider` (start sharing compute resources)
- [x] Command: `boxty-worker worker` (run worker agent against control plane)
- [x] Command: `boxty-worker wallet` (manage wallet)
- [x] Command: `boxty-worker gateway` (start HTTP gateway)
- [x] Command: `boxty-worker secret` (manage secrets)
- [x] Command: `boxty-worker volume` (manage volumes)
- [x] Command: `boxty-worker database` (manage databases)
- [x] Command: `boxty-worker init` (scaffold new app)
- [x] Command: `boxty-worker update` (update CLI)
- [x] Command: `boxty-worker version` (show version)
- [x] Command: `boxty-worker tiers` (list compute tiers)

## 11. DEPRECATED COMMANDS (moved to boxty CLI Python)
- [x] Command: `boxty-worker login` (DEPRECATED)
- [x] Command: `boxty-worker logout` (DEPRECATED)
- [x] Command: `boxty-worker whoami` (DEPRECATED)
- [x] Command: `boxty-worker workspace` (DEPRECATED)
- [x] Command: `boxty-worker env` (DEPRECATED)
- [x] Command: `boxty-worker appctl` (DEPRECATED)
- [x] Command: `boxty-worker route` (DEPRECATED)
- [x] Command: `boxty-worker schedule` (DEPRECATED)
- [x] Command: `boxty-worker image` (DEPRECATED)
- [x] Command: `boxty-worker billing` (DEPRECATED)
- [x] Command: `boxty-worker status` (DEPRECATED)

## 12. CONFIGURATION
- [x] Config: JSON config file support
- [x] Config: node ID and region
- [x] Config: control plane URL
- [x] Config: provider pool
- [x] Config: worker concurrency
- [x] Config: heartbeat interval
- [x] Config: task timeout
- [x] Config: sandbox SSH mode
- [x] Config: resource limits (max_memory_mb, max_cpu_cores)
- [x] Config: backend settings (RunPod)
- [x] Config: retry interval and max retries

## 13. ERROR HANDLING
- [x] Error: HTTP error handling
- [x] Error: retry with exponential backoff
- [x] Error: graceful degradation
- [x] Error: state recovery
- [x] Error: logging

## 14. MONITORING
- [x] Monitoring: TUI dashboard
- [x] Monitoring: resource usage tracking
- [x] Monitoring: workload metrics
- [x] Monitoring: provider status

## 15. CRITICAL PATH
- [x] Worker starts and loads config
- [x] Worker detects resources
- [x] Worker registers with control plane
- [x] Worker sends heartbeat
- [x] Worker claims assignments
- [x] Worker launches workloads
- [x] Worker reports metrics
- [x] Worker handles shutdown gracefully
