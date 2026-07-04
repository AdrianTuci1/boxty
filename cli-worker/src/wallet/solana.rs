use serde_json::json;

const SOLANA_RPC_URL: &str = "https://api.mainnet-beta.solana.com";
const USDC_MINT_ADDRESS: &str = "EPjFW3645yG2D9EPeVw5x713Y4LzLkOPL59837Uy7g";

/// Query the native SOL balance for a given address (returns SOL as f64).
#[allow(dead_code)]
pub async fn get_sol_balance(address: &str) -> Result<f64, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let response = client
        .post(SOLANA_RPC_URL)
        .json(&json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getBalance",
            "params": [address]
        }))
        .send()
        .await?;

    let json_resp: serde_json::Value = response.json().await?;
    if let Some(lamports) = json_resp["result"]["value"].as_f64() {
        // 1 SOL = 10^9 Lamports
        Ok(lamports / 1_000_000_000.0)
    } else {
        Err("Failed to parse SOL balance from RPC response".into())
    }
}

/// Query the USDC (SPL Token) balance for a given address (returns USDC as f64).
/// This queries the Token Accounts owned by the address and filters for the USDC mint.
#[allow(dead_code)]
pub async fn get_usdc_balance(address: &str) -> Result<f64, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let response = client
        .post(SOLANA_RPC_URL)
        .json(&json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTokenAccountsByOwner",
            "params": [
                address,
                {
                    "mint": USDC_MINT_ADDRESS
                },
                {
                    "encoding": "jsonParsed"
                }
            ]
        }))
        .send()
        .await?;

    let json_resp: serde_json::Value = response.json().await?;
    let mut total_usdc = 0.0;

    if let Some(accounts) = json_resp["result"]["value"].as_array() {
        for acc in accounts {
            if let Some(amount_str) =
                acc["account"]["data"]["parsed"]["info"]["tokenAmount"]["uiAmountString"].as_str()
            {
                if let Ok(amount) = amount_str.parse::<f64>() {
                    total_usdc += amount;
                }
            }
        }
    }
    Ok(total_usdc)
}

/// Query total credit balance (USDC + converted SOL at current rate).
#[allow(dead_code)]
pub async fn get_total_balance_in_usd(address: &str) -> Result<f64, Box<dyn std::error::Error>> {
    let usdc = get_usdc_balance(address).await.unwrap_or(0.0);
    let sol = get_sol_balance(address).await.unwrap_or(0.0);

    // Exchange rate: 1 SOL = $150 USD (mock rate for demonstration)
    let sol_in_usd = sol * 150.0;
    Ok(usdc + sol_in_usd)
}
