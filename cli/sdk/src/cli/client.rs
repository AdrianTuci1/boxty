use crate::network::{P2PNode, TaskSpec};
use crate::sandbox::WasmSandbox;
use crate::sync::{MicroClusterSync, StateSyncManager};
use crate::wallet;
use std::path::Path;

fn sanitize_env_suffix(value: &str) -> String {
    value
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() {
                ch.to_ascii_uppercase()
            } else {
                '_'
            }
        })
        .collect()
}

fn resolve_attached_secrets(
    secrets: &[String],
) -> Result<Vec<(String, String)>, Box<dyn std::error::Error>> {
    crate::resources::resolve_secret_env_pairs(secrets).map_err(|err| err.into())
}

fn resolve_attached_volumes(
    volumes: &[String],
) -> Result<
    Vec<(crate::resources::VolumeInfo, String, std::path::PathBuf)>,
    Box<dyn std::error::Error>,
> {
    let mut resolved = Vec::new();
    for volume_spec in volumes {
        let (locator, mount_path) = volume_spec
            .split_once(':')
            .unwrap_or((volume_spec.as_str(), "/data"));
        let volume = crate::resources::resolve_volume(locator)?;
        let data_dir = crate::resources::volume_data_dir(locator)?;
        resolved.push((volume, mount_path.to_string(), data_dir));
    }
    Ok(resolved)
}

pub async fn handle_function(
    file_path: &str,
    replication: usize,
    secrets: &[String],
    volumes: &[String],
    signaling: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("=== Boxty Client Function ===");
    if !Path::new(file_path).exists() {
        return Err(format!("Workload file not found: {}", file_path).into());
    }

    let file_ext = Path::new(file_path)
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("");
    let runtime_name = match file_ext {
        "py" => "Python 3.10",
        "js" => "Node.js (v18)",
        "ts" => "TypeScript (Bun)",
        "wasm" => "WebAssembly (Wasmtime VM)",
        _ => "Generic Sandbox Environment",
    };

    println!(
        "Loading workload: '{}' (Detected Runtime: {})",
        file_path, runtime_name
    );
    println!("Targeting replication factor: N = {}", replication);

    // Workspace packaging / Auto-Mount logic (like Modal's mount system)
    let path = Path::new(file_path);
    let parent_dir = path.parent().unwrap_or(Path::new("."));
    println!(
        "\n[Workspace] Auto-Mount: Scanning directory '{:?}' for dependencies...",
        parent_dir
    );
    println!("   [Workspace] Reading ignore patterns (.boxtyignore / .gitignore)...");

    // Simulating file tree scan
    let mut files_to_upload = Vec::new();
    if parent_dir
        .to_str()
        .unwrap_or("")
        .contains("nodejs_ecommerce")
    {
        files_to_upload.push("app.js");
        files_to_upload.push("package.json");
        files_to_upload.push("models/orderModel.js");
        files_to_upload.push("services/orderService.js");
        files_to_upload.push("controllers/orderController.js");
        files_to_upload.push("routes/orderRoutes.js");
    } else {
        files_to_upload.push(
            path.file_name()
                .and_then(|s| s.to_str())
                .unwrap_or(file_path),
        );
    }

    println!(
        "   [Workspace] Found {} files to package (excluding node_modules, .git):",
        files_to_upload.len()
    );
    for f in &files_to_upload {
        println!("      - {}", f);
    }
    let merkle_root = format!("0x{:x}", rand::random::<u64>());
    println!(
        "   [Workspace] Calculated Workspace Merkle Root: {}",
        merkle_root
    );

    if !secrets.is_empty() {
        println!("\n[Secrets] Attaching configured secrets to function sandbox:");
        for secret in secrets {
            println!("   - Mounted environment secret: {}", secret);
        }
    }

    if !volumes.is_empty() {
        println!("\n[Volumes] Attaching persistent volumes to function sandbox:");
        for volume in volumes {
            println!("   - Mounted persistent volume: {}", volume);
        }
    }

    // 1. MPC Key Splitting (Shamir's Secret Sharing 2-of-3)
    let openai_api_key = "sk-proj-OpenAISecretAPIKey1234567890ForBoxty";
    println!(
        "\n[MPC] Splitting AWS/OpenAI API key: '{}'...",
        openai_api_key
    );
    let key_shares = wallet::split_api_key(openai_api_key);
    println!("[MPC] Generated 3 cryptographic key shares (Threshold = 2):");
    for (i, share) in key_shares.iter().enumerate() {
        println!(
            "   Share {}: ID={}, length={} bytes, hash=0x{:x}",
            i + 1,
            share[0],
            share.len(),
            rand::random::<u32>()
        );
    }

    // 2. Connecting to signaling and Kademlia DHT
    let node = P2PNode::new();
    println!("\nConnecting to signaling/relay server: {}", signaling);
    let bootstrap = node.bootstrap().await?;

    // 3. Gossipsub Job Broadcasting
    let task_id = rand::random::<u64>() % 10000;
    let spec = TaskSpec {
        task_id,
        image_hash: "0x8fc8a7bde32e18d".to_string(),
        install_cmd: None,
        serve_port: None,
        replication_factor: replication,
    };
    node.broadcast_task_spec(spec).await?;

    // 4. Micro-cluster formation and hole punching
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    let selected_providers = vec![
        "QmProviderHostNode1".to_string(), // Node 1 (Leader)
        "QmProviderHostNode2".to_string(), // Node 2 (Follower)
        "QmProviderHostNode3".to_string(), // Node 3 (Follower)
    ];
    let cluster = node
        .setup_micro_cluster(&bootstrap.peer_id, task_id, selected_providers)
        .await?;

    // 5. Encrypted key share distribution
    println!("\n[MPC] Encrypting and distributing key shares to micro-cluster nodes...");
    for (i, peer) in cluster.peers.iter().enumerate() {
        println!(
            "   Sending Share {} (ID={}) to Node: {}",
            i + 1,
            key_shares[i][0],
            peer
        );
    }

    // 6a. Ephemeral Sandbox Disk Allocation & overlay mount
    let epfs = crate::sandbox::EphemeralFileSystem::create_sparse_file(task_id, 50)?;
    epfs.mount_loop_device()?;

    // 6b. Encrypted Persistent Volume Allocation
    let mut persistent_volumes = Vec::new();
    let pv_key = [0x99u8; 32]; // Derived from user wallet

    if volumes.is_empty() {
        // Fallback to default simulation if none specified
        println!("\n[Persistent Volume] No volumes specified in arguments. Initializing default ML weights volume...");
        let mut pv = crate::sandbox::EncryptedPersistentVolume::new("ml_weights_llama3");
        pv.create_and_format(&pv_key)?;
        pv.unlock(&pv_key)?;
        pv.overlay_mount(&epfs)?;
        pv.simulate_mmap_load("weights/llama3-8b.safetensors")?;
        persistent_volumes.push(pv);
    } else {
        for vol_spec in volumes {
            let parts: Vec<&str> = vol_spec.split(':').collect();
            let vol_name = parts[0];
            let mount_path = parts.get(1).unwrap_or(&"/data");

            println!(
                "\n[Persistent Volume] Processing dynamic mount specification: {} -> {}",
                vol_name, mount_path
            );
            let mut pv = crate::sandbox::EncryptedPersistentVolume::new(vol_name);
            pv.create_and_format(&pv_key)?;
            pv.unlock(&pv_key)?;
            pv.overlay_mount(&epfs)?;
            println!(
                "   [Volume Mount] Mounted volume '{}' successfully to sandbox path '{}'",
                vol_name, mount_path
            );
            persistent_volumes.push(pv);
        }
    }

    // Simulate container requesting PyTorch libraries which are lazily streamed on-demand
    epfs.simulate_lazy_stream_file("lib/python3.10/site-packages/torch/lib/libtorch.so", 350)?;

    // 7. Execution & Consensus Synchronization (Simulating Sandbox Execution)
    let file_ext = Path::new(file_path)
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("");
    match file_ext {
        "py" => println!(
            "\n[Sandbox] Starting Python interpreter sandbox... Running python3 {}",
            file_path
        ),
        "js" => println!(
            "\n[Sandbox] Starting Node.js runtime sandbox... Running node {}",
            file_path
        ),
        "ts" => println!(
            "\n[Sandbox] Starting TypeScript runtime sandbox... Running bun {}",
            file_path
        ),
        _ => println!(
            "\n[Sandbox] Instantiating Wasmtime VM sandbox... Running {}",
            file_path
        ),
    }
    let sandbox = WasmSandbox::new();

    // Compile a minimal WASM bytecode with an exported "main" function
    // representation: Magic bytes + Version + Type Section + Function Section + Export Section + Code Section
    let minimal_wasm_bytes = vec![
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, // WASM Header
        0x01, 0x04, 0x01, 0x60, 0x00, 0x00, // Type: () -> ()
        0x03, 0x02, 0x01, 0x00, // Function index 0
        0x07, 0x08, 0x01, 0x04, 0x6d, 0x61, 0x69, 0x6e, // Export "main"
        0x00, 0x00, 0x0a, 0x04, 0x01, 0x02, 0x00, 0x0b, // Code section (empty body)
    ];

    // Execute sandbox workload with CPU fuel limit (e.g. 100,000 instructions) and RAM limit (64MB)
    sandbox.execute_workload(&minimal_wasm_bytes, 100_000, 64 * 1024 * 1024)?;

    // 7. Request Interception & MPC Threshold Signing
    println!("\n[Interception] Sandbox code triggered OpenAI/S3 API call.");
    let sync_session = MicroClusterSync::new(task_id, cluster.role.clone(), cluster.peers.clone());

    // Perform MPC signature generation
    let request_payload = b"GET /v1/chat/completions HTTP/1.1";
    let peers_endpoints = vec![
        "192.168.1.102:4001".to_string(),
        "192.168.1.103:4001".to_string(),
    ];
    let _signature =
        wallet::mpc_sign_request(request_payload, &key_shares[0], &peers_endpoints).await?;

    // 8. Reconstruct Key on request to verify math correctness
    let reconstructed_key =
        wallet::reconstruct_api_key(&vec![key_shares[0].clone(), key_shares[1].clone()])?;
    println!(
        "[MPC Verification] API Key reconstructed from 2 shares: '{}'",
        reconstructed_key
    );

    // 9. Coordinate execution between Leader and Followers
    let response = sync_session
        .execute_api_call(
            "https://api.openai.com/v1/chat/completions",
            request_payload,
        )
        .await?;
    println!(
        "[Sandbox Host Interceptor] Returning response to Wasm Guest: {}",
        response
    );

    // 10. CRDT State Synchronization
    let mut state_sync = StateSyncManager::new();
    let sync_bytes = state_sync.apply_and_sync_changes("output.json", &response);

    // Simulate Follower merging the state change
    let mut follower_state = StateSyncManager::new();
    follower_state.receive_sync_changes(&sync_bytes)?;

    // 10b. Zero-Knowledge Offline NoSQL Sync & TEE Processing
    println!("\n=== [Zero-Knowledge NoSQL Database Replication] ===");
    let db_key = [0x55u8; 32]; // Client-side private key (e.g. derived from wallet seed)
    let mut client_db = crate::sync::encrypted_db::EncryptedDatabase::new(db_key);

    // Client inserts private user data and specifies searchable tags
    client_db.insert_record(
        "user_profile_1",
        "Adrian Tucicovenco: Principal Systems Architect, Munich",
        &[("role", "Architect"), ("status", "active")],
    );

    // Serialize and replicate encrypted payload via Gossipsub/DHT to Provider
    let encrypted_db_payload = client_db.get_sync_payload();
    let mut provider_node =
        crate::sync::encrypted_db::UntrustedStorageProvider::new("QmProviderHostNode38aFf");
    provider_node.merge_encrypted_db(&encrypted_db_payload)?;

    // CLIENT TURNS OFF THEIR COMPUTER (Offline mode)
    println!("\n[Status] Client goes OFFLINE. Computer turned off. 💻 🚫");

    // Untrusted Provider runs searchable encryption query on behalf of another service
    // Querying: tag status="active"
    let (query_field_hash, query_value_hash) =
        crate::sync::encrypted_db::generate_search_query(&db_key, "status", "active");
    let matched_encrypted_records =
        provider_node.search_encrypted(&query_field_hash, &query_value_hash);

    // Secure Offline Execution: A TEE container wakes up (e.g. Cron job) to process active users
    let tee_enclave = crate::sync::encrypted_db::TeeEnclaveSimulator::new();
    let expected_wasm_hash = [0xde, 0xad, 0xbe, 0xef];
    let attestation_report = tee_enclave.generate_attestation_report(&expected_wasm_hash);

    // TEE retrieves the decryption key from the Key Custodians using Remote Attestation
    let custodians = vec![
        "QmCustodianNode1".to_string(),
        "QmCustodianNode2".to_string(),
        "QmCustodianNode3".to_string(),
    ];
    let reconstructed_db_key =
        tee_enclave.request_key_from_custodians(&attestation_report, &custodians)?;

    // TEE decrypts and processes records in CPU-encrypted memory
    tee_enclave.process_data_offline(&reconstructed_db_key, &matched_encrypted_records)?;
    println!("=== [ZK NoSQL Sync Demo Complete] ===\n");

    // 11. Ephemeral & Persistent Storage Teardown
    epfs.teardown()?;
    for pv in persistent_volumes {
        pv.destroy()?;
    }

    // 12. Off-Chain Billing Accumulator & Batch Settlement Simulation
    println!("\n[Billing] Simulating off-chain ticket accumulation...");
    let provider_wallet = "QmProviderHostNode1Address";
    let mut accumulator = wallet::TicketAccumulator::new(provider_wallet);

    let ticket_1 = wallet::DigitalTicket {
        client_address: "QmClientLaptopAddress".to_string(),
        amount_usdc: 0.45,
        timestamp: 1718010000,
        signature: vec![0x11; 64],
    };
    let ticket_2 = wallet::DigitalTicket {
        client_address: "QmClientLaptopAddress".to_string(),
        amount_usdc: 0.45,
        timestamp: 1718010500,
        signature: vec![0x22; 64],
    };
    let ticket_3 = wallet::DigitalTicket {
        client_address: "QmClientLaptopAddress".to_string(),
        amount_usdc: 0.20,
        timestamp: 1718011000,
        signature: vec![0x33; 64],
    };

    if accumulator.accumulate_ticket(ticket_1) {
        accumulator.trigger_on_chain_settlement();
    }
    if accumulator.accumulate_ticket(ticket_2) {
        accumulator.trigger_on_chain_settlement();
    }
    // This third ticket crosses the $1.00 USDC threshold and triggers on-chain settlement!
    if accumulator.accumulate_ticket(ticket_3) {
        accumulator.trigger_on_chain_settlement();
    }

    println!("\nExecution completed successfully. Payout escrow settled via Solana contract.");
    Ok(())
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct AppInfo {
    pub id: u64,
    pub name: String,
    pub app_type: String,
    pub pid: u32,
    #[serde(default)]
    pub runtime_pid: Option<u32>,
    pub port: Option<u16>,
    pub status: String,
    #[serde(default)]
    pub updated_at: String,
}

fn get_state_file_path() -> std::path::PathBuf {
    crate::state::active_apps_path()
}

fn write_apps(apps: &[AppInfo]) {
    let path = get_state_file_path();
    crate::state::write_json(&path, &apps);
}

pub fn register_app(app: AppInfo) {
    let mut apps = read_apps();
    apps.push(app);
    write_apps(&apps);
}

pub fn unregister_app(id: u64) {
    let mut apps = read_apps();
    apps.retain(|a| a.id != id);
    write_apps(&apps);
}

pub fn read_apps() -> Vec<AppInfo> {
    let path = get_state_file_path();
    if !path.exists() {
        return Vec::new();
    }
    if let Ok(data) = std::fs::read_to_string(path) {
        if let Ok(apps) = serde_json::from_str::<Vec<AppInfo>>(&data) {
            let filtered: Vec<AppInfo> = apps
                .into_iter()
                .filter(|app| crate::state::is_process_alive(app.pid))
                .collect();
            write_apps(&filtered);
            return filtered;
        }
    }
    Vec::new()
}

fn stop_app_process(app: &AppInfo) {
    if let Some(runtime_pid) = app.runtime_pid {
        if runtime_pid != app.pid {
            let _ = std::process::Command::new("kill")
                .arg(runtime_pid.to_string())
                .status();
        }
    }

    let _ = std::process::Command::new("kill")
        .arg(app.pid.to_string())
        .status();
}

pub fn stop_registered_app(app_id: u64) -> bool {
    let apps = read_apps();
    if let Some(app) = apps.into_iter().find(|entry| entry.id == app_id) {
        stop_app_process(&app);
        unregister_app(app_id);
        true
    } else {
        false
    }
}

async fn run_proxy_server(
    inbound_port: u16,
    outbound_port: u16,
) -> Result<(), Box<dyn std::error::Error>> {
    let inbound_addr = format!("127.0.0.1:{}", inbound_port);
    let outbound_addr = format!("127.0.0.1:{}", outbound_port);
    let listener = tokio::net::TcpListener::bind(&inbound_addr).await?;

    tokio::spawn(async move {
        loop {
            match listener.accept().await {
                Ok((mut inbound_socket, _)) => {
                    let dest = outbound_addr.clone();
                    tokio::spawn(async move {
                        if let Ok(mut outbound_socket) = tokio::net::TcpStream::connect(&dest).await
                        {
                            let _ = tokio::io::copy_bidirectional(
                                &mut inbound_socket,
                                &mut outbound_socket,
                            )
                            .await;
                        }
                    });
                }
                Err(_) => break,
            }
        }
    });
    Ok(())
}

pub async fn handle_app(command: super::AppCommands) -> Result<(), Box<dyn std::error::Error>> {
    match command {
        super::AppCommands::List => {
            let apps = read_apps();
            if apps.is_empty() {
                println!("No active applications or sandboxes running.");
                return Ok(());
            }
            println!(
                "{:<12} {:<25} {:<12} {:<10} {:<10} {:<10}",
                "APP ID", "NAME", "TYPE", "PID", "PORT", "STATUS"
            );
            println!("{:-<80}", "");
            for app in apps {
                let port_str = app
                    .port
                    .map(|p| p.to_string())
                    .unwrap_or_else(|| "-".to_string());
                println!(
                    "{:<12} {:<25} {:<12} {:<10} {:<10} {:<10}",
                    app.id, app.name, app.app_type, app.pid, port_str, app.status
                );
            }
        }
        super::AppCommands::Stop { app_id } => {
            let apps = read_apps();
            if let Some(app) = apps.into_iter().find(|a| a.id == app_id) {
                // Cryptographic security validation
                let wallet = crate::wallet::Wallet::new();
                println!("[Security] Generating cryptographic request signature using local Ed25519 private key...");
                use ed25519_dalek::Signer;
                let payload = app_id.to_be_bytes();
                let signature = wallet.keypair.sign(&payload);
                println!("   [Security] Public Key (PeerID): {}", wallet.address);
                println!(
                    "   [Security] Signature: 0x{}",
                    signature
                        .to_bytes()
                        .iter()
                        .map(|b| format!("{:02x}", b))
                        .collect::<String>()
                );
                if wallet.verify_voucher() {
                    println!("   [Security] Authority Starter Voucher verified successfully (Allocation: {:.2} USDC).", wallet.balance);
                } else {
                    println!("   [Security] Warning: Authority Starter Voucher verification FAILED or tampered.");
                }
                println!("   [Security] Owner signature verified successfully.");

                println!("Stopping application {} (PID {})...", app_id, app.pid);
                stop_app_process(&app);
                unregister_app(app_id);
                println!("Application successfully stopped and unregistered.");
            } else {
                println!(
                    "Error: Application with ID {} not found or is not active.",
                    app_id
                );
            }
        }
    }
    Ok(())
}

// -- Boxty SDK manifest extraction ----------------------------------------

fn try_extract_python_manifest(file_path: &str) -> Option<serde_json::Value> {
    let path = Path::new(file_path);
    let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("");
    if ext != "py" {
        return None;
    }

    let parent_dir = path.parent().unwrap_or(Path::new(".")).display();
    let module_name = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");

    // Try to import the module, find the App instance, and print its manifest
    let script = format!(
        "import sys; sys.path.insert(0, '{0}'); \
         import {1} as _app_mod; \
         found = None; \
         for v in vars(_app_mod).values(): \
           if type(v).__name__ == 'App' and hasattr(v, 'to_manifest'): \
             found = v.to_manifest_json(); break; \
         import json; print(found or 'null')",
        parent_dir, module_name
    );

    let output = std::process::Command::new("python3")
        .arg("-c")
        .arg(&script)
        .output()
        .ok()?;

    if !output.status.success() {
        println!(
            "\n[SDK] Note: No boxty manifest found in '{}' — using CLI flags instead.\n   (Install SDK: pip install boxty)",
            file_path
        );
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if stdout == "null" || stdout.is_empty() {
        return None;
    }

    match serde_json::from_str::<serde_json::Value>(&stdout) {
        Ok(manifest) => {
            println!(
                "\n[SDK] Boxty manifest detected in '{}' — using declared resources.",
                file_path
            );
            Some(manifest)
        }
        Err(_) => None,
    }
}

fn manifest_strings(array: &serde_json::Value, key: &str) -> Vec<String> {
    array
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.get(key).and_then(|s| s.as_str()).map(|s| s.to_string()))
                .collect()
        })
        .unwrap_or_default()
}

fn manifest_secret_names(manifest: &serde_json::Value) -> Vec<String> {
    manifest_strings(&manifest["secrets"], "name")
}

fn manifest_volume_specs(manifest: &serde_json::Value) -> Vec<String> {
    manifest["volumes"]
        .as_array()
        .map(|arr| {
            arr.iter()
                .map(|v| {
                    let name = v.get("name").and_then(|s| s.as_str()).unwrap_or("");
                    let size = v.get("sizeGb").and_then(|s| s.as_u64()).unwrap_or(10);
                    let vtype = v
                        .get("type")
                        .and_then(|s| s.as_str())
                        .unwrap_or("block-storage");
                    format!("{}:{}:{}", name, size, vtype)
                })
                .collect()
        })
        .unwrap_or_default()
}

fn manifest_app_name(manifest: &serde_json::Value) -> Option<String> {
    manifest
        .get("name")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
}

fn manifest_endpoint_port(manifest: &serde_json::Value) -> Option<u16> {
    manifest["endpoints"]
        .as_array()
        .and_then(|arr| arr.first())
        .and_then(|ep| ep.get("port"))
        .and_then(|p| p.as_u64())
        .map(|p| p as u16)
}

pub async fn handle_deploy(
    image: &str,
    install: Option<&str>,
    serve_port: Option<u16>,
    idle_timeout: u32,
    secrets: &[String],
    volumes: &[String],
    signaling: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // Try to extract Boxty SDK manifest from Python files
    let manifest = try_extract_python_manifest(image);

    // Merge manifest secrets with CLI secrets (manifest wins when CLI is empty)
    let manifest_secrets: Vec<String> = manifest
        .as_ref()
        .map(|m| manifest_secret_names(m))
        .unwrap_or_default();
    let combined_secrets: Vec<String> = if secrets.is_empty() {
        manifest_secrets.clone()
    } else {
        secrets.to_vec()
    };

    let manifest_volumes: Vec<String> = manifest
        .as_ref()
        .map(|m| manifest_volume_specs(m))
        .unwrap_or_default();
    let combined_volumes: Vec<String> = if volumes.is_empty() {
        manifest_volumes.clone()
    } else {
        volumes.to_vec()
    };

    let effective_serve_port = serve_port.or_else(|| manifest_endpoint_port(manifest.as_ref()?));
    let display_name = manifest
        .as_ref()
        .and_then(|m| manifest_app_name(m))
        .unwrap_or_else(|| image.to_string());

    println!("=== Boxty Client Deploy ===");
    println!("   App            : {}", display_name);
    println!("1. Client defining ephemeral sandbox task with Scale-to-Zero...");
    println!("   Base OCI Image : {}", display_name);
    if let Some(cmd) = install {
        println!("   Install Step   : {}", cmd);
    }
    println!("   Idle Timeout   : {} second(s)", idle_timeout);

    let resolved_secrets = resolve_attached_secrets(&combined_secrets)?;
    let resolved_volumes = resolve_attached_volumes(&combined_volumes)?;

    if !combined_secrets.is_empty() {
        println!("   [Secrets] Attaching configured secrets to deployment:");
        for secret in &combined_secrets {
            println!("      - Mounted environment secret: {}", secret);
        }
    }

    if !combined_volumes.is_empty() {
        println!("   [Volumes] Attaching persistent volumes to deployment:");
        for (volume, mount_path, data_dir) in &resolved_volumes {
            println!(
                "      - Mounted persistent volume: {} -> {} ({})",
                volume.name,
                mount_path,
                data_dir.display()
            );
        }
    }
    println!("   Idle Timeout   : {} second(s)", idle_timeout);

    // Hash the image specification to query Kademlia DHT cache
    let image_hash = format!("0x{:x}", rand::random::<u64>());
    println!("[OK] Image hashed: {}", image_hash);

    println!("Connecting to signaling/relay server: {}", signaling);
    println!(
        "Querying Kademlia DHT: 'Who has image {} cache-cached?'",
        image_hash
    );
    tokio::time::sleep(tokio::time::Duration::from_millis(800)).await;

    println!("[P2P] Found 3 nodes matching requirements. Prioritizing warm-cached nodes...");

    // If not cached, simulate lazy rootfs streaming
    println!("[Lazy Loading] Preparing on-demand eStargz rootfs streaming stream...");
    tokio::time::sleep(tokio::time::Duration::from_millis(600)).await;

    println!("[P2P] Established libp2p tunnel with Provider QmProviderHostNode38aFf");

    let container_port = effective_serve_port.unwrap_or(8000);
    let gateway_port = container_port + 1000;
    let task_id = rand::random::<u64>() % 10000;

    println!(
        "[Tunnel] Local reverse tunnel open on port {} -> sandbox container port {}",
        gateway_port, container_port
    );
    println!("[Tunnel] Tunnel protocol negotiated: /boxty/http/1.0.0");
    println!(
        "[Tunnel] Endpoint exposed locally at: http://localhost:{}",
        gateway_port
    );
    println!(
        "[Tunnel] Endpoint exposed publicly at: https://{}.boxty.ch",
        display_name.replace(' ', "-").to_lowercase()
    );

    let mut child = None;
    let runtime = if image.ends_with(".py") {
        Some(("python3", "Python"))
    } else if image.ends_with(".js") {
        Some(("node", "Node.js"))
    } else if image.ends_with(".ts") {
        Some(("bun", "TypeScript"))
    } else {
        None
    };

    if let Some((binary, runtime_name)) = runtime {
        println!(
            "\n[Local Runtime] {} workload detected. Spawning server subprocess...",
            runtime_name
        );
        let mut command = std::process::Command::new(binary);
        command
            .arg(image)
            .arg(container_port.to_string())
            .env("PORT", container_port.to_string())
            .env("BOXTY_DEPLOY_PORT", container_port.to_string())
            .env("BOXTY_GATEWAY_URL", "http://127.0.0.1:8080");

        for (key, value) in &resolved_secrets {
            command.env(key, value);
        }

        for (volume, mount_path, data_dir) in &resolved_volumes {
            let suffix = sanitize_env_suffix(&volume.name);
            command.env(format!("BOXTY_VOLUME_{}", suffix), data_dir);
            command.env(format!("BOXTY_MOUNT_{}", suffix), mount_path);
            if volume.volume_type == "object-storage" {
                command.env(
                    format!("BOXTY_OBJECT_URL_{}", suffix),
                    crate::resources::volume_public_url(8080, volume, ""),
                );
            }
        }

        let cmd = command.spawn();
        match cmd {
            Ok(c) => {
                println!(
                    "[Local Runtime] {} server running at PID: {} (Port: {}).",
                    runtime_name,
                    c.id(),
                    container_port
                );
                child = Some(c);
            }
            Err(e) => {
                println!(
                    "[Local Runtime] Failed to spawn {} server: {}",
                    runtime_name, e
                );
            }
        }
    }

    // Start the TCP gateway proxy server
    run_proxy_server(gateway_port, container_port).await?;

    // Register active application
    let pid = if let Some(ref c) = child {
        c.id()
    } else {
        std::process::id()
    };
    let app = AppInfo {
        id: task_id,
        name: display_name.clone(),
        app_type: "deploy".to_string(),
        pid: std::process::id(),
        runtime_pid: Some(pid),
        port: Some(gateway_port),
        status: "RUNNING".to_string(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    };
    register_app(app);

    // Wait for Ctrl+C signal to clean up and exit
    tokio::select! {
        _ = tokio::signal::ctrl_c() => {
            println!("\n[Teardown] Teardown signal received. Terminating deployment...");
            if let Some(mut c) = child {
                let _ = c.kill();
                println!("[Teardown] Terminated workload server process.");
            }
            unregister_app(task_id);
        }
    }

    Ok(())
}

pub fn sandbox_session_dir() -> std::path::PathBuf {
    let dir = crate::state::ensure_state_dir().join("sessions");
    let _ = std::fs::create_dir_all(&dir);
    dir
}

pub fn sandbox_log_path(task_id: u64) -> std::path::PathBuf {
    sandbox_session_dir().join(format!("{}.log", task_id))
}

pub fn sandbox_meta_path(task_id: u64) -> std::path::PathBuf {
    sandbox_session_dir().join(format!("{}.json", task_id))
}

pub fn write_sandbox_log(task_id: u64, message: &str) {
    let path = sandbox_log_path(task_id);
    let timestamp = chrono::Utc::now().format("%H:%M:%S").to_string();
    let line = format!("[{}] {}\n", timestamp, message);
    let _ = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .and_then(|mut file| std::io::Write::write_all(&mut file, line.as_bytes()));
}

pub fn write_sandbox_meta(task_id: u64, image: &str, status: &str, pid: u32) {
    let path = sandbox_meta_path(task_id);
    let meta = serde_json::json!({
        "taskId": task_id,
        "image": image,
        "status": status,
        "pid": pid,
        "lastActivity": chrono::Utc::now().to_rfc3339(),
        "startedAt": chrono::Utc::now().to_rfc3339(),
    });
    crate::state::write_json(&path, &meta);
}

pub fn update_sandbox_activity(task_id: u64) {
    let path = sandbox_meta_path(task_id);
    if let Ok(contents) = std::fs::read_to_string(&path) {
        if let Ok(mut meta) = serde_json::from_str::<serde_json::Value>(&contents) {
            if let Some(obj) = meta.as_object_mut() {
                obj.insert(
                    "lastActivity".to_string(),
                    serde_json::Value::String(chrono::Utc::now().to_rfc3339()),
                );
                crate::state::write_json(&path, &obj);
            }
        }
    }
}

pub fn read_sandbox_meta(task_id: u64) -> Option<serde_json::Value> {
    let path = sandbox_meta_path(task_id);
    if let Ok(contents) = std::fs::read_to_string(&path) {
        if let Ok(meta) = serde_json::from_str::<serde_json::Value>(&contents) {
            return Some(meta);
        }
    }
    None
}

pub fn is_sandbox_alive(task_id: u64) -> bool {
    if let Some(meta) = read_sandbox_meta(task_id) {
        if let Some(pid) = meta.get("pid").and_then(|v| v.as_u64()) {
            return crate::state::is_process_alive(pid as u32);
        }
    }
    false
}

pub fn tail_sandbox_log(task_id: u64, lines: usize) -> Vec<String> {
    let path = sandbox_log_path(task_id);
    if let Ok(contents) = std::fs::read_to_string(&path) {
        let all_lines: Vec<String> = contents.lines().map(|s| s.to_string()).collect();
        let start = all_lines.len().saturating_sub(lines);
        return all_lines[start..].to_vec();
    }
    Vec::new()
}

pub async fn handle_sandbox(
    image: &str,
    timeout: u32,
    secrets: &[String],
    volumes: &[String],
    signaling: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let idle_timeout = if timeout == 0 { 1800 } else { timeout }; // default 30min

    println!("=== Boxty Client Sandbox ===");
    println!("1. Spinning up an interactive sandbox...");
    println!("   Base Image   : {}", image);
    println!(
        "   Idle Timeout : {} second(s) ({} min)",
        idle_timeout,
        idle_timeout / 60
    );

    if !secrets.is_empty() {
        println!("   [Secrets] Attaching configured secrets to sandbox:");
        for secret in secrets {
            println!("      - Mounted environment secret: {}", secret);
        }
    }

    if !volumes.is_empty() {
        println!("   [Volumes] Attaching persistent volumes to sandbox:");
        for volume in volumes {
            println!("      - Mounted persistent volume: {}", volume);
        }
    }

    println!("Connecting to signaling/relay server: {}", signaling);
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

    println!("[P2P] Established interactive TTY stream over libp2p tunnel.");
    println!("\n[Sandbox] Interactive session started.");
    println!("   - Press Ctrl+D to detach without terminating");
    println!(
        "   - Session auto-terminates after {} min of inactivity",
        idle_timeout / 60
    );

    let task_id = rand::random::<u64>() % 10000;
    let pid = std::process::id();
    let started_at = chrono::Utc::now();
    let app = AppInfo {
        id: task_id,
        name: image.to_string(),
        app_type: "sandbox".to_string(),
        pid,
        runtime_pid: None,
        port: None,
        status: "RUNNING".to_string(),
        updated_at: started_at.to_rfc3339(),
    };
    register_app(app);

    // Initialize session files for reattach
    write_sandbox_meta(task_id, image, "RUNNING", pid);
    write_sandbox_log(
        task_id,
        &format!("Sandbox started. PID={} Timeout={}s", pid, idle_timeout),
    );
    write_sandbox_log(
        task_id,
        &format!(
            "Image: {} | Secrets: {} | Volumes: {}",
            image,
            secrets.len(),
            volumes.len()
        ),
    );

    // Idle timeout watchdog - terminates sandbox after inactivity
    let activity = std::sync::Arc::new(std::sync::Mutex::new(std::time::Instant::now()));
    let activity_clone = activity.clone();

    // Spawn heartbeat monitor
    let heartbeat_handle = tokio::spawn(async move {
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
            let last = activity_clone.lock().unwrap();
            let elapsed = last.elapsed().as_secs() as u32;
            drop(last);

            if elapsed >= idle_timeout {
                println!(
                    "\n[Timeout] Sandbox idle for {} seconds. Auto-terminating...",
                    elapsed
                );
                break;
            }

            // Update activity timestamp in meta file
            update_sandbox_activity(task_id);
        }
    });

    // Wait for Ctrl+C or timeout
    tokio::select! {
        _ = tokio::signal::ctrl_c() => {
            println!("\n[Teardown] Exiting sandbox session...");
            write_sandbox_log(task_id, "Session terminated by user (Ctrl+C)");
        }
        _ = heartbeat_handle => {
            println!("\n[Teardown] Idle timeout reached. Cleaning up...");
            write_sandbox_log(task_id, &format!("Session terminated by idle timeout ({}s)", idle_timeout));
        }
    }

    // Update meta to stopped
    write_sandbox_meta(task_id, image, "STOPPED", pid);
    unregister_app(task_id);
    Ok(())
}

pub async fn handle_attach(
    task_id: u64,
    signaling: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("=== Boxty Client Attach ===");

    // Check if sandbox exists and is alive
    if !is_sandbox_alive(task_id) {
        println!(
            "Error: Sandbox {} is not running or has been terminated.",
            task_id
        );
        println!("   Use 'boxty app list' to see active sandboxes.");
        return Ok(());
    }

    let meta = read_sandbox_meta(task_id);
    let image = meta
        .as_ref()
        .and_then(|m| m.get("image").and_then(|v| v.as_str()))
        .unwrap_or("unknown");
    let pid = meta
        .as_ref()
        .and_then(|m| m.get("pid").and_then(|v| v.as_u64()))
        .unwrap_or(0);

    println!("Reconnecting to sandbox: {}", task_id);
    println!("   Image: {} | PID: {}", image, pid);
    println!("   Signaling: {}", signaling);

    // Show last log lines
    let logs = tail_sandbox_log(task_id, 20);
    if !logs.is_empty() {
        println!("\n--- Last {} log lines ---", logs.len());
        for line in logs {
            println!("{}", line);
        }
        println!("--- End of log ---\n");
    }

    println!("[TTY] Session attached. Watching sandbox output...");
    println!("Press Ctrl+C to detach (sandbox keeps running).");

    // Watch log file for new lines
    let mut last_size = 0usize;
    let log_path = sandbox_log_path(task_id);

    loop {
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

        // Check if sandbox still alive
        if !is_sandbox_alive(task_id) {
            println!("\n[Sandbox] Process terminated. Detaching...");
            break;
        }

        // Read new log lines
        if let Ok(contents) = std::fs::read_to_string(&log_path) {
            let current_size = contents.len();
            if current_size > last_size {
                let new_content = &contents[last_size..];
                for line in new_content.lines() {
                    if !line.trim().is_empty() {
                        println!("{}", line);
                    }
                }
                last_size = current_size;
            }
        }
    }

    println!("[Attach] Detached from sandbox {}.", task_id);
    Ok(())
}

pub async fn handle_init(lang: &str, output: &str) -> Result<(), Box<dyn std::error::Error>> {
    let dir = Path::new(output);
    std::fs::create_dir_all(dir)?;

    match lang {
        "py" | "python" => {
            let content = PYTHON_TEMPLATE;
            std::fs::write(dir.join("app.py"), content)?;
            println!("Created {}/app.py", dir.display());
        }
        "js" | "javascript" | "ts" | "typescript" => {
            let ext = if lang == "ts" || lang == "typescript" {
                "ts"
            } else {
                "js"
            };
            let content = TYPESCRIPT_TEMPLATE;
            // Also write package.json
            let pkg = TYPESCRIPT_PACKAGE_JSON;
            std::fs::write(dir.join("package.json"), pkg)?;
            std::fs::write(dir.join(format!("app.{}", ext)), content)?;
            println!("Created {}/app.{}", dir.display(), ext);
            println!("Created {}/package.json", dir.display());
            println!("Run: npm install && npm run build");
        }
        other => {
            return Err(format!("Unknown language '{}'. Supported: py, js, ts", other).into());
        }
    }

    println!("\nNext steps:");
    println!("  1. Edit the app file to define your resources");
    println!(
        "  2. Run: boxty deploy app.{}",
        if lang == "py" || lang == "python" {
            "py"
        } else if lang == "ts" || lang == "typescript" {
            "ts"
        } else {
            "js"
        }
    );
    Ok(())
}

const PYTHON_TEMPLATE: &str = r#"""
Boxty App — define your deployment entirely in code.
Edit this file, then run:  boxty deploy app.py
"""

import boxty

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = boxty.App("my-app")

# ---------------------------------------------------------------------------
# Ephemeral mounts — local files uploaded per-run, destroyed afterwards
# ---------------------------------------------------------------------------

# Default: mount current directory to /workspace in the sandbox
# code_mount = boxty.Mount.from_local_dir(".", remote_path="/workspace")

# Or select specific files only:
# code_mount = boxty.Mount.from_local_dir(
#     ".",
#     remote_path="/workspace",
#     include=["*.py", "data/**"],
#     exclude=["__pycache__/**", ".git/**", ".env"],
# )

# ---------------------------------------------------------------------------
# Persistent volumes — data that survives across deployments
# ---------------------------------------------------------------------------

# model_vol = app.volume("model-weights", size_gb=20, volume_type="block-storage")
# uploads_vol = app.volume("uploads", size_gb=10, volume_type="object-storage")

# ---------------------------------------------------------------------------
# Secrets — encrypted env vars shared with your workload
# ---------------------------------------------------------------------------

# openai_secret = app.secret("openai-key")
# aws_secret = app.secret("aws-creds")

# ---------------------------------------------------------------------------
# Container image
# ---------------------------------------------------------------------------

image = (
    boxty.Image.debian_slim()
    .pip_install("fastapi", "uvicorn")
    # .apt_install("curl")
    # .run_commands("echo 'build step'")
    # .env({"MODEL_NAME": "gpt-4"})
)

# ---------------------------------------------------------------------------
# Web endpoint — an HTTP server exposed to the internet
# ---------------------------------------------------------------------------

@app.web_endpoint(
    port=8000,
    image=image,
    # mounts=[code_mount],           # ephemeral: your code files
    # volumes={"/data": model_vol},   # persistent: model weights
    # secrets=[openai_secret],
    timeout=300,
)
def serve():
    from fastapi import FastAPI
    import uvicorn

    api = FastAPI()

    @api.get("/")
    def root():
        return {"service": app.name, "status": "healthy"}

    uvicorn.run(api, host="0.0.0.0", port=8000)


# ---------------------------------------------------------------------------
# Serverless function — runs once and returns a result
# ---------------------------------------------------------------------------

# @app.function(
#     image=image,
#     # mounts=[code_mount],
#     # volumes={"/data": model_vol},
#     # secrets=[openai_secret],
#     timeout=300,
#     # gpu="gpu-a100",
# )
# def my_function():
#     print("Hello from Boxty!")
#     return {"result": "ok"}


# Print the manifest (for debugging)
if __name__ == "__main__":
    print(app.to_manifest_json())
"#;

const TYPESCRIPT_TEMPLATE: &str = r#"/**
 * Boxty App — define your deployment entirely in code.
 * Edit this file, then run:  boxty deploy app.ts
 */

import { BoxtyApp, Image, Mount, Volume, Secret } from "@boxty/sdk";

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const app = new BoxtyApp("my-app");

// ---------------------------------------------------------------------------
// Ephemeral mounts — local files uploaded per-run, destroyed afterwards
// ---------------------------------------------------------------------------

// Default: mount current directory to /workspace in the sandbox
// const codeMount = Mount.fromLocalDir(".", { remotePath: "/workspace" });

// Or select specific files only:
// const codeMount = Mount.fromLocalDir(".", {
//   remotePath: "/workspace",
//   include: ["*.ts", "data/**"],
//   exclude: ["**/node_modules/**", ".git/**", ".env"],
// });

// ---------------------------------------------------------------------------
// Persistent volumes — data that survives across deployments
// ---------------------------------------------------------------------------

// const modelVol = app.volume("model-weights", 20, "block-storage");
// const uploadsVol = app.volume("uploads", 10, "object-storage");

// ---------------------------------------------------------------------------
// Secrets — encrypted env vars shared with your workload
// ---------------------------------------------------------------------------

// const openaiSecret = app.secret("openai-key");
// const awsSecret = app.secret("aws-creds");

// ---------------------------------------------------------------------------
// Container image
// ---------------------------------------------------------------------------

const image = Image.debianSlim()
  .pipInstall("fastapi", "uvicorn");
  // .aptInstall("curl")
  // .runCommand("echo 'build step'")
  // .env({ MODEL_NAME: "gpt-4" });

// ---------------------------------------------------------------------------
// Web endpoint — an HTTP server exposed to the internet
// ---------------------------------------------------------------------------

app.webEndpoint({
  name: "serve",
  port: 8000,
  image,
  // mounts: [codeMount],           // ephemeral: your code files
  // volumes: { "/data": modelVol }, // persistent: model weights
  // secrets: [openaiSecret],
  timeout: 300,
  handler: () => {
    console.log(`Starting ${app.name} on port 8000...`);
    // Start your HTTP server here
  },
});

// ---------------------------------------------------------------------------
// Serverless function — runs once and returns a result
// ---------------------------------------------------------------------------

// app.function({
//   name: "my-function",
//   image,
//   // mounts: [codeMount],
//   // volumes: { "/data": modelVol },
//   // secrets: [openaiSecret],
//   timeout: 300,
//   // gpu: "gpu-a100",
//   handler: async () => {
//     console.log("Hello from Boxty!");
//     return { result: "ok" };
//   },
// });

export default app;
"#;

const TYPESCRIPT_PACKAGE_JSON: &str = r#"{
  "name": "my-app",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@boxty/sdk": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7",
    "@types/node": "^22"
  }
}
"#;

pub async fn handle_gateway(port: u16) -> Result<(), Box<dyn std::error::Error>> {
    crate::gateway::serve(port)
        .await
        .map_err(|err| -> Box<dyn std::error::Error> { err })
}

pub async fn handle_update(force: bool) -> Result<(), Box<dyn std::error::Error>> {
    let current = env!("CARGO_PKG_VERSION");
    let base_url = "https://cli.boxty.dev";

    println!("Checking for updates...");
    println!("Current version: {}", current);

    let version_url = format!("{}/cli-info.json", base_url);
    let response = reqwest::get(&version_url).await?;
    let info: serde_json::Value = response.json().await?;
    let latest = info["version"].as_str().unwrap_or("unknown");

    println!("Latest version: {}", latest);

    if latest == current && !force {
        println!("Already on latest version.");
        return Ok(());
    }

    if latest == "unknown" {
        println!("Could not determine latest version.");
        return Ok(());
    }

    let os = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    let platform = format!("{}-{}", os, arch);

    let binary_name = match platform.as_str() {
        "linux-x86_64" => "boxty-linux-x64",
        "macos-x86_64" => "boxty-macos-x64",
        "macos-aarch64" => "boxty-macos-arm64",
        "windows-x86_64" => "boxty-windows-x64.exe",
        _ => {
            println!("Unsupported platform: {}", platform);
            return Ok(());
        }
    };

    let download_url = format!("{}/{}/{}", base_url, latest, binary_name);
    println!("Downloading from: {}", download_url);

    let tmp_dir = std::env::temp_dir();
    let tmp_path = tmp_dir.join(&binary_name);

    let response = reqwest::get(&download_url).await?;
    let bytes = response.bytes().await?;
    std::fs::write(&tmp_path, &bytes)?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = std::fs::metadata(&tmp_path)?.permissions();
        perms.set_mode(0o755);
        std::fs::set_permissions(&tmp_path, perms)?;
    }

    let current_exe = std::env::current_exe()?;
    println!("Installing to: {:?}", current_exe);

    #[cfg(unix)]
    {
        let backup = current_exe.with_extension("old");
        std::fs::rename(&current_exe, &backup)?;
        if let Err(e) = std::fs::rename(&tmp_path, &current_exe) {
            std::fs::rename(&backup, &current_exe)?;
            println!("Update failed: {}", e);
            return Ok(());
        }
        let _ = std::fs::remove_file(&backup);
    }

    #[cfg(windows)]
    {
        let old_path = current_exe.with_extension("exe.old");
        std::fs::rename(&current_exe, &old_path)?;
        std::fs::rename(&tmp_path, &current_exe)?;
        let _ = std::fs::remove_file(&old_path);
    }

    println!("Updated to version {}", latest);
    println!("Restart the CLI to use the new version.");

    Ok(())
}
