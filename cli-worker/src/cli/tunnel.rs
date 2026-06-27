use base64::{Engine as _, engine::general_purpose};
use futures::{SinkExt, StreamExt};
use serde_json::{json, Value};
use tokio::sync::mpsc;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};

pub async fn run_tunnel_loop(_control_plane_url: String) {
    let retry_delay = std::time::Duration::from_secs(5);
    loop {
        let state = crate::state::read_json::<Option<crate::state::ProviderState>>(
            &crate::state::provider_path(),
            None,
        );

        if let Some(ref state) = state {
            if !state.provider_id.is_empty() && !state.provider_auth_token.is_empty() {
                run_tunnel(&state.control_plane_url, &state.provider_id, &state.provider_auth_token).await;
            }
        }

        tokio::time::sleep(retry_delay).await;
    }
}

pub async fn run_tunnel(
    control_plane_url: &str,
    provider_id: &str,
    provider_token: &str,
) {
    let ws_url = control_plane_url
        .trim_end_matches('/')
        .replace("http://", "ws://")
        .replace("https://", "wss://");
    let url = format!(
        "{}/v1/providers/{}/tunnel?token={}",
        ws_url, provider_id, provider_token
    );

    let ws_stream = match connect_async(&url).await {
        Ok((ws, _)) => ws,
        Err(e) => {
            eprintln!("[tunnel] connect failed: {e}");
            return;
        }
    };

    let (mut write, mut read) = ws_stream.split();
    let (tx, mut rx) = mpsc::unbounded_channel::<String>();

    // Spawn writer task
    tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if write.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    println!("[tunnel] connected to control plane");

    while let Some(msg) = read.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                let tx = tx.clone();
                tokio::spawn(async move {
                    if let Some(response) = handle_request(&text).await {
                        let _ = tx.send(response);
                    }
                });
            }
            Ok(Message::Close(_)) => {
                println!("[tunnel] server closed connection");
                break;
            }
            Err(e) => {
                eprintln!("[tunnel] read error: {e}");
                break;
            }
            _ => {}
        }
    }
}

async fn handle_request(text: &str) -> Option<String> {
    let request: Value = serde_json::from_str(text).ok()?;
    if request.get("type").and_then(|v| v.as_str()) != Some("request") {
        return None;
    }

    let request_id = request
        .get("request_id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let endpoint_name = request
        .get("endpoint_name")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let method = request
        .get("method")
        .and_then(|v| v.as_str())
        .unwrap_or("GET");
    let path = request
        .get("path")
        .and_then(|v| v.as_str())
        .unwrap_or("/");
    let headers = request
        .get("headers")
        .and_then(|v| v.as_object())
        .cloned()
        .unwrap_or_default();
    let body = request
        .get("body")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    let response = forward_request(endpoint_name, method, path, &headers, body).await;

    Some(
        json!({
            "type": "response",
            "request_id": request_id,
            "status": response.status,
            "headers": response.headers,
            "body": response.body,
        })
        .to_string(),
    )
}

struct ProxyResponse {
    status: u16,
    headers: serde_json::Map<String, Value>,
    body: String,
}

async fn forward_request(
    endpoint_name: &str,
    method: &str,
    path: &str,
    headers: &serde_json::Map<String, Value>,
    body: &str,
) -> ProxyResponse {
    let state = crate::state::read_json::<Option<crate::state::ProviderState>>(
        &crate::state::provider_path(),
        None,
    );

    let host_port = if let Some(ref state) = state {
        state
            .jobs
            .iter()
            .find(|job| {
                job.endpoint_name == endpoint_name
                    && job.status == "running"
                    && job.host_port > 0
            })
            .map(|job| job.host_port)
    } else {
        None
    };

    let Some(port) = host_port else {
        return ProxyResponse {
            status: 503,
            headers: serde_json::Map::new(),
            body: general_purpose::STANDARD.encode("endpoint not running on this worker"),
        };
    };

    let client = reqwest::Client::new();
    let url = format!("http://127.0.0.1:{}{}", port, path);
    let mut builder = match method {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "DELETE" => client.delete(&url),
        "PATCH" => client.patch(&url),
        "HEAD" => client.head(&url),
        "OPTIONS" => client.request(reqwest::Method::OPTIONS, &url),
        _ => client.get(&url),
    };

    for (key, value) in headers.iter() {
        if key.to_lowercase() != "host" {
            if let Some(val_str) = value.as_str() {
                builder = builder.header(key, val_str);
            }
        }
    }

    if !body.is_empty() {
        if let Ok(decoded) = general_purpose::STANDARD.decode(body) {
            builder = builder.body(decoded);
        }
    }

    match builder.send().await {
        Ok(resp) => {
            let status = resp.status().as_u16();
            let mut response_headers = serde_json::Map::new();
            for (key, value) in resp.headers().iter() {
                if let Ok(val_str) = value.to_str() {
                    response_headers.insert(key.to_string(), json!(val_str));
                }
            }
            let body_bytes = match resp.bytes().await {
                Ok(bytes) => bytes.to_vec(),
                Err(_) => Vec::new(),
            };
            ProxyResponse {
                status,
                headers: response_headers,
                body: general_purpose::STANDARD.encode(&body_bytes),
            }
        }
        Err(e) => ProxyResponse {
            status: 502,
            headers: serde_json::Map::new(),
            body: general_purpose::STANDARD.encode(format!("proxy error: {}", e)),
        },
    }
}
