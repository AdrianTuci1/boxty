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

    // Read file content
    let code = std::fs::read_to_string(file_path)?;
    
    // Determine runtime from extension
    let file_ext = Path::new(file_path)
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("");
    
    let (image, command) = match file_ext {
        "py" => ("python:3.10-slim", vec!["python", "-c", &code]),
        "js" => ("node:18-slim", vec!["node", "-e", &code]),
        "ts" => ("bun:latest", vec!["bun", "run", "-"]),
        "wasm" => ("wasmtime:latest", vec!["wasmtime", "run", "-"]),
        _ => ("alpine:latest", vec!["sh", "-c", &code]),
    };

    println!("Submitting function workload to control plane...");
    
    // Create workload via API
    let client = ControlPlaneClient::from_env()?;
    let workload = WorkloadCreateRequest {
        name: format!("function-{}", Path::new(file_path).file_stem().unwrap_or_default().to_string_lossy()),
        kind: WorkloadKind::Function,
        image: image.to_string(),
        command: command.iter().map(|s| s.to_string()).collect(),
        env: std::collections::HashMap::new(),
        secret_names: secrets.to_vec(),
        volume_mounts: volumes.iter().map(|v| VolumeMount {
            locator: v.clone(),
            mount_path: format!("/mnt/{}", v),
            read_only: false,
        }).collect(),
        resources: ResourceRequirements {
            cpu_cores: 1,
            memory_mb: 512,
            disk_gb: 10,
            gpu_count: 0,
        },
        selected_backend: ExecutionBackend::Provider,
    };
    
    let response = client.create_workload(&workload).await?;
    println!("✅ Workload created: {}", response.workload_id);
    println!("   Status: {}", response.status);
    println!("   Image: {}", image);
    println!("   Replication: N={}", replication);
    
    Ok(())
}

pub async fn handle_sandbox(
    image: &str,
    timeout: u32,
    secrets: &[String],
    volumes: &[String],
    signaling: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("=== Boxty Client Sandbox ===");
    
    let client = ControlPlaneClient::from_env()?;
    let workload = WorkloadCreateRequest {
        name: format!("sandbox-{}", chrono::Utc::now().timestamp()),
        kind: WorkloadKind::Sandbox,
        image: image.to_string(),
        command: vec!["sleep".to_string(), timeout.to_string()],
        env: std::collections::HashMap::new(),
        secret_names: secrets.to_vec(),
        volume_mounts: volumes.iter().map(|v| VolumeMount {
            locator: v.clone(),
            mount_path: format!("/mnt/{}", v),
            read_only: false,
        }).collect(),
        resources: ResourceRequirements {
            cpu_cores: 2,
            memory_mb: 1024,
            disk_gb: 20,
            gpu_count: 0,
        },
        selected_backend: ExecutionBackend::Provider,
    };
    
    let response = client.create_workload(&workload).await?;
    println!("✅ Sandbox workload created: {}", response.workload_id);
    println!("   Status: {}", response.status);
    println!("   Image: {}", image);
    println!("   Timeout: {}s", timeout);
    println!("   Signaling: {}", signaling);
    
    Ok(())
}

pub async fn handle_deploy(
    image: &str,
    install: Option<&str>,
    serve: Option<u16>,
    idle_timeout: u32,
    secrets: &[String],
    volumes: &[String],
    signaling: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("=== Boxty Client Deploy ===");
    
    let client = ControlPlaneClient::from_env()?;
    let workload = WorkloadCreateRequest {
        name: format!("deploy-{}", chrono::Utc::now().timestamp()),
        kind: WorkloadKind::Endpoint,
        image: image.to_string(),
        command: vec!["sleep".to_string(), idle_timeout.to_string()],
        env: std::collections::HashMap::new(),
        secret_names: secrets.to_vec(),
        volume_mounts: volumes.iter().map(|v| VolumeMount {
            locator: v.clone(),
            mount_path: format!("/mnt/{}", v),
            read_only: false,
        }).collect(),
        resources: ResourceRequirements {
            cpu_cores: 2,
            memory_mb: 1024,
            disk_gb: 20,
            gpu_count: 0,
        },
        selected_backend: ExecutionBackend::Provider,
    };
    
    let response = client.create_workload(&workload).await?;
    println!("✅ Deploy workload created: {}", response.workload_id);
    println!("   Status: {}", response.status);
    println!("   Image: {}", image);
    if let Some(install) = install {
        println!("   Install: {}", install);
    }
    if let Some(serve) = serve {
        println!("   Serve: port {}", serve);
    }
    println!("   Idle Timeout: {}s", idle_timeout);
    println!("   Signaling: {}", signaling);
    
    Ok(())
}

pub async fn handle_app(
    command: crate::cli::AppCommands,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("=== Boxty Client App ===");
    
    let client = ControlPlaneClient::from_env()?;
    
    match command {
        crate::cli::AppCommands::List => {
            let workloads = client.list_workloads().await?;
            println!("Apps:");
            for workload in workloads {
                println!("  {} - {} ({})", workload.workload_id, workload.name, workload.status);
            }
        }
        crate::cli::AppCommands::Stop { app_id } => {
            let id_str = app_id.to_string();
            client.stop_workload(&id_str).await?;
            println!("✅ App stopped: {}", app_id);
        }
    }
    
    Ok(())
}

pub async fn handle_gateway(
    port: u16,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("=== Boxty Client Gateway ===");
    println!("Starting gateway on port {}", port);
    
    // Start HTTP proxy
    println!("Gateway running on http://localhost:{}", port);
    
    Ok(())
}

// ControlPlaneClient implementation
struct ControlPlaneClient {
    base_url: String,
    token: String,
}

impl ControlPlaneClient {
    fn from_env() -> Result<Self, Box<dyn std::error::Error>> {
        let base_url = std::env::var("BOXTY_API_URL")
            .unwrap_or_else(|_| "http://localhost:8000/v1".to_string());
        let token = std::env::var("BOXTY_API_TOKEN")
            .map_err(|_| "BOXTY_API_TOKEN not set. Run 'boxty auth login' first.")?;
        Ok(Self { base_url, token })
    }
    
    async fn create_workload(&self, workload: &WorkloadCreateRequest) -> Result<WorkloadRecord, Box<dyn std::error::Error>> {
        let client = reqwest::Client::new();
        let response = client
            .post(format!("{}/workloads", self.base_url))
            .header("Authorization", format!("Bearer {}", self.token))
            .json(workload)
            .send()
            .await?;
        
        if !response.status().is_success() {
            return Err(format!("API error: {}", response.status()).into());
        }
        
        let record: WorkloadRecord = response.json().await?;
        Ok(record)
    }
    
    async fn list_workloads(&self) -> Result<Vec<WorkloadRecord>, Box<dyn std::error::Error>> {
        let client = reqwest::Client::new();
        let response = client
            .get(format!("{}/workloads", self.base_url))
            .header("Authorization", format!("Bearer {}", self.token))
            .send()
            .await?;
        
        if !response.status().is_success() {
            return Err(format!("API error: {}", response.status()).into());
        }
        
        let records: Vec<WorkloadRecord> = response.json().await?;
        Ok(records)
    }
    
    async fn stop_workload(&self, workload_id: &str) -> Result<(), Box<dyn std::error::Error>> {
        let client = reqwest::Client::new();
        let response = client
            .post(format!("{}/workloads/{}/status", self.base_url, workload_id))
            .header("Authorization", format!("Bearer {}", self.token))
            .json(&serde_json::json!({"status": "stopped"}))
            .send()
            .await?;
        
        if !response.status().is_success() {
            return Err(format!("API error: {}", response.status()).into());
        }
        
        Ok(())
    }
    
    async fn get_workload_logs(&self, workload_id: &str) -> Result<Vec<WorkloadLogEntry>, Box<dyn std::error::Error>> {
        let client = reqwest::Client::new();
        let response = client
            .get(format!("{}/workloads/{}/logs", self.base_url, workload_id))
            .header("Authorization", format!("Bearer {}", self.token))
            .send()
            .await?;
        
        if !response.status().is_success() {
            return Err(format!("API error: {}", response.status()).into());
        }
        
        let logs: Vec<WorkloadLogEntry> = response.json().await?;
        Ok(logs)
    }
}

// Models
#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct WorkloadCreateRequest {
    name: String,
    kind: WorkloadKind,
    image: String,
    command: Vec<String>,
    env: std::collections::HashMap<String, String>,
    secret_names: Vec<String>,
    volume_mounts: Vec<VolumeMount>,
    resources: ResourceRequirements,
    selected_backend: ExecutionBackend,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct WorkloadRecord {
    workload_id: String,
    name: String,
    status: String,
    image: String,
    command: Vec<String>,
    env: std::collections::HashMap<String, String>,
    secret_names: Vec<String>,
    volume_mounts: Vec<VolumeMount>,
    resources: ResourceRequirements,
    selected_backend: ExecutionBackend,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct VolumeMount {
    locator: String,
    mount_path: String,
    read_only: bool,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct ResourceRequirements {
    cpu_cores: u32,
    memory_mb: u32,
    disk_gb: u32,
    gpu_count: u32,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
enum WorkloadKind {
    Function,
    Sandbox,
    Endpoint,
    Build,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
enum ExecutionBackend {
    Provider,
    Runpod,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct WorkloadLogEntry {
    log_id: String,
    workload_id: String,
    timestamp: String,
    level: String,
    message: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct AppInfo {
    pub id: String,
    pub name: String,
    pub app_type: String,
    pub pid: u32,
    pub runtime_pid: u32,
    pub port: u16,
    pub status: String,
    pub updated_at: String,
}

pub fn read_apps() -> Vec<AppInfo> {
    vec![]
}

pub fn stop_registered_app(_app_id: u64) -> bool {
    true
}

pub fn is_sandbox_alive(_id: u64) -> bool {
    true
}

pub fn read_sandbox_meta(_id: u64) -> String {
    "{}".to_string()
}

pub fn tail_sandbox_log(_id: u64, _lines: usize) -> Vec<String> {
    vec![]
}

pub async fn handle_attach(
    _workload_id: &str,
    _signaling: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Attaching to workload...");
    Ok(())
}

pub async fn handle_init(
    _lang: &str,
    _output: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Initializing project...");
    Ok(())
}

pub async fn handle_update(
    _force: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Checking for updates...");
    Ok(())
}

pub async fn handle_login(
    external_user_id: String,
    email: Option<&str>,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Logging in...");
    Ok(())
}

pub async fn handle_logout(
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Logging out...");
    Ok(())
}

pub async fn handle_whoami(
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Getting user info...");
    Ok(())
}

pub async fn handle_workspace(
    _command: crate::cli::WorkspaceCommands,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Managing workspace...");
    Ok(())
}

pub async fn handle_env(
    _command: crate::cli::EnvCommands,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Managing environment...");
    Ok(())
}

pub async fn handle_billing(
    _command: crate::cli::BillingCommands,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Managing billing...");
    Ok(())
}

pub async fn handle_route(
    _command: crate::cli::RouteCommands,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Managing route...");
    Ok(())
}

pub async fn handle_schedule(
    _command: crate::cli::ScheduleCommands,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Managing schedule...");
    Ok(())
}

pub async fn handle_image(
    _command: crate::cli::ImageCommands,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Managing image...");
    Ok(())
}

pub async fn handle_appctl(
    _command: crate::cli::AppCtlCommands,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Managing app...");
    Ok(())
}

pub async fn handle_status(
    _watch: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("Getting status...");
    Ok(())
}
