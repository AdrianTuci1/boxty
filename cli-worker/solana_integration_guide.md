# Boxty Solana Integration Guide

This guide details how Boxty's built-in wallets integrate with the **Solana Blockchain (Mainnet-Beta / Devnet)**, how to fund/activate accounts, and how to transition from the **Mock Faucet (Starter Credits)** to a **Live Solana Production Escrow**.

---

## 1. How Solana Wallets Work (No Registration Required)

On Solana, there is **no on-chain registration process** for new addresses. 
- Every valid Ed25519 keypair is mathematically a valid Solana account.
- The public key encoded in **Base58** (e.g. `HzXm9JPMvFNK1eQywg97tkC9vDc9jkfRwjndYDVG1g4b`) is your Solana Wallet Address.
- The account is activated automatically the first time it receives a transaction (e.g., funding it with a small amount of SOL or USDC).

You can search your Boxty Wallet Address on any block explorer:
👉 **[Solana Explorer](https://explorer.solana.com/)**

---

## 2. Importing your Boxty Wallet to Phantom or Solflare

The local wallet is saved at `~/.boxty/wallet.json`.

We have left a utility script **`check_solana.py`** in the project directory that extracts your private key and formats it in the two formats recognized by Solana tooling:
1. **Base58 Private Key String**: Used to import accounts directly into browser wallets (e.g. Phantom, Solflare).
2. **JSON Integer Array File**: Used by the official Solana CLI tool (`id.json`).

### Running the Utility Script:
Run the script to see your keys and query live Solana balances:
```bash
python3 check_solana.py
```

---

## 3. Disabling the Faucet & Going Live with Solana (Production)

During the demo/development phase, the CLI uses a **mock faucet** which initializes the wallet file with `5.00 USDC` and checks its signature using `verify_voucher()` in Rust.

To completely delete the faucet and make the wallet work directly with on-chain Solana balances:

### Step A: Update the Balance Check to Query the Blockchain
Modify the wallet balance getter in `src/wallet/mod.rs` to query live Solana RPC instead of the local mock variable:

```rust
// In src/wallet/mod.rs
pub async fn get_live_balance(&self) -> Result<f64, Box<dyn std::error::Error>> {
    // Queries USDC + SOL balance converted at the current exchange rate
    solana::get_total_balance_in_usd(&self.address).await
}
```

### Step B: Remove Faucet Initialization
In `src/wallet/mod.rs` inside the `load_or_create()` function, set the default offline balance to `0.00` and stop generating the founder's offline mock vouchers:

```rust
// Remove the founder's seed signature generation and change:
let state = WalletState {
    secret_key_hex,
    address: address.clone(),
    balance: 0.00,                 // Production starts at 0.00 USDC
    voucher_signature_hex: "".to_string(),
};
```

Once this is updated, any command like `boxty wallet status` or a provider checking a client's ticket balance will query the Solana RPC. If the client transfers actual SOL or USDC to their address on-chain, it will instantly show up as active credits on their balance.
