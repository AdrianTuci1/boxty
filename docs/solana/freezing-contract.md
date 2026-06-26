# Solana Contract Freezing Guide

## Overview

The Boxty escrow contract on Solana can be **frozen** to permanently lock:
- Fee percentage (platform cut from transactions)
- Treasury address (where fees are sent)
- Program authority (no further modifications)

After freezing, the contract is immutable and trustless.

## Prerequisites

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Set network
solana config set --url https://api.mainnet-beta.solana.com

# Verify wallet
solana-keygen pubkey
```

## Step 1: Deploy the Program

```bash
# Build the program
cd cli/sdk/contracts
anchor build

# Deploy to Solana
solana program deploy target/deploy/agentnet_escrow.so

# Save the Program ID
export PROGRAM_ID=$(solana address -k target/deploy/agentnet_escrow-keypair.json)
echo "Program ID: $PROGRAM_ID"
```

## Step 2: Initialize Escrow

```bash
# Create escrow account
boxty wallet init-escrow \
  --program-id $PROGRAM_ID \
  --treasury <TREASURY_WALLET_ADDRESS> \
  --fee-bps 50

# Verify
solana account <ESCROW_ACCOUNT_ADDRESS>
```

Parameters:
- `--treasury`: Wallet address that receives platform fees
- `--fee-bps`: Fee in basis points (50 = 0.5%, 100 = 1%, 1000 = 10%)
- Maximum fee: 1000 bps (10%)

## Step 3: Freeze the Contract

```bash
# Freeze permanently - THIS CANNOT BE UNDONE
boxty wallet freeze-contract \
  --program-id $PROGRAM_ID \
  --escrow <ESCROW_ACCOUNT_ADDRESS>

# Confirm
solana account <ESCROW_ACCOUNT_ADDRESS> --output json
```

After freezing:
- ✅ Fee percentage locked
- ✅ Treasury address locked
- ✅ No admin can modify
- ✅ No upgrade possible
- ✅ Trustless operation

## Verification

### Check Contract State

```bash
# Read escrow account data
solana account <ESCROW_ACCOUNT_ADDRESS> --output json

# Look for:
# - is_frozen: true
# - treasury: <TREASURY_ADDRESS>
# - fee_bps: 50
```

### Verify on Explorer

1. Open [Solana Explorer](https://explorer.solana.com)
2. Search for your Program ID
3. Check "Account Info" tab
4. Verify `is_frozen: true`

## Fee Calculation

| Transaction Amount | Fee (0.5%) | Treasury Receives |
|-------------------|-----------|-------------------|
| 100 USDC | 0.50 USDC | 99.50 USDC |
| 1,000 USDC | 5.00 USDC | 995.00 USDC |
| 10,000 USDC | 50.00 USDC | 9,950.00 USDC |

## Environment Variables

After freezing, set these in your `.env`:

```bash
SOLANA_PROGRAM_ID=<PROGRAM_ID>
SOLANA_ESCROW_ACCOUNT=<ESCROW_ACCOUNT>
SOLANA_TREASURY_ADDRESS=<TREASURY_WALLET>
PLATFORM_FEE_BPS=50
FROZEN_CONTRACT_PROGRAM_ID=<PROGRAM_ID>
FROZEN_ESCROW_ACCOUNT=<ESCROW_ACCOUNT>
FROZEN_TREASURY_ADDRESS=<TREASURY_WALLET>
FROZEN_FEE_BPS=50
```

## CI/CD Integration

The frozen contract details are used in:
- `publish-release.yml` (for CLI builds)
- `deploy-workers.yml` (for worker nodes)
- `boxty-worker.service.j2` (injected as env vars)

## Security Considerations

1. **Treasury Wallet**: Use a secure multi-sig or hardware wallet
2. **Fee Percentage**: Set once, never changeable
3. **Program ID**: Verify on-chain before trusting
4. **Backup**: Save program keypair and escrow derivation path

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Contract not frozen" | Re-run freeze command, verify authority |
| "Fee mismatch" | Check `fee_bps` in account data |
| "Treasury wrong" | Cannot change after freeze - redeploy required |
| "Insufficient funds" | Ensure treasury wallet has SOL for rent |

## Redeploy (Emergency Only)

If critical bug found after freeze:
1. Deploy new program version
2. Update all clients
3. Migrate liquidity manually
4. Old contract remains frozen forever
