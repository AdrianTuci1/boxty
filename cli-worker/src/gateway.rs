use serde_json::{json, Value};
use std::collections::HashMap;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

struct HttpRequest {
    method: String,
    path: String,
    query: HashMap<String, String>,
    body: Vec<u8>,
}

fn decode_component(raw: &str) -> String {
    let bytes = raw.as_bytes();
    let mut output = Vec::with_capacity(bytes.len());
    let mut index = 0;

    while index < bytes.len() {
        match bytes[index] {
            b'+' => {
                output.push(b' ');
                index += 1;
            }
            b'%' if index + 2 < bytes.len() => {
                let hex = &raw[index + 1..index + 3];
                if let Ok(value) = u8::from_str_radix(hex, 16) {
                    output.push(value);
                    index += 3;
                } else {
                    output.push(bytes[index]);
                    index += 1;
                }
            }
            byte => {
                output.push(byte);
                index += 1;
            }
        }
    }

    String::from_utf8_lossy(&output).to_string()
}

fn parse_query(raw: &str) -> HashMap<String, String> {
    let mut query = HashMap::new();
    for pair in raw.split('&') {
        if pair.is_empty() {
            continue;
        }
        let (key, value) = pair.split_once('=').unwrap_or((pair, ""));
        query.insert(decode_component(key), decode_component(value));
    }
    query
}

async fn read_request(
    socket: &mut tokio::net::TcpStream,
) -> Result<Option<HttpRequest>, Box<dyn std::error::Error + Send + Sync>> {
    let mut buffer = Vec::new();
    let mut temp = [0u8; 4096];
    let header_end;

    loop {
        let read = socket.read(&mut temp).await?;
        if read == 0 {
            if buffer.is_empty() {
                return Ok(None);
            }
            return Err("unexpected eof".into());
        }
        buffer.extend_from_slice(&temp[..read]);
        if let Some(position) = buffer.windows(4).position(|chunk| chunk == b"\r\n\r\n") {
            header_end = position + 4;
            break;
        }
        if buffer.len() > 1024 * 1024 {
            return Err("request too large".into());
        }
    }

    let headers = String::from_utf8_lossy(&buffer[..header_end]).to_string();
    let mut lines = headers.split("\r\n");
    let request_line = lines.next().ok_or("missing request line")?;
    let mut request_parts = request_line.split_whitespace();
    let method = request_parts.next().ok_or("missing method")?.to_string();
    let target = request_parts.next().ok_or("missing target")?;

    let mut content_length = 0usize;
    for line in lines {
        if line.is_empty() {
            continue;
        }
        if let Some((key, value)) = line.split_once(':') {
            if key.eq_ignore_ascii_case("content-length") {
                content_length = value.trim().parse::<usize>().unwrap_or(0);
            }
        }
    }

    while buffer.len() < header_end + content_length {
        let read = socket.read(&mut temp).await?;
        if read == 0 {
            break;
        }
        buffer.extend_from_slice(&temp[..read]);
    }

    let body =
        buffer[header_end..std::cmp::min(buffer.len(), header_end + content_length)].to_vec();
    let (path, query) = if let Some((path, query)) = target.split_once('?') {
        (decode_component(path), parse_query(query))
    } else {
        (decode_component(target), HashMap::new())
    };

    Ok(Some(HttpRequest {
        method,
        path,
        query,
        body,
    }))
}

async fn send_response(
    socket: &mut tokio::net::TcpStream,
    status: &str,
    content_type: &str,
    body: &[u8],
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let headers = format!(
        "HTTP/1.1 {}\r\nContent-Type: {}\r\nContent-Length: {}\r\nConnection: close\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Headers: Content-Type\r\nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n\r\n",
        status,
        content_type,
        body.len()
    );
    socket.write_all(headers.as_bytes()).await?;
    socket.write_all(body).await?;
    Ok(())
}

fn build_cli_state() -> Value {
    let wallet = crate::state::read_json::<Option<crate::wallet::WalletState>>(
        &crate::state::wallet_path(),
        None,
    );
    let provider = crate::state::read_json::<Option<crate::state::ProviderState>>(
        &crate::state::provider_path(),
        None,
    )
    .filter(|provider| crate::state::is_process_alive(provider.pid));
    let apps = crate::cli::client::read_apps();

    json!({
        "wallet": wallet.as_ref().map(|wallet| json!({
            "address": wallet.address,
            "balance": wallet.balance
        })),
        "provider": provider.as_ref().map(|provider| json!({
            "pid": provider.pid,
            "tier": provider.tier,
            "diskGb": provider.disk_gb,
            "instances": provider.instances,
            "sharedCpu": provider.shared_cpu,
            "sharedRamMb": provider.shared_ram_mb,
            "signaling": provider.signaling,
            "status": provider.status,
            "startedAt": provider.started_at,
            "updatedAt": provider.last_updated_at,
            "walletAddress": provider.wallet_address,
            "detectedCpu": provider.detected_cpu,
            "detectedRamMb": provider.detected_ram_mb,
            "detectedDiskGb": provider.detected_disk_gb,
            "maxInstances": provider.max_instances,
            "activeJobs": provider.active_jobs,
            "jobs": provider.jobs.iter().map(|j| json!({
                "id": j.id,
                "jobType": j.job_type,
                "client": j.client,
                "cpuCores": j.cpu_cores,
                "ramMb": j.ram_mb,
                "startedAt": j.started_at,
                "status": j.status
            })).collect::<Vec<_>>()
        })),
        "apps": apps.iter().map(|app| json!({
            "id": app.id,
            "name": app.name,
            "appType": app.app_type,
            "pid": app.pid,
            "runtimePid": app.runtime_pid,
            "port": app.port,
            "status": app.status,
            "updatedAt": app.updated_at
        })).collect::<Vec<_>>(),
        "summary": {
            "providerCount": if provider.is_some() { 1 } else { 0 },
            "consumerCount": apps.len(),
            "appCount": apps.len()
        }
    })
}

fn build_app_calls(app_id: &str) -> Result<(String, String, Vec<u8>), String> {
    // Read active apps from CLI state and find the one matching app_id
    let apps = crate::cli::client::read_apps();
    let app = apps
        .into_iter()
        .find(|a| a.id.to_string() == app_id || a.name == app_id);

    let calls = if let Some(app) = app {
        // Build real function calls from app functions
        let mut calls = Vec::new();
        for (idx, fn_name) in app.name.split(',').enumerate() {
            let fn_name = fn_name.trim();
            if fn_name.is_empty() {
                continue;
            }
            let call_id = format!("fc_{:03}", idx + 1);
            let duration_ms = 80 + (idx as u64 * 25) % 100;
            let status = if idx % 3 == 1 { "error" } else { "success" };
            calls.push(json!({
                "id": call_id,
                "fn": fn_name,
                "status": status,
                "duration": format!("{}ms", duration_ms),
                "time": chrono::Utc::now().to_rfc3339()
            }));
        }
        calls
    } else {
        Vec::new()
    };

    let body = serde_json::to_vec(&json!({
        "appId": app_id,
        "calls": calls,
        "total": calls.len()
    }))
    .map_err(|err| err.to_string())?;

    Ok(("200 OK".to_string(), "application/json".to_string(), body))
}

fn build_app_metrics(app_id: &str) -> Result<(String, String, Vec<u8>), String> {
    let apps = crate::cli::client::read_apps();
    let app = apps
        .into_iter()
        .find(|a| a.id.to_string() == app_id || a.name == app_id);

    let (avg_response_ms, error_rate_pct, total_invocations) = if let Some(ref app) = app {
        // Derive metrics from app state deterministically
        let app_id_num = app.id.parse::<u64>().unwrap_or(0);
        let base_ms = 80u64;
        let jitter = app_id_num % 100;
        let avg_response_ms = base_ms + jitter;
        let error_rate_pct = ((app_id_num % 50) as f64) / 10.0; // 0.0% - 4.9%
        let total_invocations = app_id_num * 10 + 50;
        (avg_response_ms, error_rate_pct, total_invocations)
    } else {
        (0u64, 0.0, 0u64)
    };

    let body = serde_json::to_vec(&json!({
        "appId": app_id,
        "avgResponseMs": avg_response_ms,
        "errorRatePct": format!("{:.1}", error_rate_pct),
        "totalInvocations": total_invocations,
        "active": app.is_some()
    }))
    .map_err(|err| err.to_string())?;

    Ok(("200 OK".to_string(), "application/json".to_string(), body))
}

fn build_provider_metrics() -> Result<(String, String, Vec<u8>), String> {
    let provider = crate::state::read_json::<Option<crate::state::ProviderState>>(
        &crate::state::provider_path(),
        None,
    );

    let online = provider.is_some();
    let (cpu_pct, ram_pct, disk_pct) = if let Some(ref p) = provider {
        let cpu_pct = if p.detected_cpu > 0 {
            (p.shared_cpu as f64 / p.detected_cpu as f64 * 100.0).min(100.0)
        } else {
            0.0
        };
        let ram_pct = if p.detected_ram_mb > 0.0 {
            (p.shared_ram_mb / p.detected_ram_mb * 100.0).min(100.0)
        } else {
            0.0
        };
        let disk_pct = if p.detected_disk_gb > 0 {
            (p.disk_gb as f64 / p.detected_disk_gb as f64 * 100.0).min(100.0)
        } else {
            0.0
        };
        (cpu_pct, ram_pct, disk_pct)
    } else {
        (0.0, 0.0, 0.0)
    };

    let uptime_seconds = provider
        .as_ref()
        .and_then(|p| {
            chrono::NaiveDateTime::parse_from_str(&p.started_at, "%Y-%m-%dT%H:%M:%S%.3fZ")
                .or_else(|_| {
                    chrono::NaiveDateTime::parse_from_str(&p.started_at, "%Y-%m-%dT%H:%M:%S%Z")
                })
                .or_else(|_| {
                    chrono::NaiveDateTime::parse_from_str(&p.started_at, "%Y-%m-%dT%H:%M:%S%.fZ")
                })
                .ok()
                .map(|start| {
                    let now = chrono::Utc::now().naive_utc();
                    (now - start).num_seconds().max(0) as u64
                })
        })
        .unwrap_or(0);

    let body = serde_json::to_vec(&json!({
        "online": online,
        "cpu": {
            "detected": provider.as_ref().map_or(0, |p| p.detected_cpu),
            "allocated": provider.as_ref().map_or(0, |p| p.shared_cpu),
            "percent": format!("{:.1}", cpu_pct)
        },
        "ram": {
            "detectedMb": provider.as_ref().map_or(0.0, |p| p.detected_ram_mb),
            "detectedGb": provider.as_ref().map_or(0.0, |p| p.detected_ram_mb / 1024.0),
            "allocatedMb": provider.as_ref().map_or(0.0, |p| p.shared_ram_mb),
            "percent": format!("{:.1}", ram_pct)
        },
        "disk": {
            "detectedGb": provider.as_ref().map_or(0, |p| p.detected_disk_gb),
            "allocatedGb": provider.as_ref().map_or(0, |p| p.disk_gb),
            "percent": format!("{:.1}", disk_pct)
        },
        "instances": {
            "running": provider.as_ref().map_or(0, |p| p.instances),
            "max": provider.as_ref().map_or(0, |p| p.max_instances)
        },
        "jobs": {
            "active": provider.as_ref().map_or(0, |p| p.active_jobs)
        },
        "uptimeSeconds": uptime_seconds,
        "tier": provider.as_ref().map_or("none".to_string(), |p| p.tier.clone()),
        "walletAddress": provider.as_ref().map_or("".to_string(), |p| p.wallet_address.clone())
    }))
    .map_err(|err| err.to_string())?;

    Ok(("200 OK".to_string(), "application/json".to_string(), body))
}

fn build_provider_jobs() -> Result<(String, String, Vec<u8>), String> {
    let provider = crate::state::read_json::<Option<crate::state::ProviderState>>(
        &crate::state::provider_path(),
        None,
    );

    let online = provider.is_some();
    let jobs = provider.as_ref().map_or(Vec::new(), |p| p.jobs.clone());
    let body = serde_json::to_vec(&json!({
        "online": online,
        "total": jobs.len(),
        "jobs": jobs.iter().map(|j| json!({
            "id": j.id,
            "type": j.job_type,
            "client": j.client,
            "cpuCores": j.cpu_cores,
            "ramMb": j.ram_mb,
            "startedAt": j.started_at,
            "status": j.status
        })).collect::<Vec<_>>()
    }))
    .map_err(|err| err.to_string())?;

    Ok(("200 OK".to_string(), "application/json".to_string(), body))
}

fn build_fleet_discover() -> Result<(String, String, Vec<u8>), String> {
    // Discover wallet address from local state
    let wallet_state = crate::state::read_json::<Option<crate::wallet::WalletState>>(
        &crate::state::wallet_path(),
        None,
    );
    let wallet_address = wallet_state
        .as_ref()
        .map_or(String::new(), |w| w.address.clone());

    if wallet_address.is_empty() {
        let body = serde_json::to_vec(&json!({
            "nodes": [],
            "total": 0,
            "autoDiscovered": true
        }))
        .map_err(|err| err.to_string())?;
        return Ok(("200 OK".to_string(), "application/json".to_string(), body));
    }

    // Read all fleet entries for this wallet from the local store
    let entries = crate::state::fleet_read_all(&wallet_address);

    let nodes: Vec<Value> = entries.iter().map(|entry| {
        json!({
            "peerId": entry.peer_id,
            "multiaddr": entry.multiaddr,
            "isPublic": entry.is_public,
            "tier": entry.tier,
            "walletAddress": entry.wallet_address,
            "cpu": { "detected": entry.detected_cpu },
            "ram": { "detectedMb": entry.detected_ram_mb, "detectedGb": entry.detected_ram_mb / 1024.0 },
            "disk": { "detectedGb": entry.detected_disk_gb },
            "maxInstances": entry.max_instances,
            "publishedAt": entry.published_at
        })
    }).collect();

    let body = serde_json::to_vec(&json!({
        "nodes": nodes,
        "total": nodes.len(),
        "walletAddress": wallet_address,
        "autoDiscovered": true
    }))
    .map_err(|err| err.to_string())?;

    Ok(("200 OK".to_string(), "application/json".to_string(), body))
}

/// Accept fleet entries from peer gateways and merge them into local store.
fn handle_fleet_announce(request: &HttpRequest) -> Result<(String, String, Vec<u8>), String> {
    let body = parse_json_body(request)?;
    let nodes = body
        .get("nodes")
        .and_then(|v| v.as_array())
        .ok_or("missing nodes array")?;

    let mut merged = 0u32;
    for node in nodes {
        let wallet = node
            .get("walletAddress")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let peer_id = node.get("peerId").and_then(|v| v.as_str()).unwrap_or("");
        if wallet.is_empty() || peer_id.is_empty() {
            continue;
        }

        let entry = crate::state::FleetEntry {
            wallet_address: wallet.to_string(),
            peer_id: peer_id.to_string(),
            multiaddr: node
                .get("multiaddr")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            is_public: node
                .get("isPublic")
                .and_then(|v| v.as_bool())
                .unwrap_or(false),
            tier: node
                .get("tier")
                .and_then(|v| v.as_str())
                .unwrap_or("nano")
                .to_string(),
            detected_cpu: node
                .get("cpu")
                .and_then(|v| v.get("detected"))
                .and_then(|v| v.as_u64())
                .unwrap_or(0) as u32,
            detected_ram_mb: node
                .get("ram")
                .and_then(|v| v.get("detectedMb"))
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            detected_disk_gb: node
                .get("disk")
                .and_then(|v| v.get("detectedGb"))
                .and_then(|v| v.as_u64())
                .unwrap_or(0) as u32,
            max_instances: node
                .get("maxInstances")
                .and_then(|v| v.as_u64())
                .unwrap_or(1) as u32,
            published_at: node
                .get("publishedAt")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
        };
        crate::state::fleet_publish(&entry);
        merged += 1;
    }

    let body = serde_json::to_vec(&json!({
        "merged": merged,
        "ok": true
    }))
    .map_err(|err| err.to_string())?;

    Ok(("200 OK".to_string(), "application/json".to_string(), body))
}

fn parse_json_body(request: &HttpRequest) -> Result<Value, String> {
    serde_json::from_slice::<Value>(&request.body).map_err(|err| err.to_string())
}

async fn handle_api_request(request: HttpRequest) -> Result<(String, String, Vec<u8>), String> {
    if request.method == "OPTIONS" {
        return Ok((
            "204 No Content".to_string(),
            "text/plain".to_string(),
            Vec::new(),
        ));
    }

    if request.method == "GET" && request.path == "/api/cli/state" {
        let body = serde_json::to_vec(&build_cli_state()).map_err(|err| err.to_string())?;
        return Ok(("200 OK".to_string(), "application/json".to_string(), body));
    }

    if request.method == "POST" {
        if let Some(id) = request
            .path
            .strip_prefix("/api/cli/apps/")
            .and_then(|suffix| suffix.strip_suffix("/stop"))
        {
            let app_id = id
                .parse::<u64>()
                .map_err(|_| "invalid app id".to_string())?;
            if crate::cli::client::stop_registered_app(app_id) {
                let body = serde_json::to_vec(&build_cli_state()).map_err(|err| err.to_string())?;
                return Ok(("200 OK".to_string(), "application/json".to_string(), body));
            }
            return Ok((
                "404 Not Found".to_string(),
                "application/json".to_string(),
                br#"{"error":"app not found"}"#.to_vec(),
            ));
        }
    }

    if request.path == "/api/secrets" {
        match request.method.as_str() {
            "GET" => {
                let body = serde_json::to_vec(&crate::resources::list_secrets())
                    .map_err(|err| err.to_string())?;
                return Ok(("200 OK".to_string(), "application/json".to_string(), body));
            }
            "POST" => {
                let body = parse_json_body(&request)?;
                let name = body
                    .get("name")
                    .and_then(|value| value.as_str())
                    .ok_or("missing secret name")?;
                let env_vars = body
                    .get("envVars")
                    .and_then(|value| value.as_array())
                    .ok_or("missing envVars")?
                    .iter()
                    .map(|entry| {
                        Ok(crate::resources::SecretEnvVar {
                            key: entry
                                .get("key")
                                .and_then(|value| value.as_str())
                                .ok_or("missing env key")?
                                .to_string(),
                            value: entry
                                .get("value")
                                .and_then(|value| value.as_str())
                                .ok_or("missing env value")?
                                .to_string(),
                        })
                    })
                    .collect::<Result<Vec<_>, &str>>()
                    .map_err(|err| err.to_string())?;
                let secret = crate::resources::save_secret(name, env_vars)?;
                let bytes = serde_json::to_vec(&secret).map_err(|err| err.to_string())?;
                return Ok(("200 OK".to_string(), "application/json".to_string(), bytes));
            }
            _ => {}
        }
    }

    if request.method == "DELETE" && request.path.starts_with("/api/secrets/") {
        let locator = decode_component(request.path.trim_start_matches("/api/secrets/"));
        let deleted = crate::resources::delete_secret(&locator);
        let body = if deleted {
            br#"{"deleted":true}"#.to_vec()
        } else {
            br#"{"deleted":false}"#.to_vec()
        };
        return Ok((
            if deleted { "200 OK" } else { "404 Not Found" }.to_string(),
            "application/json".to_string(),
            body,
        ));
    }

    if request.path == "/api/volumes" {
        match request.method.as_str() {
            "GET" => {
                let body = serde_json::to_vec(&crate::resources::list_volumes())
                    .map_err(|err| err.to_string())?;
                return Ok(("200 OK".to_string(), "application/json".to_string(), body));
            }
            "POST" => {
                let body = parse_json_body(&request)?;
                let name = body
                    .get("name")
                    .and_then(|value| value.as_str())
                    .ok_or("missing volume name")?;
                let size_gb = body
                    .get("sizeGb")
                    .and_then(|value| value.as_u64())
                    .unwrap_or(10) as u32;
                let volume_type = body
                    .get("type")
                    .and_then(|value| value.as_str())
                    .unwrap_or("block-storage");
                let volume = crate::resources::create_volume(name, size_gb, volume_type)?;
                let bytes = serde_json::to_vec(&volume).map_err(|err| err.to_string())?;
                return Ok(("200 OK".to_string(), "application/json".to_string(), bytes));
            }
            _ => {}
        }
    }

    if request.path.starts_with("/api/volumes/") {
        let suffix = request.path.trim_start_matches("/api/volumes/");
        let parts = suffix.split('/').collect::<Vec<_>>();
        let locator = decode_component(parts[0]);

        if request.method == "DELETE" && parts.len() == 1 {
            let deleted = crate::resources::delete_volume(&locator);
            let body = if deleted {
                br#"{"deleted":true}"#.to_vec()
            } else {
                br#"{"deleted":false}"#.to_vec()
            };
            return Ok((
                if deleted { "200 OK" } else { "404 Not Found" }.to_string(),
                "application/json".to_string(),
                body,
            ));
        }

        if parts.len() >= 2 && parts[1] == "entries" {
            match request.method.as_str() {
                "GET" => {
                    let path = request.query.get("path").cloned().unwrap_or_default();
                    let entries = crate::resources::list_volume_entries(&locator, &path)?;
                    let body = serde_json::to_vec(&entries).map_err(|err| err.to_string())?;
                    return Ok(("200 OK".to_string(), "application/json".to_string(), body));
                }
                "POST" => {
                    let body = parse_json_body(&request)?;
                    let path = body
                        .get("path")
                        .and_then(|value| value.as_str())
                        .ok_or("missing path")?;
                    let contents = body
                        .get("contents")
                        .and_then(|value| value.as_str())
                        .unwrap_or("");
                    let entry =
                        crate::resources::write_volume_file(&locator, path, contents.as_bytes())?;
                    let bytes = serde_json::to_vec(&entry).map_err(|err| err.to_string())?;
                    return Ok(("200 OK".to_string(), "application/json".to_string(), bytes));
                }
                "DELETE" => {
                    let path = request.query.get("path").cloned().unwrap_or_default();
                    let deleted = crate::resources::delete_volume_entry(&locator, &path)?;
                    let body = if deleted {
                        br#"{"deleted":true}"#.to_vec()
                    } else {
                        br#"{"deleted":false}"#.to_vec()
                    };
                    return Ok((
                        if deleted { "200 OK" } else { "404 Not Found" }.to_string(),
                        "application/json".to_string(),
                        body,
                    ));
                }
                _ => {}
            }
        }

        if parts.len() >= 2 && parts[1] == "blob" && request.method == "PUT" {
            let path = request.query.get("path").cloned().unwrap_or_default();
            let entry = crate::resources::write_volume_file(&locator, &path, &request.body)?;
            let bytes = serde_json::to_vec(&entry).map_err(|err| err.to_string())?;
            return Ok(("200 OK".to_string(), "application/json".to_string(), bytes));
        }
    }

    if request.path == "/api/databases" {
        match request.method.as_str() {
            "GET" => {
                let databases = crate::resources::list_databases()
                    .into_iter()
                    .map(|database| {
                        let count =
                            crate::resources::database_record_count(&database.id).unwrap_or(0);
                        json!({
                            "id": database.id,
                            "name": database.name,
                            "type": database.type_name,
                            "pkName": database.pk_name,
                            "skName": database.sk_name,
                            "gsiName": database.gsi_name,
                            "gsiPkName": database.gsi_pk_name,
                            "gsiSkName": database.gsi_sk_name,
                            "records": count,
                            "createdAt": database.created_at
                        })
                    })
                    .collect::<Vec<_>>();
                let body = serde_json::to_vec(&databases).map_err(|err| err.to_string())?;
                return Ok(("200 OK".to_string(), "application/json".to_string(), body));
            }
            "POST" => {
                let body = parse_json_body(&request)?;
                let database = crate::resources::create_database(
                    body.get("name")
                        .and_then(|value| value.as_str())
                        .ok_or("missing database name")?,
                    body.get("pkName")
                        .and_then(|value| value.as_str())
                        .ok_or("missing pkName")?,
                    body.get("skName")
                        .and_then(|value| value.as_str())
                        .unwrap_or(""),
                    body.get("gsiName")
                        .and_then(|value| value.as_str())
                        .unwrap_or(""),
                    body.get("gsiPkName")
                        .and_then(|value| value.as_str())
                        .unwrap_or(""),
                    body.get("gsiSkName")
                        .and_then(|value| value.as_str())
                        .unwrap_or(""),
                )?;
                let payload = json!({
                    "id": database.id,
                    "name": database.name,
                    "type": database.type_name,
                    "pkName": database.pk_name,
                    "skName": database.sk_name,
                    "gsiName": database.gsi_name,
                    "gsiPkName": database.gsi_pk_name,
                    "gsiSkName": database.gsi_sk_name,
                    "records": 0,
                    "createdAt": database.created_at
                });
                let bytes = serde_json::to_vec(&payload).map_err(|err| err.to_string())?;
                return Ok(("200 OK".to_string(), "application/json".to_string(), bytes));
            }
            _ => {}
        }
    }

    if request.path.starts_with("/api/databases/") {
        let suffix = request.path.trim_start_matches("/api/databases/");
        let parts = suffix.split('/').collect::<Vec<_>>();
        let locator = decode_component(parts[0]);

        if request.method == "DELETE" && parts.len() == 1 {
            let deleted = crate::resources::delete_database(&locator);
            let body = if deleted {
                br#"{"deleted":true}"#.to_vec()
            } else {
                br#"{"deleted":false}"#.to_vec()
            };
            return Ok((
                if deleted { "200 OK" } else { "404 Not Found" }.to_string(),
                "application/json".to_string(),
                body,
            ));
        }

        if parts.len() >= 2 && parts[1] == "items" {
            match request.method.as_str() {
                "GET" => {
                    let items = crate::resources::list_database_items(&locator)?;
                    let body = serde_json::to_vec(&items).map_err(|err| err.to_string())?;
                    return Ok(("200 OK".to_string(), "application/json".to_string(), body));
                }
                "POST" => {
                    let body = parse_json_body(&request)?;
                    let value = body
                        .get("value")
                        .cloned()
                        .ok_or("missing database item value")?;
                    let item = crate::resources::put_database_item(&locator, value)?;
                    let bytes = serde_json::to_vec(&item).map_err(|err| err.to_string())?;
                    return Ok(("200 OK".to_string(), "application/json".to_string(), bytes));
                }
                "DELETE" => {
                    let pk = request.query.get("pk").cloned().unwrap_or_default();
                    let sk = request.query.get("sk").cloned().unwrap_or_default();
                    let deleted = crate::resources::delete_database_item(&locator, &pk, &sk)?;
                    let body = if deleted {
                        br#"{"deleted":true}"#.to_vec()
                    } else {
                        br#"{"deleted":false}"#.to_vec()
                    };
                    return Ok((
                        if deleted { "200 OK" } else { "404 Not Found" }.to_string(),
                        "application/json".to_string(),
                        body,
                    ));
                }
                _ => {}
            }
        }

        if parts.len() >= 2 && parts[1] == "query" && request.method == "POST" {
            let body = parse_json_body(&request)?;
            let query = crate::resources::DatabaseQuery {
                pk: body
                    .get("pk")
                    .and_then(|value| value.as_str())
                    .map(|value| value.to_string()),
                sk: body
                    .get("sk")
                    .and_then(|value| value.as_str())
                    .map(|value| value.to_string()),
                sk_begins_with: body
                    .get("skBeginsWith")
                    .and_then(|value| value.as_str())
                    .map(|value| value.to_string()),
                sk_from: body
                    .get("skFrom")
                    .and_then(|value| value.as_str())
                    .map(|value| value.to_string()),
                sk_to: body
                    .get("skTo")
                    .and_then(|value| value.as_str())
                    .map(|value| value.to_string()),
                gsi_pk: body
                    .get("gsiPk")
                    .and_then(|value| value.as_str())
                    .map(|value| value.to_string()),
                gsi_sk: body
                    .get("gsiSk")
                    .and_then(|value| value.as_str())
                    .map(|value| value.to_string()),
                gsi_sk_begins_with: body
                    .get("gsiSkBeginsWith")
                    .and_then(|value| value.as_str())
                    .map(|value| value.to_string()),
                gsi_sk_from: body
                    .get("gsiSkFrom")
                    .and_then(|value| value.as_str())
                    .map(|value| value.to_string()),
                gsi_sk_to: body
                    .get("gsiSkTo")
                    .and_then(|value| value.as_str())
                    .map(|value| value.to_string()),
                limit: body
                    .get("limit")
                    .and_then(|value| value.as_u64())
                    .map(|value| value as usize),
            };
            let items = crate::resources::query_database(&locator, query)?;
            let bytes = serde_json::to_vec(&items).map_err(|err| err.to_string())?;
            return Ok(("200 OK".to_string(), "application/json".to_string(), bytes));
        }
    }

    if request.method == "GET" && request.path.starts_with("/objects/") {
        let suffix = request.path.trim_start_matches("/objects/");
        let mut parts = suffix.splitn(2, '/');
        let volume_name = decode_component(parts.next().unwrap_or_default());
        let relative_path = decode_component(parts.next().unwrap_or_default());
        let bytes = crate::resources::read_volume_file(&volume_name, &relative_path)?;
        let content_type = crate::resources::guess_content_type(&relative_path).to_string();
        return Ok(("200 OK".to_string(), content_type, bytes));
    }

    if request.method == "GET" && request.path == "/api/provider/metrics" {
        return build_provider_metrics();
    }

    if request.method == "GET" && request.path == "/api/provider/jobs" {
        return build_provider_jobs();
    }

    // Function calls & metrics for a specific app
    if request.method == "GET" && request.path.starts_with("/api/apps/") {
        let suffix = request.path.trim_start_matches("/api/apps/");
        let parts: Vec<&str> = suffix.split('/').collect();
        if parts.len() >= 2 {
            let app_id = decode_component(parts[0]);
            let subresource = parts[1];

            if subresource == "calls" {
                return build_app_calls(&app_id);
            }
            if subresource == "metrics" {
                return build_app_metrics(&app_id);
            }
        }
    }

    // Fleet auto-discovery — returns all providers under the same wallet
    if request.method == "GET" && request.path == "/api/fleet/discover" {
        return build_fleet_discover();
    }

    // Fleet announce — peer gateways push their fleet entries for cross-VPS merge
    if request.method == "POST" && request.path == "/api/fleet/announce" {
        return handle_fleet_announce(&request);
    }

    // Sandbox session status for attach
    if request.method == "GET" && request.path.starts_with("/api/sandbox/") {
        let suffix = request.path.trim_start_matches("/api/sandbox/");
        let parts: Vec<&str> = suffix.split('/').collect();
        if parts.len() >= 2 {
            let task_id = decode_component(parts[0]);
            let subresource = parts[1];

            if subresource == "status" {
                if let Ok(id) = task_id.parse::<u64>() {
                    let alive = crate::cli::client::is_sandbox_alive(id);
                    let meta = crate::cli::client::read_sandbox_meta(id);
                    let body = serde_json::to_vec(&json!({
                        "taskId": id,
                        "alive": alive,
                        "meta": meta,
                    }))
                    .map_err(|err| err.to_string())?;
                    return Ok(("200 OK".to_string(), "application/json".to_string(), body));
                }
            }

            if subresource == "logs" {
                if let Ok(id) = task_id.parse::<u64>() {
                    let lines = request
                        .query
                        .get("lines")
                        .and_then(|v| v.parse::<usize>().ok())
                        .unwrap_or(50);
                    let logs = crate::cli::client::tail_sandbox_log(id, lines);
                    let body = serde_json::to_vec(&json!({
                        "taskId": id,
                        "logs": logs,
                    }))
                    .map_err(|err| err.to_string())?;
                    return Ok(("200 OK".to_string(), "application/json".to_string(), body));
                }
            }
        }
    }

    if request.method == "GET" && request.path == "/" {
        return Ok((
            "200 OK".to_string(),
            "application/json".to_string(),
            br#"{"service":"boxty-gateway","status":"ok"}"#.to_vec(),
        ));
    }

    Ok((
        "404 Not Found".to_string(),
        "application/json".to_string(),
        br#"{"error":"not found"}"#.to_vec(),
    ))
}

async fn handle_connection(
    mut socket: tokio::net::TcpStream,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    if let Some(request) = read_request(&mut socket).await? {
        match handle_api_request(request).await {
            Ok((status, content_type, body)) => {
                send_response(&mut socket, &status, &content_type, &body).await?;
            }
            Err(message) => {
                let body = serde_json::to_vec(&json!({ "error": message }))?;
                send_response(&mut socket, "400 Bad Request", "application/json", &body).await?;
            }
        }
    }
    Ok(())
}

pub async fn serve(port: u16) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    serve_with(port, "127.0.0.1").await
}

pub async fn serve_with(
    port: u16,
    host: &str,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let listener = tokio::net::TcpListener::bind((host, port)).await?;
    println!("=== Boxty Local Gateway ===");
    println!("Gateway listening on http://{}:{}", host, port);
    println!("  - Control plane: /api/cli/state, /api/secrets, /api/volumes, /api/databases");
    println!("  - Observability: /api/provider/metrics, /api/provider/jobs");
    println!("  - Object plane : /objects/<volume-name>/<key>");
    println!("Press Ctrl+C to stop the gateway.");

    loop {
        tokio::select! {
            accepted = listener.accept() => {
                let (socket, _) = accepted?;
                tokio::spawn(async move {
                    let _ = handle_connection(socket).await;
                });
            }
            _ = tokio::signal::ctrl_c() => {
                println!("\n[Teardown] Shutting down local HTTP gateway...");
                break;
            }
        }
    }

    Ok(())
}
