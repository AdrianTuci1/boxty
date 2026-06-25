#!/usr/bin/env python3
import os
import json
import binascii
import urllib.request
from pathlib import Path

# Base58 Alphabet
ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

def base58_encode(b: bytes) -> str:
    n = int.from_bytes(b, "big")
    res = []
    while n > 0:
        n, r = divmod(n, 58)
        res.append(ALPHABET[r])
    # Add leading ones for leading zero bytes
    pad = 0
    for byte in b:
        if byte == 0:
            pad += 1
        else:
            break
    return "1" * pad + "".join(reversed(res))

def base58_decode(s: str) -> bytes:
    n = 0
    for char in s:
        n = n * 58 + ALPHABET.index(char)
    res = bytearray()
    while n > 0:
        n, r = divmod(n, 256)
        res.append(r)
    res = res[::-1]
    pad = 0
    for char in s:
        if char == "1":
            pad += 1
        else:
            break
    return bytes([0] * pad + list(res))

def query_solana_rpc(method: str, params: list) -> dict:
    url = "https://api.mainnet-beta.solana.com"
    headers = {"Content-Type": "application/json"}
    data = json.dumps({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    }).encode("utf-8")
    
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"Error querying Solana RPC: {e}")
        return {}

def main():
    wallet_path = Path.home() / ".boxty" / "wallet.json"
    if not wallet_path.exists():
        print(f"Error: Wallet file not found at {wallet_path}")
        print("Please run the CLI first to generate a wallet: `./target/release/boxty wallet status`")
        return

    with open(wallet_path, "r") as f:
        wallet_data = json.load(f)

    secret_key_hex = wallet_data.get("secret_key_hex")
    address = wallet_data.get("address")
    faucet_balance = wallet_data.get("balance")

    print("=" * 60)
    print("           BOXTY SOLANA WALLET INTEGRATION UTILITY")
    print("=" * 60)
    print(f"Local Wallet Path : {wallet_path}")
    print(f"Solana Address    : {address}")
    print(f"Mock Faucet Bal   : {faucet_balance:.2f} USDC")
    print("-" * 60)

    # 1. Deriving standard Solana private key formats
    try:
        # Decode the public key bytes from the Base58 address
        pubkey_bytes = base58_decode(address)
        # Decode the secret key seed bytes from hex
        seed_bytes = binascii.unhexlify(secret_key_hex)
        
        # Solana private keys are 64 bytes: [32-byte seed] + [32-byte public key]
        solana_private_key_bytes = seed_bytes + pubkey_bytes
        
        # Format A: Phantom / Solflare Importable Private Key (Base58)
        phantom_private_key = base58_encode(solana_private_key_bytes)
        
        # Format B: Solana CLI keypair file (Array of 64 integers)
        solana_cli_keypair = list(solana_private_key_bytes)
        
        print("\n[Solana Key Formats]")
        print("1. Phantom / Solflare Importable Private Key (Base58 String):")
        print(f"   👉 {phantom_private_key}")
        print("\n2. Solana CLI Keypair File Format (save as id.json):")
        print(f"   👉 {json.dumps(solana_cli_keypair)}")
    except Exception as e:
        print(f"Error deriving key formats: {e}")
        return

    # 2. Querying live Solana mainnet balances
    print("\n[Querying live Solana Mainnet-Beta Blockchain...]")
    
    # Check SOL Balance
    sol_response = query_solana_rpc("getBalance", [address])
    sol_balance = 0.0
    if "result" in sol_response and "value" in sol_response["result"]:
        lamports = sol_response["result"]["value"]
        sol_balance = lamports / 1_000_000_000.0
        print(f"   - SOL Balance  : {sol_balance:.6f} SOL")
    else:
        print("   - SOL Balance  : Error querying RPC")

    # Check USDC Balance (USDC Mint on Mainnet)
    usdc_mint = "EPjFW3645yG2D9EPeVw5x713Y4LzLkOPL59837Uy7g"
    usdc_response = query_solana_rpc("getTokenAccountsByOwner", [
        address,
        {"mint": usdc_mint},
        {"encoding": "jsonParsed"}
    ])
    
    usdc_balance = 0.0
    if "result" in usdc_response and "value" in usdc_response["result"]:
        accounts = usdc_response["result"]["value"]
        for acc in accounts:
            try:
                amount_str = acc["account"]["data"]["parsed"]["info"]["tokenAmount"]["uiAmountString"]
                usdc_balance += float(amount_str)
            except (KeyError, ValueError, TypeError):
                continue
        print(f"   - USDC Balance : {usdc_balance:.2f} USDC")
    else:
        print("   - USDC Balance : Error querying RPC (or no USDC account exists yet)")

    # 3. Transition Strategy
    print("\n" + "=" * 60)
    print("                    TRANSITION TO PRODUCTION")
    print("=" * 60)
    print("1. Your address is a standard Ed25519 keypair. It is automatically")
    print("   compatible with the Solana blockchain. No registration is needed.")
    print("2. To activate/use it on Solana, transfer some SOL or USDC to the address.")
    print("3. To transition from Demo (Mock Faucet) to Production (Live Solana):")
    print("   - Delete the local faucet verification logic (`verify_voucher`) in `wallet/mod.rs`.")
    print("   - Modify `get_balance()` to fetch the live balance on-chain using the RPC function:")
    print("     `solana::get_total_balance_in_usd(&self.address)`")
    print("   - The mock credits (5.00 USDC) will be replaced by actual on-chain balances.")
    print("=" * 60)

if __name__ == "__main__":
    main()
