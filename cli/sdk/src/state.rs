use serde::de::DeserializeOwned;
use serde::Serialize;
use std::path::PathBuf;

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct ProviderState {
    pub pid: u32,
    pub tier: String,
    pub disk_gb: u32,
    pub instances: u32,
    pub shared_cpu: u32,
    pub shared_ram_mb: f64,
    pub signaling: String,
    pub status: String,
    pub started_at: String,
    pub last_updated_at: String,
    #[serde(default)]
    pub provider_id: String,
    #[serde(default)]
    pub provider_auth_token: String,
    #[serde(default)]
    pub mode: String,
    #[serde(default)]
    pub control_plane_url: String,
    #[serde(default)]
    pub provider_pool: String,
    #[serde(default)]
    pub region: String,
    #[serde(default)]
    pub last_error: String,
    /// Auto-detected system resources
    #[serde(default)]
    pub detected_cpu: u32,
    #[serde(default)]
    pub detected_ram_mb: f64,
    #[serde(default)]
    pub detected_disk_gb: u32,
    /// Wallet address for this provider
    #[serde(default)]
    pub wallet_address: String,
    /// Max concurrent instances this provider can run
    #[serde(default)]
    pub max_instances: u32,
    /// Active job count (for observability)
    #[serde(default)]
    pub active_jobs: u32,
    /// Active job details
    #[serde(default)]
    pub jobs: Vec<ProviderJob>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct ProviderJob {
    pub id: String,
    pub job_type: String,
    pub client: String,
    pub cpu_cores: u32,
    pub ram_mb: f64,
    pub started_at: String,
    pub status: String,
    #[serde(default)]
    pub workload_id: String,
    #[serde(default)]
    pub container_id: String,
    #[serde(default)]
    pub image: String,
    #[serde(default)]
    pub endpoint_name: String,
    #[serde(default)]
    pub host_port: u16,
    #[serde(default)]
    pub last_metered_at: String,
    #[serde(default)]
    pub disk_gb: u32,
    #[serde(default)]
    pub gpu_count: u32,
    #[serde(default)]
    pub volume_mounts: Vec<ProviderVolumeMount>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct ProviderVolumeMount {
    pub locator: String,
    pub mount_path: String,
    #[serde(default)]
    pub local_path: String,
    #[serde(default)]
    pub read_only: bool,
}

pub fn boxty_home_dir() -> PathBuf {
    if let Some(path) = std::env::var_os("BOXTY_HOME") {
        return PathBuf::from(path);
    }

    if let Some(home) = std::env::var_os("HOME") {
        return PathBuf::from(home).join(".boxty");
    }

    PathBuf::from(".boxty")
}

pub fn ensure_state_dir() -> PathBuf {
    let path = boxty_home_dir();
    let _ = std::fs::create_dir_all(&path);
    path
}

pub fn wallet_path() -> PathBuf {
    ensure_state_dir().join("wallet.json")
}

pub fn active_apps_path() -> PathBuf {
    ensure_state_dir().join("active_apps.json")
}

pub fn provider_path() -> PathBuf {
    ensure_state_dir().join("provider.json")
}

pub fn write_json<T: Serialize>(path: &PathBuf, value: &T) {
    if let Ok(json) = serde_json::to_string_pretty(value) {
        let _ = std::fs::write(path, json);
    }
}

pub fn read_json<T: DeserializeOwned>(path: &PathBuf, fallback: T) -> T {
    if let Ok(contents) = std::fs::read_to_string(path) {
        if let Ok(value) = serde_json::from_str::<T>(&contents) {
            return value;
        }
    }

    fallback
}

// ---- Fleet discovery (auto-discovery of providers sharing the same wallet) ----

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct FleetEntry {
    pub wallet_address: String,
    /// Libp2p PeerId — unique identity in the mesh (replaces hostname)
    pub peer_id: String,
    /// Libp2p multiaddr (e.g. "/ip4/1.2.3.4/tcp/4001") — reachable address
    pub multiaddr: String,
    /// Whether this provider has a public IP (VPS) or is behind NAT
    pub is_public: bool,
    pub tier: String,
    pub detected_cpu: u32,
    pub detected_ram_mb: f64,
    pub detected_disk_gb: u32,
    pub max_instances: u32,
    pub published_at: String,
}

pub fn fleet_dir() -> PathBuf {
    ensure_state_dir().join("fleet")
}

/// Publish this provider into the fleet store under its wallet address.
/// Keyed by PeerId — ready for DHT publish when real libp2p Kademlia is online.
pub fn fleet_publish(entry: &FleetEntry) {
    let dir = fleet_dir().join(&entry.wallet_address);
    let _ = std::fs::create_dir_all(&dir);
    let path = dir.join(format!("{}.json", entry.peer_id));
    write_json(&path, entry);
}

/// Unpublish this provider from the fleet store (on shutdown).
pub fn fleet_unpublish(wallet_address: &str, peer_id: &str) {
    let path = fleet_dir()
        .join(wallet_address)
        .join(format!("{}.json", peer_id));
    let _ = std::fs::remove_file(path);
}

/// Read all fleet entries for a given wallet address.
/// Scans the fleet directory for all .json files under wallet_address/.
pub fn fleet_read_all(wallet_address: &str) -> Vec<FleetEntry> {
    let dir = fleet_dir().join(wallet_address);
    let mut entries = Vec::new();
    if let Ok(read_dir) = std::fs::read_dir(&dir) {
        for entry in read_dir.flatten() {
            let path = entry.path();
            if path.extension().map_or(false, |ext| ext == "json") {
                if let Ok(contents) = std::fs::read_to_string(&path) {
                    if let Ok(fleet) = serde_json::from_str::<FleetEntry>(&contents) {
                        entries.push(fleet);
                    }
                }
            }
        }
    }
    entries
}

pub fn clear_file(path: &PathBuf) {
    let _ = std::fs::remove_file(path);
}

pub fn is_process_alive(pid: u32) -> bool {
    std::process::Command::new("kill")
        .arg("-0")
        .arg(pid.to_string())
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()
        .map(|status| status.success())
        .unwrap_or(false)
}
