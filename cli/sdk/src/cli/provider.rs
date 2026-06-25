use crate::tui::dashboard;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Auto-detected system resources
pub struct SystemResources {
    pub cpu_cores: u32,
    pub ram_mb: f64,
    pub disk_gb: u32,
}

#[allow(dead_code)]
pub struct ProviderConfig {
    pub tier: String,
    pub disk_gb: u32,
    pub shared_cores: u32,
    pub shared_ram_gb: f64,
}

/// Tier definitions: name, (cpu_cores_per_instance, ram_mb_per_instance)
const TIERS: &[(&str, u32, f64)] = &[
    ("nano", 1, 1024.0),
    ("micro", 2, 2048.0),
    ("standard", 2, 4096.0),
    ("pro", 4, 8192.0),
    ("max", 8, 16384.0),
];

/// Detect system resources on Linux or macOS
pub fn detect_resources() -> SystemResources {
    let cpu = detect_cpu_cores();
    let ram = detect_ram_mb();
    let disk = detect_disk_gb();
    SystemResources {
        cpu_cores: cpu,
        ram_mb: ram,
        disk_gb: disk,
    }
}

fn detect_cpu_cores() -> u32 {
    #[cfg(target_os = "linux")]
    {
        if let Ok(output) = std::process::Command::new("nproc").output() {
            if let Ok(s) = String::from_utf8(output.stdout) {
                return s.trim().parse().unwrap_or(2);
            }
        }
    }
    #[cfg(target_os = "macos")]
    {
        if let Ok(output) = std::process::Command::new("sysctl")
            .args(["-n", "hw.ncpu"])
            .output()
        {
            if let Ok(s) = String::from_utf8(output.stdout) {
                return s.trim().parse().unwrap_or(2);
            }
        }
    }
    2
}

fn detect_ram_mb() -> f64 {
    #[cfg(target_os = "linux")]
    {
        if let Ok(contents) = std::fs::read_to_string("/proc/meminfo") {
            for line in contents.lines() {
                if line.starts_with("MemTotal:") {
                    let kb: f64 = line
                        .split_whitespace()
                        .nth(1)
                        .and_then(|v| v.parse().ok())
                        .unwrap_or(0.0);
                    return kb / 1024.0; // KB -> MB
                }
            }
        }
    }
    #[cfg(target_os = "macos")]
    {
        if let Ok(output) = std::process::Command::new("sysctl")
            .args(["-n", "hw.memsize"])
            .output()
        {
            if let Ok(s) = String::from_utf8(output.stdout) {
                let bytes: f64 = s.trim().parse().unwrap_or(0.0);
                return bytes / (1024.0 * 1024.0); // bytes -> MB
            }
        }
    }
    1024.0
}

fn detect_disk_gb() -> u32 {
    let cwd = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("/"));
    if let Ok(output) = std::process::Command::new("df")
        .arg("-BG")
        .arg(&cwd)
        .output()
    {
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines().skip(1) {
            let cols: Vec<&str> = line.split_whitespace().collect();
            if cols.len() >= 4 {
                let avail = cols[3].trim_end_matches('G');
                if let Ok(gb) = avail.parse::<u32>() {
                    if gb > 0 {
                        return gb;
                    }
                }
            }
        }
    }
    // Fallback: try `df -k` and convert
    if let Ok(output) = std::process::Command::new("df")
        .arg("-k")
        .arg(cwd.to_str().unwrap_or("/"))
        .output()
    {
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines().skip(1) {
            let cols: Vec<&str> = line.split_whitespace().collect();
            if cols.len() >= 4 {
                if let Ok(kb) = cols[3].parse::<u32>() {
                    return kb / (1024 * 1024); // KB -> GB
                }
            }
        }
    }
    20
}

/// Pick the best tier that fits within the detected resources
fn calculate_tier(detected: &SystemResources) -> (&'static str, u32, f64) {
    for &(name, cpu, ram) in TIERS.iter().rev() {
        if detected.cpu_cores >= cpu && detected.ram_mb >= ram {
            return (name, cpu, ram);
        }
    }
    TIERS[0]
}

/// How many instances of this tier can we run concurrently?
fn max_instances(detected: &SystemResources, tier_cpu: u32, tier_ram_mb: f64) -> u32 {
    let by_cpu = detected.cpu_cores / tier_cpu.max(1);
    let by_ram = (detected.ram_mb / tier_ram_mb.max(1.0)) as u32;
    let by_disk = detected.disk_gb / 2; // Reserve 2 GB per instance for ephemeral FS
    by_cpu.min(by_ram).min(by_disk).max(1)
}

pub async fn handle_provider(
    tier_opt: Option<&str>,
    disk_opt: Option<u32>,
    instances_opt: Option<u32>,
    signaling: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // 0. Bootstrap libp2p — get our PeerId and NAT status
    let p2p = crate::network::P2PNode::new();
    let bootstrap = p2p.bootstrap().await?;
    println!("\n[P2P] Node identity:");
    println!("   PeerId      : {}", bootstrap.peer_id);
    println!("   Multiaddr   : {}", bootstrap.multiaddr);
    println!(
        "   NAT Status  : {}",
        if bootstrap.is_public {
            "PUBLIC — relay + endpoint capable"
        } else {
            "PRIVATE — compute only, reachable via circuit relay"
        }
    );

    // 1. Auto-detect system resources
    let detected = detect_resources();
    println!("\n[Auto-Detect] System Resources:");
    println!("   CPU Cores : {}", detected.cpu_cores);
    println!(
        "   RAM       : {:.1} MB ({:.1} GB)",
        detected.ram_mb,
        detected.ram_mb / 1024.0
    );
    println!("   Disk      : {} GB", detected.disk_gb);

    // 2. Determine tier (CLI overrides auto-detect)
    let (tier_name, tier_cpu, tier_ram_mb) = if let Some(tier) = tier_opt {
        let t = tier.to_lowercase();
        match TIERS.iter().find(|&&(name, _, _)| name == t) {
            Some(&(name, cpu, ram)) => {
                println!(
                    "\n[Tier] Manual override: {} ({} CPU, {:.0} MB RAM per instance)",
                    name, cpu, ram
                );
                (name, cpu, ram)
            }
            None => {
                println!(
                    "\n[Tier] Unknown tier '{}' — falling back to auto-detect",
                    tier
                );
                calculate_tier(&detected)
            }
        }
    } else {
        let (name, cpu, ram) = calculate_tier(&detected);
        println!(
            "\n[Tier] Auto-selected: {} ({} CPU, {:.0} MB RAM per instance)",
            name, cpu, ram
        );
        (name, cpu, ram)
    };

    // 3. Determine max instances
    let max = max_instances(&detected, tier_cpu, tier_ram_mb);
    let instances = instances_opt.unwrap_or(max);
    let actual_instances = instances.min(max);
    if instances > max {
        println!(
            "\n[Warning] Requested {} instances but system can only support {}. Limiting to {}.",
            instances, max, actual_instances
        );
    }
    println!(
        "   Max Instances : {} (requested: {})",
        actual_instances, instances
    );

    // 4. Disk allocation
    let disk = disk_opt.unwrap_or(2); // 2 GB per instance default
    let total_disk = disk * actual_instances;
    let total_cores = tier_cpu * actual_instances;
    let total_ram = tier_ram_mb * (actual_instances as f64);

    // 5. Ensure wallet exists
    let wallet = crate::wallet::Wallet::new();
    let wallet_address = wallet.address.clone();
    println!("\n[Wallet] Provider wallet: {}", wallet_address);
    println!("   Balance: {:.2} USDC", wallet.get_balance());

    // 6. Build and persist provider state
    let now = chrono::Utc::now().to_rfc3339();
    let provider_state = crate::state::ProviderState {
        pid: std::process::id(),
        tier: tier_name.to_string(),
        disk_gb: total_disk,
        instances: actual_instances,
        shared_cpu: total_cores,
        shared_ram_mb: total_ram,
        signaling: signaling.to_string(),
        status: "ACTIVE".to_string(),
        started_at: now.clone(),
        last_updated_at: now.clone(),
        provider_id: String::new(),
        provider_auth_token: String::new(),
        mode: "provider".to_string(),
        control_plane_url: String::new(),
        provider_pool: "p2p".to_string(),
        region: String::new(),
        last_error: String::new(),
        detected_cpu: detected.cpu_cores,
        detected_ram_mb: detected.ram_mb,
        detected_disk_gb: detected.disk_gb,
        wallet_address: wallet_address.clone(),
        max_instances: max,
        active_jobs: 0,
        jobs: Vec::new(),
    };
    let provider_path = crate::state::provider_path();
    crate::state::write_json(&provider_path, &provider_state);

    // 7. Publish to fleet via PeerId (no hostname, no DNS per provider needed)
    let fleet_entry = crate::state::FleetEntry {
        wallet_address: wallet_address.clone(),
        peer_id: bootstrap.peer_id.clone(),
        multiaddr: bootstrap.multiaddr.clone(),
        is_public: bootstrap.is_public,
        tier: tier_name.to_string(),
        detected_cpu: detected.cpu_cores,
        detected_ram_mb: detected.ram_mb,
        detected_disk_gb: detected.disk_gb,
        max_instances: max,
        published_at: now.clone(),
    };
    crate::state::fleet_publish(&fleet_entry);
    println!(
        "[Fleet] Published to DHT under PeerId: {}...",
        &bootstrap.peer_id[..bootstrap.peer_id.len().min(12)]
    );

    // 8. Summary banner
    println!("\n============================================================");
    println!("  Boxty Provider — READY");
    println!("============================================================\n");
    println!(
        "  Tier        : {} ({} CPU, {:.0} MB RAM / instance)",
        tier_name, tier_cpu, tier_ram_mb
    );
    println!("  Instances   : {} workers", actual_instances);
    println!("  Total CPU   : {} cores", total_cores);
    println!(
        "  Total RAM   : {:.1} MB ({:.2} GB)",
        total_ram,
        total_ram / 1024.0
    );
    println!("  Total Disk  : {} GB", total_disk);
    println!("  Wallet      : {}", wallet_address);
    println!("  PeerId      : {}", bootstrap.peer_id);
    println!("  Multiaddr   : {}", bootstrap.multiaddr);
    println!(
        "  NAT         : {}",
        if bootstrap.is_public {
            "PUBLIC (relay + endpoints)"
        } else {
            "PRIVATE (compute only)"
        }
    );
    println!("  Earnings go directly to this wallet via Solana.");
    println!("============================================================\n");

    // 9. Spawn embedded HTTP Gateway — only on public providers (VPS with reachable IP).
    //    NAT providers talk exclusively through libp2p circuit relay; edge proxies fan-in.
    let gw_log = if bootstrap.is_public {
        let gateway_port: u16 = std::env::var("BOXTY_GATEWAY_PORT")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(8080);
        let gateway_host = std::env::var("BOXTY_GATEWAY_HOST").unwrap_or_else(|_| "0.0.0.0".into());
        let log = format!(
            "[Provider] HTTP Gateway at http://{}:{} (bind {}:{}) — public",
            bootstrap.multiaddr, gateway_port, gateway_host, gateway_port
        );
        println!("{log}");
        let gw_port = gateway_port;
        let gw_host = gateway_host.clone();
        tokio::spawn(async move {
            if let Err(err) = crate::gateway::serve_with(gw_port, &gw_host).await {
                eprintln!("[Provider/Gateway] fatal: {err}");
            }
        });
        log
    } else {
        let log = format!(
            "[Provider] No HTTP gateway — NAT node (PeerId {}). Reachable via circuit relay through public peers.",
            &bootstrap.peer_id[..bootstrap.peer_id.len().min(12)]
        );
        println!("{log}");
        log
    };

    // 10. Create shared node state for the TUI to render
    let mut node_state = dashboard::NodeState::default();
    node_state.shared_cpu = total_cores;
    node_state.shared_ram = total_ram;

    // Log the signaling server connection details dynamically
    let time_str = chrono::Local::now().format("%H:%M:%S").to_string();
    node_state.logs.push(format!(
        "[{}] Dialing signaling server: {}",
        time_str, signaling
    ));
    node_state
        .logs
        .push(format!("[{}] Connected via circuit relay.", time_str));
    node_state.logs.push(gw_log);
    node_state.logs.push(format!(
        "[{}] Provider online — {} workers x {} tier | PeerId: {}...",
        time_str,
        actual_instances,
        tier_name.to_uppercase(),
        &bootstrap.peer_id[..bootstrap.peer_id.len().min(12)]
    ));

    let state = Arc::new(Mutex::new(node_state));

    // 10. Run the interactive terminal dashboard
    let result = dashboard::run_tui(state).await;

    // Cleanup
    crate::state::fleet_unpublish(&wallet_address, &bootstrap.peer_id);
    crate::state::clear_file(&provider_path);
    result?;

    Ok(())
}
