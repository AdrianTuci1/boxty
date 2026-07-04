# AgentNet: Decentralized P2P Compute Network Architecture

AgentNet is a fully decentralized, peer-to-peer (P2P) computing marketplace built on top of Solana (for trustless payments and economic incentives) and libp2p/Kademlia DHT (for peer routing and discovery). It enables anyone to share their idle CPU/RAM resources to run sandboxed AI agents or microservices, competing directly with centralized platforms like E2B or Modal, but with zero central points of failure.

---

## 1. Architectural Overview

```mermaid
graph TD
    subgraph Client (Consumer)
        C_CLI[AgentNet CLI / SDK] -->|1. Submit Task & Deposit SPL| SC[Solana Smart Contract]
        C_CLI -->|2. Broadcast Task Proposal| DHT[Kademlia DHT / libp2p]
    end

    subgraph P2P Network (DHT)
        DHT <--> NodeA[Host Node A]
        DHT <--> NodeB[Host Node B]
    end

    subgraph Host Node (Provider)
        NodeA -->|3. Accept & Verify Challenge| VM[Wasmtime Sandbox]
        VM -->|4. Generate Deterministic State Proof| NodeA
        NodeA -->|5. Submit State Proof & Request Release| SC
    end

    SC -->|6. Release Rewards| NodeA
```

### Core Components
1. **P2P Communication Layer (`libp2p`):** Handles peer discovery, NAT traversal (STUN/TURN, Relay), and direct encrypted communication between consumer nodes and host nodes.
2. **Distributed Routing Layer (Kademlia DHT):** A decentralized database where host nodes advertise their available resources (CPU, RAM, GPU, cost-per-second) and consumer nodes find suitable providers.
3. **Execution & Isolation Layer (`Wasmtime`):** Executes guest workloads in a secure WebAssembly (Wasm) sandbox, ensuring maximum security for the host with near-instant start times (<1ms).
4. **Economic & Escrow Layer (Solana Smart Contract):** Handles deposits, job matches, SLA commitments, slashing, and payment releases without intermediaries.

---

## 2. Deep Dive: Layer-by-Layer Architectural Decisions

### A. The P2P Layer (libp2p & Kademlia DHT)
Instead of a central coordinator, we use **libp2p**—the gold standard for decentralized networking (used by IPFS, Ethereum 2.0, Filecoin).
* **Identity:** Each node generates a cryptographic key pair. The SHA-256 hash of the public key serves as the `PeerID` (e.g., `QmYwAPJviwYg21X9iJGgaXj8F`).
* **Routing:** We implement a **Kademlia DHT**. Host nodes publish provider records containing their IP/Port, resource availability, and pricing. Client nodes query the DHT for keys matching their compute requirements (e.g., searching for `provider:wasm:cpu-2:ram-4`).
* **Protocol Negotiation:** The network uses custom protocol streams:
  * `/agentnet/task-proposal/1.0.0` - Client proposes a job.
  * `/agentnet/task-execution/1.0.0` - Bidirectionally streams input/output and logs between Client and Host.
  * `/agentnet/heartbeat/1.0.0` - Keeps connections alive and tracks active workloads.

### B. The Compute Layer (Wasmtime Sandboxing)
Running arbitrary AI agent code on a stranger's computer requires absolute security.
* **Why Wasmtime instead of Firecracker/gVisor?**
  * **Zero Virtualization Dependency:** Firecracker requires KVM (hardware-assisted virtualization), which is unavailable on most consumer VPS, home computers, or macOS. Wasmtime runs on standard CPU user space across Windows, macOS, and Linux.
  * **Startup Speed:** Wasmtime instantiates sandboxes in **microseconds** (~10-100µs), beating gVisor (~50ms) and Firecracker (~100ms).
  * **Deterministic Execution:** Essential for verifying that a host ran the actual task and did not fabricate the result.
  * **Resource Limits:** Wasmtime provides built-in mechanisms to limit memory pages and count execution instructions (fuel limits), preventing infinite loops.

### C. The Economic Layer (Solana Smart Contract)
Solana is chosen for its high throughput, low fees, and fast block times (~400ms), which are necessary for micro-transaction billing on compute-per-second.

1. **Job Posting & Escrow:**
   * A client deposits `X` amount of tokens into a Solana escrow contract, defining the `Task Hash`, `Timeout`, and `Max Cost`.
2. **Optimistic Execution & Proof of Compute:**
   * Since verifying every task on-chain is too expensive, we use an **Optimistic Verification with Fraud Proofs** or **Consensus Replication**:
     * **Consensus (Majority Vote):** For stateless, quick tasks, the client assigns the task to 3 random nodes. If 2 or more return the same cryptographic hash of the output, the state transition is considered valid.
     * **Optimistic / Challenge Period:** The host node posts the result hash and a commitment of the state change. There is a challenge window (e.g., 50 blocks). Anyone can verify the execution deterministically in their own Wasm runtime and submit a "fraud proof" on-chain if the output is incorrect. If fraud is proven, the host's stake is slashed.
3. **Payout:**
   * Once execution is verified (either by consensus or challenge expiration), the smart contract releases the funds from escrow to the host node's Solana address.

---

## 3. CLI Console Specification
The Node CLI will act as a control center. It will render an interactive terminal user interface (TUI) showing:
* **Node Telemetry:** CPU load, RAM allocation, network status, Peer ID.
* **Economic Ledger:** Connected Solana wallet, current balance, daily earnings.
* **Sandbox Monitor:** Active Wasm execution task ID, runtime details, CPU/RAM usage.
* **Kademlia Console:** Live event logger tracking DHT joins, peers, incoming tasks, and Solana state updates.

---

## 4. File Structure (Proposed)
```text
agentnet/
├── README.md
├── docs/
│   └── architecture.md         <-- (This Document)
├── contracts/                  <-- Solana Smart Contract (Anchor/Rust)
│   ├── Anchor.toml
│   └── programs/
│       └── agentnet-escrow/
│           └── src/lib.rs
├── node/                       <-- P2P Node & Execution Engine (Go/Rust)
│   ├── main.go
│   ├── p2p/                    <-- libp2p & Kademlia DHT
│   ├── sandbox/                <-- Wasmtime Integration
│   └── solana/                 <-- Solana Client SDK Interaction
└── cli/                        <-- Console Interface (tview/bubbletea)
    └── dashboard.go
```
