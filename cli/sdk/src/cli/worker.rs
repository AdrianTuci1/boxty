use reqwest::header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::error::Error;
use std::fs;
use std::path::PathBuf;
use std::process::{Command, Output, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

type WorkerResult<T> = Result<T, Box<dyn Error>>;

#[derive(Debug)]
struct WorkerHttpError {
    status: u16,
    body: String,
}

impl std::fmt::Display for WorkerHttpError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "control plane request failed with {}: {}",
            self.status, self.body
        )
    }
}

impl Error for WorkerHttpError {}

#[derive(Debug, Deserialize, Clone)]
pub struct WorkerConfig {
    pub node: WorkerNodeConfig,
    pub control_plane: WorkerControlPlaneConfig,
    pub worker: WorkerExecutionConfig,
    pub sandbox: WorkerSandboxConfig,
    pub backends: WorkerBackendsConfig,
    pub resources: WorkerResourcesConfig,
}

#[derive(Debug, Deserialize, Clone)]
pub struct WorkerNodeConfig {
    pub id: String,
    pub region: String,
    #[serde(default)]
    pub labels: HashMap<String, String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct WorkerControlPlaneConfig {
    pub url: String,
    pub provider_pool: String,
    #[serde(default = "default_retry_interval_ms")]
    pub retry_interval_ms: u64,
    #[serde(default = "default_max_retries")]
    pub max_retries: u32,
}

#[derive(Debug, Deserialize, Clone)]
pub struct WorkerExecutionConfig {
    pub concurrency: u32,
    #[serde(default = "default_heartbeat_interval_sec")]
    pub heartbeat_interval_sec: u64,
    #[serde(default = "default_task_timeout_sec")]
    pub task_timeout_sec: u64,
}

#[derive(Debug, Deserialize, Clone)]
pub struct WorkerSandboxConfig {
    pub ssh_mode: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct WorkerBackendsConfig {
    #[serde(default)]
    pub runpod_enabled: bool,
    #[serde(default)]
    pub runpod_default_template: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct WorkerResourcesConfig {
    pub max_memory_mb: u32,
    pub max_cpu_cores: u32,
}

fn default_retry_interval_ms() -> u64 {
    5_000
}

fn default_max_retries() -> u32 {
    10
}

fn default_heartbeat_interval_sec() -> u64 {
    30
}

fn default_task_timeout_sec() -> u64 {
    300
}

#[derive(Debug, Serialize)]
struct ProviderRegistrationRequestPayload {
    provider_name: String,
    region: String,
    pool: String,
    public_base_url: Option<String>,
    control_callback_url: Option<String>,
    session_access_mode: String,
    labels: HashMap<String, String>,
    capabilities: ProviderCapabilitiesPayload,
}

#[derive(Debug, Serialize)]
struct ProviderCapabilitiesPayload {
    cpu_cores: u32,
    memory_mb: u32,
    disk_gb: u32,
    gpu_count: u32,
    gpu_type: Option<String>,
    supports_endpoint_serving: bool,
    supports_sandbox_ssh: bool,
    supports_image_builds: bool,
}

#[derive(Debug, Serialize)]
struct ProviderHeartbeatRequestPayload {
    available_slots: u32,
    running_workloads: u32,
    status: String,
}

#[derive(Debug, Serialize)]
struct WorkloadStatusUpdateRequestPayload {
    status: String,
    runtime_details: HashMap<String, Value>,
}

#[derive(Debug, Serialize)]
struct UsageMeterRequestPayload {
    workload_id: String,
    cpu_seconds: f64,
    ram_gb_seconds: f64,
    gpu_seconds: f64,
    storage_gb_seconds: f64,
    egress_gb: f64,
    metadata: HashMap<String, Value>,
}

#[derive(Debug, Deserialize)]
struct ProviderRegistrationResponse {
    provider_id: String,
    provider_token: String,
}

#[derive(Debug, Deserialize)]
struct WorkerAssignmentRecord {
    workload: WorkloadRecord,
}

#[derive(Debug, Deserialize)]
struct WorkloadLaunchSpec {
    workload: WorkloadRecord,
    env: HashMap<String, String>,
}

#[derive(Debug, Deserialize)]
struct WorkloadRecord {
    workload_id: String,
    owner_id: String,
    kind: String,
    image: String,
    #[serde(default)]
    command: Vec<String>,
    #[serde(default)]
    metadata: HashMap<String, Value>,
    #[serde(default)]
    endpoint_name: Option<String>,
    #[serde(default)]
    volume_mounts: Vec<WorkloadVolumeMount>,
    resources: WorkloadResources,
}

#[derive(Debug, Deserialize, Clone)]
struct WorkloadVolumeMount {
    locator: String,
    mount_path: String,
    #[serde(default)]
    read_only: bool,
}

#[derive(Debug, Deserialize)]
struct WorkloadResources {
    #[serde(default = "default_one")]
    cpu_cores: u32,
    #[serde(default = "default_memory")]
    memory_mb: u32,
    #[serde(default = "default_disk")]
    disk_gb: u32,
    #[serde(default)]
    gpu_count: u32,
}

fn default_one() -> u32 {
    1
}

fn default_memory() -> u32 {
    512
}

fn default_disk() -> u32 {
    2
}

#[derive(Debug, Deserialize)]
struct SandboxSessionRecord {
    workload_id: String,
}

#[derive(Debug, Deserialize)]
struct VolumeEntryRecord {
    path: String,
    entry_type: String,
    #[serde(default)]
    size: Option<u64>,
}

#[derive(Debug, Clone)]
struct PreparedVolumeMount {
    locator: String,
    mount_path: String,
    local_dir: PathBuf,
    read_only: bool,
}

struct ControlPlaneClient {
    base_url: String,
    enrollment_token: Option<String>,
    http: reqwest::Client,
}

impl ControlPlaneClient {
    fn new(base_url: &str) -> WorkerResult<Self> {
        Ok(Self {
            base_url: base_url.trim_end_matches('/').to_string(),
            enrollment_token: std::env::var("BOXTY_PROVIDER_TOKEN")
                .ok()
                .filter(|value| !value.is_empty()),
            http: reqwest::Client::builder()
                .timeout(Duration::from_secs(30))
                .build()?,
        })
    }

    fn common_headers(&self, builder: reqwest::RequestBuilder) -> reqwest::RequestBuilder {
        builder.header(ACCEPT, "application/json")
    }

    fn with_registration_headers(
        &self,
        builder: reqwest::RequestBuilder,
    ) -> reqwest::RequestBuilder {
        let builder = self.common_headers(builder);
        let builder = if let Some(token) = &self.enrollment_token {
            builder.header(AUTHORIZATION, format!("Bearer {token}"))
        } else {
            builder
        };
        builder.header(CONTENT_TYPE, "application/json")
    }

    fn with_runtime_headers(
        &self,
        builder: reqwest::RequestBuilder,
        provider_id: &str,
        provider_token: &str,
    ) -> reqwest::RequestBuilder {
        self.common_headers(builder)
            .header(AUTHORIZATION, format!("Bearer {provider_token}"))
            .header("X-Provider-Id", provider_id)
            .header(CONTENT_TYPE, "application/json")
    }

    fn with_binary_runtime_headers(
        &self,
        builder: reqwest::RequestBuilder,
        provider_id: &str,
        provider_token: &str,
    ) -> reqwest::RequestBuilder {
        self.common_headers(builder)
            .header(AUTHORIZATION, format!("Bearer {provider_token}"))
            .header("X-Provider-Id", provider_id)
    }

    fn with_optional_runtime_headers(
        &self,
        builder: reqwest::RequestBuilder,
        provider_id: Option<&str>,
        provider_token: Option<&str>,
    ) -> reqwest::RequestBuilder {
        match (provider_id, provider_token) {
            (Some(id), Some(token)) if !id.is_empty() && !token.is_empty() => {
                self.with_binary_runtime_headers(builder, id, token)
            }
            _ => self.common_headers(builder),
        }
    }

    fn with_json_runtime_headers(
        &self,
        builder: reqwest::RequestBuilder,
        provider_id: Option<&str>,
        provider_token: Option<&str>,
    ) -> reqwest::RequestBuilder {
        self.with_optional_runtime_headers(builder, provider_id, provider_token)
            .header(CONTENT_TYPE, "application/json")
    }

    async fn parse_unit(&self, response: reqwest::Response) -> WorkerResult<()> {
        let status = response.status();
        let text = response.text().await?;
        if !status.is_success() {
            return Err(Box::new(WorkerHttpError {
                status: status.as_u16(),
                body: text,
            }));
        }
        Ok(())
    }

    async fn parse_bytes(&self, response: reqwest::Response) -> WorkerResult<Vec<u8>> {
        let status = response.status();
        let bytes = response.bytes().await?;
        if !status.is_success() {
            return Err(Box::new(WorkerHttpError {
                status: status.as_u16(),
                body: String::from_utf8_lossy(&bytes).to_string(),
            }));
        }
        Ok(bytes.to_vec())
    }

    async fn post_runtime_json<T: DeserializeOwned, B: Serialize>(
        &self,
        provider_id: &str,
        provider_token: &str,
        path: &str,
        body: &B,
    ) -> WorkerResult<T> {
        let response = self
            .with_runtime_headers(
                self.http.post(format!("{}{}", self.base_url, path)),
                provider_id,
                provider_token,
            )
            .json(body)
            .send()
            .await?;
        self.parse_json(response).await
    }

    async fn get_runtime_json<T: DeserializeOwned>(
        &self,
        provider_id: &str,
        provider_token: &str,
        path: &str,
        query: &[(&str, &str)],
    ) -> WorkerResult<T> {
        let response = self
            .with_runtime_headers(
                self.http.get(format!("{}{}", self.base_url, path)),
                provider_id,
                provider_token,
            )
            .query(query)
            .send()
            .await?;
        self.parse_json(response).await
    }

    async fn get_optional_runtime_json<T: DeserializeOwned>(
        &self,
        provider_id: Option<&str>,
        provider_token: Option<&str>,
        path: &str,
        query: &[(&str, &str)],
    ) -> WorkerResult<T> {
        let response = self
            .with_json_runtime_headers(
                self.http.get(format!("{}{}", self.base_url, path)),
                provider_id,
                provider_token,
            )
            .query(query)
            .send()
            .await?;
        self.parse_json(response).await
    }

    async fn get_optional_runtime_bytes(
        &self,
        provider_id: Option<&str>,
        provider_token: Option<&str>,
        path: &str,
        query: &[(&str, &str)],
    ) -> WorkerResult<Vec<u8>> {
        let response = self
            .with_optional_runtime_headers(
                self.http.get(format!("{}{}", self.base_url, path)),
                provider_id,
                provider_token,
            )
            .query(query)
            .send()
            .await?;
        self.parse_bytes(response).await
    }

    async fn put_optional_runtime_bytes(
        &self,
        provider_id: Option<&str>,
        provider_token: Option<&str>,
        path: &str,
        query: &[(&str, &str)],
        body: Vec<u8>,
    ) -> WorkerResult<()> {
        let response = self
            .with_optional_runtime_headers(
                self.http.put(format!("{}{}", self.base_url, path)),
                provider_id,
                provider_token,
            )
            .query(query)
            .header(CONTENT_TYPE, "application/octet-stream")
            .body(body)
            .send()
            .await?;
        self.parse_unit(response).await
    }

    async fn delete_optional_runtime(
        &self,
        provider_id: Option<&str>,
        provider_token: Option<&str>,
        path: &str,
        query: &[(&str, &str)],
    ) -> WorkerResult<()> {
        let response = self
            .with_optional_runtime_headers(
                self.http.delete(format!("{}{}", self.base_url, path)),
                provider_id,
                provider_token,
            )
            .query(query)
            .send()
            .await?;
        self.parse_unit(response).await
    }

    async fn parse_json<T: DeserializeOwned>(
        &self,
        response: reqwest::Response,
    ) -> WorkerResult<T> {
        let status = response.status();
        let text = response.text().await?;
        if !status.is_success() {
            return Err(Box::new(WorkerHttpError {
                status: status.as_u16(),
                body: text,
            }));
        }
        let payload = if text.trim().is_empty() {
            "null"
        } else {
            text.as_str()
        };
        Ok(serde_json::from_str::<T>(payload)?)
    }

    async fn post_json<T: DeserializeOwned, B: Serialize>(
        &self,
        path: &str,
        body: &B,
    ) -> WorkerResult<T> {
        let response = self
            .with_registration_headers(self.http.post(format!("{}{}", self.base_url, path)))
            .json(body)
            .send()
            .await?;
        self.parse_json(response).await
    }

    async fn register_provider(
        &self,
        config: &WorkerConfig,
        detected: &crate::cli::provider::SystemResources,
    ) -> WorkerResult<ProviderRegistrationResponse> {
        let payload = ProviderRegistrationRequestPayload {
            provider_name: config.node.id.clone(),
            region: config.node.region.clone(),
            pool: config.control_plane.provider_pool.clone(),
            public_base_url: std::env::var("BOXTY_PUBLIC_BASE_URL").ok(),
            control_callback_url: std::env::var("BOXTY_WORKER_CALLBACK_URL").ok(),
            session_access_mode: config.sandbox.ssh_mode.clone(),
            labels: config.node.labels.clone(),
            capabilities: ProviderCapabilitiesPayload {
                cpu_cores: config
                    .resources
                    .max_cpu_cores
                    .min(detected.cpu_cores)
                    .max(1),
                memory_mb: config
                    .resources
                    .max_memory_mb
                    .min(detected.ram_mb.floor() as u32)
                    .max(256),
                disk_gb: detected.disk_gb.max(1),
                gpu_count: std::env::var("BOXTY_GPU_COUNT")
                    .ok()
                    .and_then(|value| value.parse().ok())
                    .unwrap_or(0),
                gpu_type: std::env::var("BOXTY_GPU_TYPE").ok(),
                supports_endpoint_serving: true,
                supports_sandbox_ssh: config.sandbox.ssh_mode == "sandbox_only",
                supports_image_builds: config.backends.runpod_enabled
                    || !config.backends.runpod_default_template.is_empty(),
            },
        };
        self.post_json("/v1/providers/register", &payload).await
    }

    async fn heartbeat_provider(
        &self,
        provider_id: &str,
        provider_token: &str,
        available_slots: u32,
        running_workloads: u32,
        status: &str,
    ) -> WorkerResult<()> {
        let payload = ProviderHeartbeatRequestPayload {
            available_slots,
            running_workloads,
            status: status.to_string(),
        };
        let _: Value = self
            .post_runtime_json(
                provider_id,
                provider_token,
                &format!("/v1/providers/{provider_id}/heartbeat"),
                &payload,
            )
            .await?;
        Ok(())
    }

    async fn unregister_provider(
        &self,
        provider_id: &str,
        provider_token: &str,
    ) -> WorkerResult<()> {
        let response = self
            .with_runtime_headers(
                self.http
                    .delete(format!("{}/v1/providers/{}", self.base_url, provider_id)),
                provider_id,
                provider_token,
            )
            .send()
            .await?;
        self.parse_unit(response).await
    }

    async fn claim_next_assignment(
        &self,
        provider_id: &str,
        provider_token: &str,
    ) -> WorkerResult<Option<WorkerAssignmentRecord>> {
        self.post_runtime_json(
            provider_id,
            provider_token,
            &format!("/v1/providers/{provider_id}/assignments/next"),
            &json!({}),
        )
        .await
    }

    async fn workload_launch_spec(
        &self,
        provider_id: &str,
        provider_token: &str,
        workload_id: &str,
    ) -> WorkerResult<WorkloadLaunchSpec> {
        self.get_runtime_json(
            provider_id,
            provider_token,
            &format!("/v1/workloads/{workload_id}/launch-spec"),
            &[],
        )
        .await
    }

    async fn update_workload_status(
        &self,
        provider_id: &str,
        provider_token: &str,
        workload_id: &str,
        status: &str,
        runtime_details: HashMap<String, Value>,
    ) -> WorkerResult<()> {
        let payload = WorkloadStatusUpdateRequestPayload {
            status: status.to_string(),
            runtime_details,
        };
        let _: Value = self
            .post_runtime_json(
                provider_id,
                provider_token,
                &format!("/v1/workloads/{workload_id}/status"),
                &payload,
            )
            .await?;
        Ok(())
    }

    async fn meter_usage(
        &self,
        provider_id: &str,
        provider_token: &str,
        workload_id: &str,
        resources: &WorkloadResources,
        duration_seconds: f64,
        metadata: HashMap<String, Value>,
    ) -> WorkerResult<()> {
        if duration_seconds <= 0.0 {
            return Ok(());
        }
        let payload = UsageMeterRequestPayload {
            workload_id: workload_id.to_string(),
            cpu_seconds: duration_seconds * resources.cpu_cores as f64,
            ram_gb_seconds: duration_seconds * (resources.memory_mb as f64 / 1024.0),
            gpu_seconds: duration_seconds * resources.gpu_count as f64,
            storage_gb_seconds: duration_seconds * resources.disk_gb as f64,
            egress_gb: 0.0,
            metadata,
        };
        let _: Value = self
            .post_runtime_json(provider_id, provider_token, "/v1/usage/meter", &payload)
            .await?;
        Ok(())
    }

    async fn verify_sandbox_session(
        &self,
        provider_id: Option<&str>,
        provider_token: Option<&str>,
        token: &str,
    ) -> WorkerResult<SandboxSessionRecord> {
        self.get_optional_runtime_json(
            provider_id,
            provider_token,
            "/v1/sandbox-sessions/verify",
            &[("token", token)],
        )
        .await
    }

    async fn list_volume_entries(
        &self,
        provider_id: Option<&str>,
        provider_token: Option<&str>,
        locator: &str,
    ) -> WorkerResult<Vec<VolumeEntryRecord>> {
        self.get_optional_runtime_json(
            provider_id,
            provider_token,
            &format!("/v1/volumes/{locator}/entries"),
            &[],
        )
        .await
    }

    async fn get_volume_blob(
        &self,
        provider_id: Option<&str>,
        provider_token: Option<&str>,
        locator: &str,
        path: &str,
    ) -> WorkerResult<Vec<u8>> {
        self.get_optional_runtime_bytes(
            provider_id,
            provider_token,
            &format!("/v1/volumes/{locator}/blob"),
            &[("path", path)],
        )
        .await
    }

    async fn put_volume_blob(
        &self,
        provider_id: Option<&str>,
        provider_token: Option<&str>,
        locator: &str,
        path: &str,
        data: Vec<u8>,
    ) -> WorkerResult<()> {
        self.put_optional_runtime_bytes(
            provider_id,
            provider_token,
            &format!("/v1/volumes/{locator}/blob"),
            &[("path", path)],
            data,
        )
        .await
    }

    async fn delete_volume_blob(
        &self,
        provider_id: Option<&str>,
        provider_token: Option<&str>,
        locator: &str,
        path: &str,
    ) -> WorkerResult<()> {
        self.delete_optional_runtime(
            provider_id,
            provider_token,
            &format!("/v1/volumes/{locator}/blob"),
            &[("path", path)],
        )
        .await
    }
}

struct WorkerRuntime {
    binary: String,
    worker_data_dir: PathBuf,
}

struct RuntimeLaunchResult {
    status: String,
    runtime_details: HashMap<String, Value>,
    container_id: Option<String>,
    detached: bool,
}

struct RuntimeInspectResult {
    running: bool,
    exit_code: i32,
    status: String,
}

impl WorkerRuntime {
    fn new() -> WorkerResult<Self> {
        let preferred = std::env::var("BOXTY_WORKER_RUNTIME").ok();
        let binary = detect_runtime_binary(preferred.as_deref().unwrap_or("docker"))?;
        let worker_data_dir = std::env::var("BOXTY_WORKER_DATA_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| std::env::temp_dir().join("boxty-worker"));
        std::fs::create_dir_all(&worker_data_dir)?;
        Ok(Self {
            binary,
            worker_data_dir,
        })
    }

    fn launch(&self, launch_spec: &WorkloadLaunchSpec) -> WorkerResult<RuntimeLaunchResult> {
        let workload = &launch_spec.workload;
        match workload.kind.as_str() {
            "function" => self.launch_function(launch_spec),
            "sandbox" => self.launch_sandbox(launch_spec),
            "endpoint" | "build" => self.launch_service(launch_spec),
            other => Err(format!("unsupported workload kind: {other}").into()),
        }
    }

    fn inspect_container(&self, container_name: &str) -> WorkerResult<RuntimeInspectResult> {
        let output = Command::new(&self.binary)
            .args(["inspect", container_name])
            .output()?;
        if !output.status.success() {
            return Ok(RuntimeInspectResult {
                running: false,
                exit_code: 1,
                status: "missing".to_string(),
            });
        }
        let payload: Vec<Value> = serde_json::from_slice(&output.stdout)?;
        let state = payload
            .get(0)
            .and_then(|item| item.get("State"))
            .cloned()
            .unwrap_or_else(|| json!({}));
        Ok(RuntimeInspectResult {
            running: state
                .get("Running")
                .and_then(Value::as_bool)
                .unwrap_or(false),
            exit_code: state.get("ExitCode").and_then(Value::as_i64).unwrap_or(1) as i32,
            status: state
                .get("Status")
                .and_then(Value::as_str)
                .unwrap_or("unknown")
                .to_string(),
        })
    }

    fn collect_logs(&self, container_name: &str) -> String {
        Command::new(&self.binary)
            .args(["logs", container_name])
            .output()
            .ok()
            .map(|output| {
                let mut text = String::from_utf8_lossy(&output.stdout).to_string();
                if !output.stderr.is_empty() {
                    text.push_str(&String::from_utf8_lossy(&output.stderr));
                }
                text
            })
            .unwrap_or_default()
    }

    fn exec_attach(&self, container_id: &str) -> WorkerResult<()> {
        let status = Command::new(&self.binary)
            .args(["exec", "-it", container_id, "/bin/sh"])
            .stdin(Stdio::inherit())
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .status()?;
        if !status.success() {
            return Err("interactive attach failed".into());
        }
        Ok(())
    }

    fn workload_root(&self, workload_id: &str) -> PathBuf {
        self.worker_data_dir.join("workloads").join(workload_id)
    }

    fn volume_mount_root(&self, workload_id: &str, locator: &str) -> PathBuf {
        self.workload_root(workload_id)
            .join("volumes")
            .join(locator)
    }

    fn ensure_workload_dirs(&self, workload_id: &str) -> WorkerResult<(PathBuf, PathBuf, PathBuf)> {
        let root = self.workload_root(workload_id);
        let workspace = root.join("workspace");
        let tmp = root.join("tmp");
        fs::create_dir_all(&workspace)?;
        fs::create_dir_all(&tmp)?;
        Ok((root, workspace, tmp))
    }

    fn prepare_volume_mounts(
        &self,
        workload: &WorkloadRecord,
    ) -> WorkerResult<Vec<PreparedVolumeMount>> {
        let mut prepared = Vec::new();
        for mount in &workload.volume_mounts {
            let local_dir = self.volume_mount_root(&workload.workload_id, &mount.locator);
            fs::create_dir_all(&local_dir)?;
            prepared.push(PreparedVolumeMount {
                locator: mount.locator.clone(),
                mount_path: mount.mount_path.clone(),
                local_dir,
                read_only: mount.read_only,
            });
        }
        Ok(prepared)
    }

    fn cleanup_workload_dirs(&self, workload_id: &str) {
        let _ = fs::remove_dir_all(self.workload_root(workload_id));
    }

    fn workload_name(workload_id: &str) -> String {
        format!("boxty-{workload_id}")
    }

    fn base_env_args(env: &HashMap<String, String>) -> Vec<String> {
        let mut args = Vec::new();
        for (key, value) in env {
            args.push("-e".to_string());
            args.push(format!("{key}={value}"));
        }
        args
    }

    fn base_runtime_args(
        &self,
        workload: &WorkloadRecord,
        workspace: &PathBuf,
        tmp: &PathBuf,
        volume_mounts: &[PreparedVolumeMount],
    ) -> Vec<String> {
        let mut args = vec![
            "--workdir".to_string(),
            "/workspace".to_string(),
            "--cpus".to_string(),
            workload.resources.cpu_cores.to_string(),
            "--memory".to_string(),
            format!("{}m", workload.resources.memory_mb.max(128)),
            "--pids-limit".to_string(),
            "512".to_string(),
            "-v".to_string(),
            format!("{}:/workspace", workspace.display()),
            "-v".to_string(),
            format!("{}:/tmp/boxty", tmp.display()),
        ];
        for mount in volume_mounts {
            args.push("-v".to_string());
            let suffix = if mount.read_only { ":ro" } else { "" };
            args.push(format!(
                "{}:{}{}",
                mount.local_dir.display(),
                mount.mount_path,
                suffix
            ));
        }
        args
    }

    fn remove_container(&self, container_id: &str) {
        let _ = Command::new(&self.binary)
            .args(["rm", "-f", container_id])
            .output();
    }

    fn kill_container(&self, container_id: &str) -> WorkerResult<()> {
        let output = Command::new(&self.binary)
            .args(["rm", "-f", container_id])
            .output()?;
        if !output.status.success() {
            return Err(combine_output(&output).into());
        }
        Ok(())
    }

    fn default_command(workload: &WorkloadRecord) -> Vec<String> {
        if !workload.command.is_empty() {
            return workload.command.clone();
        }
        match workload.kind.as_str() {
            "function" => vec![
                "python".to_string(),
                "-c".to_string(),
                "print('boxty function completed')".to_string(),
            ],
            "sandbox" => vec!["sleep".to_string(), "infinity".to_string()],
            _ => vec!["sleep".to_string(), "infinity".to_string()],
        }
    }

    fn launch_function(
        &self,
        launch_spec: &WorkloadLaunchSpec,
    ) -> WorkerResult<RuntimeLaunchResult> {
        let workload = &launch_spec.workload;
        let (_root, workspace, tmp) = self.ensure_workload_dirs(&workload.workload_id)?;
        let volume_mounts = self.prepare_volume_mounts(workload)?;
        let container_name = Self::workload_name(&workload.workload_id);
        let mut args = vec![
            "run".to_string(),
            "--rm".to_string(),
            "--name".to_string(),
            container_name.clone(),
        ];
        args.extend(self.base_runtime_args(workload, &workspace, &tmp, &volume_mounts));
        args.extend(Self::base_env_args(&launch_spec.env));
        args.push(workload.image.clone());
        args.extend(Self::default_command(workload));
        let output = Command::new(&self.binary).args(&args).output()?;
        let logs = combine_output(&output);
        let exit_code = output.status.code().unwrap_or(1);
        let mut runtime_details = HashMap::new();
        runtime_details.insert(
            "container_runtime".to_string(),
            Value::String(self.binary.clone()),
        );
        runtime_details.insert("exit_code".to_string(), json!(exit_code));
        runtime_details.insert("stdout".to_string(), Value::String(logs.clone()));
        Ok(RuntimeLaunchResult {
            status: if exit_code == 0 {
                "completed".to_string()
            } else {
                "failed".to_string()
            },
            runtime_details,
            container_id: None,
            detached: false,
        })
    }

    fn launch_sandbox(
        &self,
        launch_spec: &WorkloadLaunchSpec,
    ) -> WorkerResult<RuntimeLaunchResult> {
        let workload = &launch_spec.workload;
        let (_root, workspace, tmp) = self.ensure_workload_dirs(&workload.workload_id)?;
        let volume_mounts = self.prepare_volume_mounts(workload)?;
        let container_name = Self::workload_name(&workload.workload_id);
        let mut args = vec![
            "run".to_string(),
            "-d".to_string(),
            "--name".to_string(),
            container_name.clone(),
        ];
        args.extend(self.base_runtime_args(workload, &workspace, &tmp, &volume_mounts));
        args.extend(Self::base_env_args(&launch_spec.env));
        args.push(workload.image.clone());
        args.extend(Self::default_command(workload));
        let output = Command::new(&self.binary).args(&args).output()?;
        if !output.status.success() {
            return Err(combine_output(&output).into());
        }
        let container_id = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let mut runtime_details = HashMap::new();
        runtime_details.insert(
            "container_runtime".to_string(),
            Value::String(self.binary.clone()),
        );
        runtime_details.insert(
            "container_id".to_string(),
            Value::String(container_id.clone()),
        );
        runtime_details.insert(
            "attach_command".to_string(),
            Value::String(format!("{} exec -it {} /bin/sh", self.binary, container_id)),
        );
        runtime_details.insert(
            "ssh_mode".to_string(),
            Value::String("sandbox_only".to_string()),
        );
        Ok(RuntimeLaunchResult {
            status: "running".to_string(),
            runtime_details,
            container_id: Some(container_id),
            detached: true,
        })
    }

    fn launch_service(
        &self,
        launch_spec: &WorkloadLaunchSpec,
    ) -> WorkerResult<RuntimeLaunchResult> {
        let workload = &launch_spec.workload;
        let (_root, workspace, tmp) = self.ensure_workload_dirs(&workload.workload_id)?;
        let volume_mounts = self.prepare_volume_mounts(workload)?;
        let host_port = reserve_local_port()?;
        let container_port = workload
            .metadata
            .get("container_port")
            .and_then(Value::as_u64)
            .unwrap_or(8000) as u16;
        let container_name = Self::workload_name(&workload.workload_id);
        let mut args = vec![
            "run".to_string(),
            "-d".to_string(),
            "--name".to_string(),
            container_name.clone(),
            "-p".to_string(),
            format!("127.0.0.1:{host_port}:{container_port}"),
        ];
        args.extend(self.base_runtime_args(workload, &workspace, &tmp, &volume_mounts));
        args.extend(Self::base_env_args(&launch_spec.env));
        args.push(workload.image.clone());
        args.extend(Self::default_command(workload));
        let output = Command::new(&self.binary).args(&args).output()?;
        if !output.status.success() {
            return Err(combine_output(&output).into());
        }
        let container_id = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let mut runtime_details = HashMap::new();
        runtime_details.insert(
            "container_runtime".to_string(),
            Value::String(self.binary.clone()),
        );
        runtime_details.insert(
            "container_id".to_string(),
            Value::String(container_id.clone()),
        );
        runtime_details.insert("host_port".to_string(), json!(host_port));
        runtime_details.insert("container_port".to_string(), json!(container_port));
        runtime_details.insert(
            "origin_url".to_string(),
            Value::String(format!("http://127.0.0.1:{host_port}")),
        );
        Ok(RuntimeLaunchResult {
            status: "running".to_string(),
            runtime_details,
            container_id: Some(container_id),
            detached: true,
        })
    }
}

async fn hydrate_volume_mounts(
    client: &ControlPlaneClient,
    provider_id: &str,
    provider_token: &str,
    runtime: &WorkerRuntime,
    workload: &WorkloadRecord,
) -> WorkerResult<Vec<PreparedVolumeMount>> {
    let mounts = runtime.prepare_volume_mounts(workload)?;
    for mount in &mounts {
        fs::create_dir_all(&mount.local_dir)?;
        let entries = client
            .list_volume_entries(Some(provider_id), Some(provider_token), &mount.locator)
            .await?;
        for entry in entries {
            if entry.entry_type != "file" {
                continue;
            }
            let bytes = client
                .get_volume_blob(
                    Some(provider_id),
                    Some(provider_token),
                    &mount.locator,
                    &entry.path,
                )
                .await?;
            let destination = mount.local_dir.join(&entry.path);
            if let Some(parent) = destination.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::write(destination, bytes)?;
        }
    }
    Ok(mounts)
}

async fn sync_volume_mounts(
    client: &ControlPlaneClient,
    provider_id: &str,
    provider_token: &str,
    mounts: &[crate::state::ProviderVolumeMount],
) -> WorkerResult<()> {
    for mount in mounts {
        if mount.read_only {
            continue;
        }
        let local_dir = PathBuf::from(&mount.local_path);
        if !local_dir.exists() {
            continue;
        }

        let remote_entries = client
            .list_volume_entries(Some(provider_id), Some(provider_token), &mount.locator)
            .await?;
        let mut remote_files: HashMap<String, u64> = HashMap::new();
        for entry in remote_entries {
            if entry.entry_type == "file" {
                remote_files.insert(entry.path, entry.size.unwrap_or(0));
            }
        }

        let local_files = collect_local_files(&local_dir)?;
        for (relative, absolute, _size) in &local_files {
            client
                .put_volume_blob(
                    Some(provider_id),
                    Some(provider_token),
                    &mount.locator,
                    relative,
                    fs::read(absolute)?,
                )
                .await?;
        }

        let local_set: std::collections::HashSet<String> = local_files
            .iter()
            .map(|(relative, _, _)| relative.clone())
            .collect();
        for remote_path in remote_files.keys() {
            if !local_set.contains(remote_path) {
                client
                    .delete_volume_blob(
                        Some(provider_id),
                        Some(provider_token),
                        &mount.locator,
                        remote_path,
                    )
                    .await?;
            }
        }
    }

    Ok(())
}

pub async fn handle_worker(
    config_path: &str,
    attach_session_token: Option<&str>,
    once: bool,
) -> WorkerResult<()> {
    let config = load_worker_config(config_path)?;
    let runtime = WorkerRuntime::new()?;
    let client = ControlPlaneClient::new(&config.control_plane.url)?;
    let task_timeout_sec = config.worker.task_timeout_sec;
    let max_retries = config.control_plane.max_retries.max(1);
    let mut consecutive_failures = 0u32;

    let shutdown = Arc::new(AtomicBool::new(false));
    let shutdown_clone = shutdown.clone();
    tokio::spawn(async move {
        let mut sigterm = match tokio::signal::unix::signal(
            tokio::signal::unix::SignalKind::terminate(),
        ) {
            Ok(s) => s,
            Err(_) => return,
        };
        let mut sigint = match tokio::signal::unix::signal(
            tokio::signal::unix::SignalKind::interrupt(),
        ) {
            Ok(s) => s,
            Err(_) => return,
        };
        tokio::select! {
            _ = sigterm.recv() => {},
            _ = sigint.recv() => {},
            _ = tokio::signal::ctrl_c() => {},
        }
        shutdown_clone.store(true, Ordering::SeqCst);
        println!("[worker] shutdown signal received, draining...");
    });

    if let Some(token) = attach_session_token {
        return handle_worker_attach(&client, &runtime, token).await;
    }

    let mut state = build_initial_state(&config);
    let detected = crate::cli::provider::detect_resources();
    state.detected_cpu = detected.cpu_cores;
    state.detected_ram_mb = detected.ram_mb;
    state.detected_disk_gb = detected.disk_gb;
    state.shared_cpu = config
        .resources
        .max_cpu_cores
        .min(detected.cpu_cores)
        .max(1);
    state.shared_ram_mb = config
        .resources
        .max_memory_mb
        .min(detected.ram_mb.floor() as u32) as f64;
    state.disk_gb = detected.disk_gb.max(1);
    state.max_instances = config.worker.concurrency;
    state.last_updated_at = chrono::Utc::now().to_rfc3339();
    persist_state(&state);

    maybe_start_gateway();

    let control_plane_url = config.control_plane.url.clone();
    tokio::spawn(async move {
        crate::cli::tunnel::run_tunnel_loop(control_plane_url).await;
    });

    let retry_delay = Duration::from_millis(config.control_plane.retry_interval_ms.max(500));

    loop {
        let mut state = load_provider_state().unwrap_or_else(|| build_initial_state(&config));
        state.detected_cpu = detected.cpu_cores;
        state.detected_ram_mb = detected.ram_mb;
        state.detected_disk_gb = detected.disk_gb;
        state.shared_cpu = config
            .resources
            .max_cpu_cores
            .min(detected.cpu_cores)
            .max(1);
        state.shared_ram_mb = config
            .resources
            .max_memory_mb
            .min(detected.ram_mb.floor() as u32) as f64;
        state.disk_gb = detected.disk_gb.max(1);
        state.mode = "worker".to_string();
        state.control_plane_url = config.control_plane.url.clone();
        state.provider_pool = config.control_plane.provider_pool.clone();
        state.region = config.node.region.clone();

        if state.provider_id.is_empty() {
            match client.register_provider(&config, &detected).await {
                Ok(provider) => {
                    state.provider_id = provider.provider_id;
                    state.provider_auth_token = provider.provider_token;
                    state.last_error.clear();
                    consecutive_failures = 0;
                }
                Err(error) => {
                    consecutive_failures += 1;
                    state.last_error = format!("register failed: {error}");
                    state.last_updated_at = chrono::Utc::now().to_rfc3339();
                    persist_state(&state);
                    tokio::time::sleep(retry_delay).await;
                    if once || consecutive_failures >= max_retries {
                        return Err(error);
                    }
                    continue;
                }
            }
        }

        if state.provider_auth_token.is_empty() {
            state.provider_id.clear();
            state.last_error =
                "provider runtime token missing; forcing re-registration".to_string();
            persist_state(&state);
            continue;
        }

        reconcile_jobs(&client, &runtime, &mut state, task_timeout_sec).await?;

        let running_jobs = state
            .jobs
            .iter()
            .filter(|job| job.status == "running")
            .count() as u32;
        let available_slots = if shutdown.load(Ordering::SeqCst) {
            0
        } else {
            config.worker.concurrency.saturating_sub(running_jobs)
        };

        let status = if shutdown.load(Ordering::SeqCst) {
            "draining"
        } else {
            "online"
        };
        match client
            .heartbeat_provider(
                &state.provider_id,
                &state.provider_auth_token,
                available_slots,
                running_jobs,
                status,
            )
            .await
        {
            Ok(()) => {
                state.status = "ACTIVE".to_string();
                state.last_error.clear();
                consecutive_failures = 0;
            }
            Err(error) => {
                consecutive_failures += 1;
                let should_reregister = error
                    .downcast_ref::<WorkerHttpError>()
                    .map(|http| matches!(http.status, 403 | 404))
                    .unwrap_or(false);
                if should_reregister {
                    state.provider_id.clear();
                    state.provider_auth_token.clear();
                }
                state.last_error = format!("heartbeat failed: {error}");
                state.last_updated_at = chrono::Utc::now().to_rfc3339();
                persist_state(&state);
                tokio::time::sleep(retry_delay).await;
                if once || consecutive_failures >= max_retries {
                    return Err(error);
                }
                continue;
            }
        }

        if !shutdown.load(Ordering::SeqCst) {
            if available_slots > 0 {
                match client
                    .claim_next_assignment(&state.provider_id, &state.provider_auth_token)
                    .await
                {
                    Ok(Some(assignment)) => {
                        launch_assignment(&client, &runtime, &mut state, assignment.workload).await?;
                    }
                    Ok(None) => {}
                    Err(error) => {
                        consecutive_failures += 1;
                        state.last_error = format!("claim failed: {error}");
                    }
                }
            }
        } else if running_jobs == 0 {
            if let Err(e) = client
                .unregister_provider(&state.provider_id, &state.provider_auth_token)
                .await
            {
                eprintln!("[worker] unregister failed: {e}");
            }
            state.provider_id.clear();
            state.provider_auth_token.clear();
            persist_state(&state);
            println!("[worker] gracefully shut down");
            break;
        }

        state.active_jobs = state
            .jobs
            .iter()
            .filter(|job| job.status == "running")
            .count() as u32;
        state.last_updated_at = chrono::Utc::now().to_rfc3339();
        persist_state(&state);

        if once {
            break;
        }
        let interval = config.worker.heartbeat_interval_sec.max(1);
        for _ in 0..interval {
            if shutdown.load(Ordering::SeqCst) {
                break;
            }
            tokio::time::sleep(Duration::from_secs(1)).await;
        }
    }

    Ok(())
}

async fn handle_worker_attach(
    client: &ControlPlaneClient,
    runtime: &WorkerRuntime,
    session_token: &str,
) -> WorkerResult<()> {
    let state = load_provider_state().ok_or("worker state not found")?;
    let session = client
        .verify_sandbox_session(
            Some(&state.provider_id),
            Some(&state.provider_auth_token),
            session_token,
        )
        .await?;
    let job = state
        .jobs
        .iter()
        .find(|job| {
            job.workload_id == session.workload_id
                && job.job_type == "sandbox"
                && job.status == "running"
        })
        .ok_or("sandbox workload is not running on this worker")?;
    runtime.exec_attach(&job.container_id)?;
    Ok(())
}

async fn launch_assignment(
    client: &ControlPlaneClient,
    runtime: &WorkerRuntime,
    state: &mut crate::state::ProviderState,
    workload: WorkloadRecord,
) -> WorkerResult<()> {
    let launched_at = chrono::Utc::now();
    let launch_spec = client
        .workload_launch_spec(
            &state.provider_id,
            &state.provider_auth_token,
            &workload.workload_id,
        )
        .await?;
    let prepared_mounts = hydrate_volume_mounts(
        client,
        &state.provider_id,
        &state.provider_auth_token,
        runtime,
        &launch_spec.workload,
    )
    .await?;
    let result = runtime.launch(&launch_spec)?;

    if result.detached {
        let mut runtime_details = result.runtime_details.clone();
        runtime_details.insert(
            "launched_at".to_string(),
            Value::String(launched_at.to_rfc3339()),
        );
        client
            .update_workload_status(
                &state.provider_id,
                &state.provider_auth_token,
                &workload.workload_id,
                &result.status,
                runtime_details,
            )
            .await?;
        state.jobs.push(crate::state::ProviderJob {
            id: workload.workload_id.clone(),
            workload_id: workload.workload_id.clone(),
            job_type: workload.kind.clone(),
            client: workload.owner_id.clone(),
            cpu_cores: workload.resources.cpu_cores,
            ram_mb: workload.resources.memory_mb as f64,
            started_at: launched_at.to_rfc3339(),
            status: "running".to_string(),
            container_id: result.container_id.unwrap_or_default(),
            image: workload.image.clone(),
            endpoint_name: workload.endpoint_name.unwrap_or_default(),
            host_port: result
                .runtime_details
                .get("host_port")
                .and_then(Value::as_u64)
                .unwrap_or(0) as u16,
            last_metered_at: launched_at.to_rfc3339(),
            disk_gb: workload.resources.disk_gb,
            gpu_count: workload.resources.gpu_count,
            volume_mounts: prepared_mounts
                .into_iter()
                .map(|mount| crate::state::ProviderVolumeMount {
                    locator: mount.locator,
                    mount_path: mount.mount_path,
                    local_path: mount.local_dir.to_string_lossy().to_string(),
                    read_only: mount.read_only,
                })
                .collect(),
        });
        state.active_jobs = state
            .jobs
            .iter()
            .filter(|job| job.status == "running")
            .count() as u32;
        return Ok(());
    }

    let volume_mounts: Vec<crate::state::ProviderVolumeMount> = prepared_mounts
        .into_iter()
        .map(|mount| crate::state::ProviderVolumeMount {
            locator: mount.locator,
            mount_path: mount.mount_path,
            local_path: mount.local_dir.to_string_lossy().to_string(),
            read_only: mount.read_only,
        })
        .collect();
    sync_volume_mounts(
        client,
        &state.provider_id,
        &state.provider_auth_token,
        &volume_mounts,
    )
    .await?;

    let duration_seconds =
        (chrono::Utc::now() - launched_at).num_milliseconds().max(0) as f64 / 1000.0;
    let mut metadata = HashMap::new();
    metadata.insert(
        "source".to_string(),
        Value::String("boxty-worker-rust".to_string()),
    );
    metadata.insert("kind".to_string(), Value::String(workload.kind.clone()));
    client
        .meter_usage(
            &state.provider_id,
            &state.provider_auth_token,
            &workload.workload_id,
            &workload.resources,
            duration_seconds,
            metadata,
        )
        .await?;
    client
        .update_workload_status(
            &state.provider_id,
            &state.provider_auth_token,
            &workload.workload_id,
            &result.status,
            result.runtime_details,
        )
        .await?;
    runtime.cleanup_workload_dirs(&workload.workload_id);
    Ok(())
}

async fn reconcile_jobs(
    client: &ControlPlaneClient,
    runtime: &WorkerRuntime,
    state: &mut crate::state::ProviderState,
    task_timeout_sec: u64,
) -> WorkerResult<()> {
    let now = chrono::Utc::now();
    let mut keep = Vec::new();
    for mut job in state.jobs.clone() {
        if job.container_id.is_empty() {
            continue;
        }
        sync_volume_mounts(
            client,
            &state.provider_id,
            &state.provider_auth_token,
            &job.volume_mounts,
        )
        .await?;
        let inspect = runtime.inspect_container(&job.container_id)?;
        let delta_seconds = elapsed_seconds(&job.last_metered_at, now);
        if delta_seconds > 0.0 {
            let resources = WorkloadResources {
                cpu_cores: job.cpu_cores,
                memory_mb: job.ram_mb.round() as u32,
                disk_gb: job.disk_gb.max(1),
                gpu_count: job.gpu_count,
            };
            let mut metadata = HashMap::new();
            metadata.insert(
                "source".to_string(),
                Value::String("boxty-worker-rust".to_string()),
            );
            metadata.insert(
                "job_status".to_string(),
                Value::String(inspect.status.clone()),
            );
            client
                .meter_usage(
                    &state.provider_id,
                    &state.provider_auth_token,
                    &job.workload_id,
                    &resources,
                    delta_seconds,
                    metadata,
                )
                .await?;
            job.last_metered_at = now.to_rfc3339();
        }

        let timed_out = elapsed_seconds(&job.started_at, now) > task_timeout_sec as f64;
        if inspect.running && !timed_out {
            keep.push(job);
            continue;
        }

        let logs = runtime.collect_logs(&job.container_id);
        let inspect = if timed_out {
            runtime.kill_container(&job.container_id)?;
            runtime.inspect_container(&job.container_id)?
        } else {
            inspect
        };

        let mut runtime_details = HashMap::new();
        runtime_details.insert(
            "container_runtime".to_string(),
            Value::String(runtime.binary.clone()),
        );
        runtime_details.insert(
            "container_id".to_string(),
            Value::String(job.container_id.clone()),
        );
        runtime_details.insert("logs".to_string(), Value::String(logs));
        runtime_details.insert("exit_code".to_string(), json!(inspect.exit_code));
        if job.host_port > 0 {
            runtime_details.insert("host_port".to_string(), json!(job.host_port));
            runtime_details.insert(
                "origin_url".to_string(),
                Value::String(format!("http://127.0.0.1:{}", job.host_port)),
            );
        }
        if timed_out {
            runtime_details.insert("timeout_seconds".to_string(), json!(task_timeout_sec));
            runtime_details.insert(
                "failure_reason".to_string(),
                Value::String("task_timeout".to_string()),
            );
        }
        let terminal_status = if !timed_out && inspect.exit_code == 0 {
            "completed"
        } else {
            "failed"
        };
        client
            .update_workload_status(
                &state.provider_id,
                &state.provider_auth_token,
                &job.workload_id,
                terminal_status,
                runtime_details,
            )
            .await?;
        runtime.remove_container(&job.container_id);
        runtime.cleanup_workload_dirs(&job.workload_id);
    }
    state.jobs = keep;
    state.active_jobs = state
        .jobs
        .iter()
        .filter(|job| job.status == "running")
        .count() as u32;
    Ok(())
}

fn build_initial_state(config: &WorkerConfig) -> crate::state::ProviderState {
    let now = chrono::Utc::now().to_rfc3339();
    crate::state::ProviderState {
        pid: std::process::id(),
        tier: config.control_plane.provider_pool.clone(),
        disk_gb: 0,
        instances: config.worker.concurrency,
        shared_cpu: 0,
        shared_ram_mb: 0.0,
        signaling: config.control_plane.url.clone(),
        status: "STARTING".to_string(),
        started_at: now.clone(),
        last_updated_at: now,
        provider_id: String::new(),
        provider_auth_token: String::new(),
        mode: "worker".to_string(),
        control_plane_url: config.control_plane.url.clone(),
        provider_pool: config.control_plane.provider_pool.clone(),
        region: config.node.region.clone(),
        last_error: String::new(),
        detected_cpu: 0,
        detected_ram_mb: 0.0,
        detected_disk_gb: 0,
        wallet_address: String::new(),
        max_instances: config.worker.concurrency,
        active_jobs: 0,
        jobs: Vec::new(),
    }
}

fn load_provider_state() -> Option<crate::state::ProviderState> {
    crate::state::read_json::<Option<crate::state::ProviderState>>(
        &crate::state::provider_path(),
        None,
    )
}

fn persist_state(state: &crate::state::ProviderState) {
    crate::state::write_json(&crate::state::provider_path(), state);
}

fn load_worker_config(path: &str) -> WorkerResult<WorkerConfig> {
    let contents = std::fs::read_to_string(PathBuf::from(path))?;
    Ok(serde_json::from_str(&contents)?)
}

fn maybe_start_gateway() {
    let port = std::env::var("BOXTY_GATEWAY_PORT")
        .ok()
        .and_then(|value| value.parse::<u16>().ok())
        .unwrap_or(0);
    if port == 0 {
        return;
    }
    let host = std::env::var("BOXTY_GATEWAY_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    tokio::spawn(async move {
        if let Err(error) = crate::gateway::serve_with(port, &host).await {
            eprintln!("[worker/gateway] failed to start local gateway: {error}");
        }
    });
}

fn collect_local_files(root: &PathBuf) -> WorkerResult<Vec<(String, PathBuf, u64)>> {
    let mut files = Vec::new();
    let mut stack = vec![root.clone()];
    while let Some(dir) = stack.pop() {
        for entry in fs::read_dir(&dir)? {
            let entry = entry?;
            let path = entry.path();
            let metadata = entry.metadata()?;
            if metadata.is_dir() {
                stack.push(path);
                continue;
            }
            if !metadata.is_file() {
                continue;
            }
            let relative = path
                .strip_prefix(root)?
                .to_string_lossy()
                .replace('\\', "/");
            files.push((relative, path, metadata.len()));
        }
    }
    Ok(files)
}

fn elapsed_seconds(since: &str, now: chrono::DateTime<chrono::Utc>) -> f64 {
    chrono::DateTime::parse_from_rfc3339(since)
        .map(|timestamp| {
            let delta = now.signed_duration_since(timestamp.with_timezone(&chrono::Utc));
            delta.num_milliseconds().max(0) as f64 / 1000.0
        })
        .unwrap_or(0.0)
}

fn combine_output(output: &Output) -> String {
    let mut body = String::from_utf8_lossy(&output.stdout).to_string();
    if !output.stderr.is_empty() {
        body.push_str(&String::from_utf8_lossy(&output.stderr));
    }
    body
}

fn reserve_local_port() -> WorkerResult<u16> {
    let listener = std::net::TcpListener::bind("127.0.0.1:0")?;
    let port = listener.local_addr()?.port();
    drop(listener);
    Ok(port)
}

fn detect_runtime_binary(preferred: &str) -> WorkerResult<String> {
    if binary_exists(preferred) {
        return Ok(preferred.to_string());
    }
    for candidate in ["docker", "podman"] {
        if binary_exists(candidate) {
            return Ok(candidate.to_string());
        }
    }
    Err("no container runtime found; expected docker or podman".into())
}

fn binary_exists(binary: &str) -> bool {
    std::env::var_os("PATH")
        .map(|paths| {
            std::env::split_paths(&paths).any(|path| {
                let candidate = path.join(binary);
                candidate.exists() && candidate.is_file()
            })
        })
        .unwrap_or(false)
}
