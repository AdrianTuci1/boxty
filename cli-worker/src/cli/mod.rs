pub mod client;
pub mod provider;
pub mod tunnel;
pub mod worker;

use clap::{Parser, Subcommand};

pub fn get_welcome_banner() -> String {
    let wallet = crate::wallet::Wallet::new();
    let apps = crate::cli::client::read_apps();
    let active_peers = if apps.is_empty() {
        3
    } else {
        apps.len() * 2 + 3
    };
    format!(
        r#"======================================================================
 ____               _            
|  _ \  ___  __  __| |_ _   _    
| |_) |/ _ \ \ \/ /| __| | | |   
|  _ <| (_) | >  < | |_| |_| |   
| |_) | \___/ /_/\_\ \__|\__, |   
|____/                   |___/    
  Decentralized P2P AI Agents, Functions & Web Endpoints
======================================================================

[Swarm Status]
  - Active Swarm Peers : {} Connected (Local Mesh)
  - Signaling Server   : CONNECTED (dns4/signaling.boxty.dev)
  - Active Deployments : {} Running

[Local Node Status]
  - Node Identity (ID) : {}
  - Wallet Address     : {} (Ed25519)
  - Account Balance    : {:.2} USDC"#,
        active_peers,
        apps.len(),
        wallet.address,
        wallet.address,
        wallet.get_balance()
    )
}

#[derive(Parser, Debug)]
#[command(name = "boxty")]
#[command(author = "Adrian Tucicovenco")]
#[command(version = "1.0.0")]
#[command(about = "Boxty: Decentralized P2P AI Agents, Functions & Web Endpoints", long_about = None)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Option<Commands>,

    /// P2P Signaling / Relay server multiaddress
    #[arg(
        short,
        long,
        global = true,
        default_value = "/dns4/signaling.boxty.dev/tcp/4001/p2p/QmSignalingServer1234567890"
    )]
    pub signaling: String,

    /// Bypass Solana escrow payment validation (Founder Mode)
    #[arg(long, global = true, default_value_t = false)]
    pub bypass_escrow: bool,
}

#[derive(Subcommand, Debug)]
pub enum Commands {
    /// Execute a single serverless function (starts, returns result, shuts down)
    Function {
        /// Path to the compiled .wasm agent file
        #[arg(short, long)]
        wasm: String,

        /// Number of nodes for consensus replication (e.g. 3)
        #[arg(short, long, default_value_t = 3)]
        replication: usize,

        /// Secret to attach to the function (e.g. --secret OPENAI_API_KEY)
        #[arg(long)]
        secret: Vec<String>,

        /// Persistent volume to mount (e.g. --volume my-vol:/data)
        #[arg(long)]
        volume: Vec<String>,
    },
    /// Run a script/function (alias for function)
    Run {
        /// Path to the compiled .wasm agent file
        #[arg(short, long)]
        wasm: String,

        /// Number of nodes for consensus replication (e.g. 3)
        #[arg(short, long, default_value_t = 3)]
        replication: usize,

        /// Secret to attach to the run script (e.g. --secret OPENAI_API_KEY)
        #[arg(long)]
        secret: Vec<String>,

        /// Persistent volume to mount (e.g. --volume my-vol:/data)
        #[arg(long)]
        volume: Vec<String>,
    },
    /// Start an interactive sandbox environment with an idle timeout
    Sandbox {
        /// Base OCI/Docker image to run (e.g. "ubuntu:latest")
        #[arg(short, long)]
        image: String,

        /// Idle timeout in seconds before the sandbox shuts down (default: 300)
        #[arg(long, default_value_t = 300)]
        timeout: u32,

        /// Secret to attach to the sandbox (e.g. --secret MY_API_KEY)
        #[arg(long)]
        secret: Vec<String>,

        /// Persistent volume to mount (e.g. --volume my-vol:/data)
        #[arg(long)]
        volume: Vec<String>,
    },
    /// Start an interactive shell (alias for sandbox)
    Shell {
        /// Base OCI/Docker image to run (e.g. "ubuntu:latest")
        #[arg(short, long)]
        image: String,

        /// Idle timeout in seconds before the sandbox shuts down (default: 300)
        #[arg(long, default_value_t = 300)]
        timeout: u32,

        /// Secret to attach to the shell (e.g. --secret MY_API_KEY)
        #[arg(long)]
        secret: Vec<String>,

        /// Persistent volume to mount (e.g. --volume my-vol:/data)
        #[arg(long)]
        volume: Vec<String>,
    },
    /// Reconnect and attach to a running sandbox's interactive terminal session
    Attach {
        /// The Task ID to attach to
        task_id: u64,
    },
    /// Deploy a containerized agent workload (ephemeral sandbox like Modal)
    Deploy {
        /// Base OCI/Docker image to run (e.g. "python:3.10-slim")
        #[arg(short, long)]
        image: String,

        /// Dependencies to install in the sandbox (e.g. "pip install fastapi")
        #[arg(short, long)]
        install: Option<String>,

        /// Expose a serving port inside the sandbox (e.g. 8000)
        #[arg(short, long)]
        serve: Option<u16>,

        /// Idle timeout in seconds before Scale-to-Zero triggers (default: 300)
        #[arg(long, default_value_t = 300)]
        idle_timeout: u32,

        /// Secret to attach to the deployment (e.g. --secret STRIPE_KEY)
        #[arg(long)]
        secret: Vec<String>,

        /// Persistent volume to mount (e.g. --volume my-vol:/data)
        #[arg(long)]
        volume: Vec<String>,
    },
    /// Manage active applications (list or stop running tasks)
    App {
        #[command(subcommand)]
        app_command: AppCommands,
    },
    /// Start sharing local compute resources as a Boxty Provider
    Provider {
        /// The resource tier to provide (nano, micro, standard, pro, max). Auto-detected if not set.
        #[arg(long)]
        tier: Option<String>,

        /// Gigabytes of disk storage to share per instance (default: 2)
        #[arg(long)]
        disk: Option<u32>,

        /// Number of concurrent provider instances (workers) to run. Auto-calculated if not set.
        #[arg(long)]
        instances: Option<u32>,
    },
    /// Run the centralized Boxty worker agent against the FastAPI control plane
    Worker {
        /// Path to the worker JSON config file
        #[arg(long)]
        config: String,

        /// Validate a sandbox session token and attach locally
        #[arg(long)]
        attach_session_token: Option<String>,

        /// Execute a single worker loop iteration and exit
        #[arg(long, default_value_t = false)]
        once: bool,
    },
    /// Manage your Boxty Wallet and payment state channels
    Wallet {
        #[command(subcommand)]
        wallet_command: WalletCommands,
    },
    /// List available compute resource tiers and pricing
    Tiers,
    /// Start a local HTTP Gateway to access P2P apps (http://localhost:8080/<task_id>)
    Gateway {
        /// Local port to bind the gateway (default: 8080)
        #[arg(short, long, default_value_t = 8080)]
        port: u16,
    },
    /// Manage encrypted secrets shared with workloads
    Secret {
        #[command(subcommand)]
        secret_command: SecretCommands,
    },
    /// Manage persistent block/object volumes
    Volume {
        #[command(subcommand)]
        volume_command: VolumeCommands,
    },
    /// Manage replicated Dynamo-style databases
    Database {
        #[command(subcommand)]
        database_command: DatabaseCommands,
    },
    /// Scaffold a new Boxty app with a template
    Init {
        /// Output directory (default: current directory)
        #[arg(short, long, default_value = ".")]
        output: String,
        /// Programming language: py, js, or ts
        #[arg(short, long, default_value = "py")]
        lang: String,
    },
    /// Update the Boxty CLI to the latest version
    Update {
        /// Force update even if already on latest version
        #[arg(long, default_value_t = false)]
        force: bool,
    },
    /// Display version information
    Version,
    /// Login to the Boxty control plane (DEPRECATED: use boxty CLI instead)
    Login {
        /// External user ID (e.g., wallet address)
        #[arg(long)]
        external_user_id: String,
        /// Email address (optional)
        #[arg(long)]
        email: Option<String>,
    },
    /// Logout from the Boxty control plane (DEPRECATED: use boxty CLI instead)
    Logout,
    /// Show current user info (DEPRECATED: use boxty CLI instead)
    Whoami,
    /// Manage workspaces (DEPRECATED: use boxty CLI instead)
    Workspace {
        #[command(subcommand)]
        workspace_command: WorkspaceCommands,
    },
    /// Manage environments (DEPRECATED: use boxty CLI instead)
    Env {
        #[command(subcommand)]
        env_command: EnvCommands,
    },
    /// Manage applications / workloads (DEPRECATED: use boxty CLI instead)
    AppCtl {
        #[command(subcommand)]
        appctl_command: AppCtlCommands,
    },
    /// Manage routes / endpoints (DEPRECATED: use boxty CLI instead)
    Route {
        #[command(subcommand)]
        route_command: RouteCommands,
    },
    /// Manage schedules / cron jobs (DEPRECATED: use boxty CLI instead)
    Schedule {
        #[command(subcommand)]
        schedule_command: ScheduleCommands,
    },
    /// Manage images (DEPRECATED: use boxty CLI instead)
    Image {
        #[command(subcommand)]
        image_command: ImageCommands,
    },
    /// Billing and usage (DEPRECATED: use boxty CLI instead)
    Billing {
        #[command(subcommand)]
        billing_command: BillingCommands,
    },
    /// Dashboard status (DEPRECATED: use boxty CLI instead)
    Status {
        /// Watch mode - refresh every 5 seconds
        #[arg(long, default_value_t = false)]
        watch: bool,
    },
}

#[derive(Subcommand, Debug, Clone)]
pub enum AppCommands {
    /// List all running applications (similar to modal app list)
    List,
    /// Stop a running application (similar to modal app stop)
    Stop {
        /// The application/task ID to stop
        app_id: u64,
    },
}

#[derive(Subcommand, Debug, Clone)]
pub enum WorkspaceCommands {
    /// List workspaces
    List,
    /// Create a workspace
    Create {
        /// Workspace name
        #[arg(long)]
        name: String,
    },
    /// Delete a workspace
    Delete {
        /// Workspace ID
        workspace_id: String,
    },
    /// Show workspace details
    Show {
        /// Workspace ID
        workspace_id: String,
    },
    /// Switch active workspace
    Switch {
        /// Workspace ID
        workspace_id: String,
    },
}

#[derive(Subcommand, Debug, Clone)]
pub enum EnvCommands {
    /// List environments
    List {
        /// Workspace ID
        #[arg(long)]
        workspace_id: String,
    },
    /// Create an environment
    Create {
        /// Workspace ID
        #[arg(long)]
        workspace_id: String,
        /// Environment name
        #[arg(long)]
        name: String,
    },
    /// Delete an environment
    Delete {
        /// Environment ID
        environment_id: String,
    },
    /// Show environment details
    Show {
        /// Environment ID
        environment_id: String,
    },
    /// Switch active environment
    Switch {
        /// Environment ID
        environment_id: String,
    },
}

#[derive(Subcommand, Debug, Clone)]
pub enum AppCtlCommands {
    /// List workloads
    List,
    /// Deploy a workload
    Deploy {
        /// Workload name
        #[arg(long)]
        name: String,
        /// Workload kind (sandbox, function, endpoint, build)
        #[arg(long, default_value = "sandbox")]
        kind: String,
        /// Docker image
        #[arg(long)]
        image: String,
        /// Workspace ID
        #[arg(long)]
        workspace_id: String,
        /// Environment ID
        #[arg(long)]
        environment_id: String,
    },
    /// Stop a workload
    Stop {
        /// Workload ID
        workload_id: String,
    },
    /// Show workload details
    Show {
        /// Workload ID
        workload_id: String,
    },
    /// Get workload logs
    Logs {
        /// Workload ID
        workload_id: String,
    },
    /// Get workload metrics
    Metrics {
        /// Workload ID
        workload_id: String,
    },
}

#[derive(Subcommand, Debug, Clone)]
pub enum RouteCommands {
    /// List routes
    List,
    /// Create a route
    Create {
        /// Workload ID
        #[arg(long)]
        workload_id: String,
        /// Endpoint name
        #[arg(long)]
        endpoint_name: String,
    },
    /// Delete a route
    Delete {
        /// Route ID
        route_id: String,
    },
}

#[derive(Subcommand, Debug, Clone)]
pub enum ScheduleCommands {
    /// List schedules
    List,
    /// Create a schedule
    Create {
        /// Schedule name
        #[arg(long)]
        name: String,
        /// Schedule type (cron, interval)
        #[arg(long)]
        schedule_type: String,
        /// Schedule value (e.g., "0 * * * *" for cron)
        #[arg(long)]
        schedule_value: String,
        /// Function name to run
        #[arg(long)]
        function_name: String,
        /// Workspace ID
        #[arg(long)]
        workspace_id: String,
        /// Environment ID
        #[arg(long)]
        environment_id: String,
    },
    /// Delete a schedule
    Delete {
        /// Schedule ID
        schedule_id: String,
    },
    /// Trigger a schedule
    Trigger {
        /// Schedule ID
        schedule_id: String,
    },
}

#[derive(Subcommand, Debug, Clone)]
pub enum ImageCommands {
    /// List images
    List,
    /// Build an image
    Build {
        /// Image name
        #[arg(long)]
        name: String,
        /// Path to Dockerfile
        #[arg(long)]
        dockerfile: Option<String>,
        /// Base image
        #[arg(long)]
        base_image: Option<String>,
    },
}

#[derive(Subcommand, Debug, Clone)]
pub enum BillingCommands {
    /// Show account balance
    Balance,
    /// Show usage
    Usage,
    /// Add credits
    AddCredits {
        /// Amount in USD
        #[arg(long)]
        amount: f64,
    },
    /// Show pricing
    Pricing,
}

#[derive(Subcommand, Debug)]
pub enum WalletCommands {
    /// Generate a new Ed25519 identity keypair / wallet
    New,
    /// Display current wallet address (PeerID) and balance
    Status,
    /// Export the private key hex to connect to the Web Console
    Export,
}

#[derive(Subcommand, Debug)]
pub enum SecretCommands {
    /// List secrets
    List,
    /// Create or update a secret
    Save {
        #[arg(long)]
        name: String,
        /// One or more KEY=VALUE environment bindings
        #[arg(long = "env")]
        env: Vec<String>,
    },
    /// Delete a secret by name or id
    Delete { locator: String },
}

#[derive(Subcommand, Debug)]
pub enum VolumeCommands {
    /// List volumes
    List,
    /// Create a volume
    Create {
        #[arg(long)]
        name: String,
        #[arg(long, default_value_t = 10)]
        size_gb: u32,
        #[arg(long, default_value = "block-storage")]
        volume_type: String,
    },
    /// Delete a volume by name or id
    Delete { locator: String },
    /// List entries from a volume path
    Ls {
        locator: String,
        #[arg(long, default_value = "")]
        path: String,
    },
    /// Copy a local file into a volume
    Put {
        locator: String,
        source: String,
        #[arg(long)]
        path: String,
    },
    /// Delete a file or directory from a volume
    Rm {
        locator: String,
        #[arg(long)]
        path: String,
    },
    /// Print the public object URL for a key on an object-storage volume
    Url {
        locator: String,
        #[arg(long)]
        path: String,
        #[arg(long, default_value_t = 8080)]
        port: u16,
    },
}

#[derive(Subcommand, Debug)]
pub enum DatabaseCommands {
    /// List databases
    List,
    /// Create a database
    Create {
        #[arg(long)]
        name: String,
        #[arg(long)]
        pk: String,
        #[arg(long, default_value = "")]
        sk: String,
        #[arg(long, default_value = "")]
        gsi_name: String,
        #[arg(long, default_value = "")]
        gsi_pk: String,
        #[arg(long, default_value = "")]
        gsi_sk: String,
    },
    /// Delete a database by name or id
    Delete { locator: String },
    /// List all items in a database
    Items { locator: String },
    /// Upsert an item from inline JSON or a file
    Put {
        locator: String,
        #[arg(long)]
        json: Option<String>,
        #[arg(long)]
        file: Option<String>,
    },
    /// Delete an item by PK and SK
    DeleteItem {
        locator: String,
        #[arg(long)]
        pk: String,
        #[arg(long, default_value = "")]
        sk: String,
    },
    /// Query items by PK/SK or GSI
    Query {
        locator: String,
        #[arg(long)]
        pk: Option<String>,
        #[arg(long)]
        sk: Option<String>,
        #[arg(long)]
        sk_begins_with: Option<String>,
        #[arg(long)]
        sk_from: Option<String>,
        #[arg(long)]
        sk_to: Option<String>,
        #[arg(long)]
        gsi_pk: Option<String>,
        #[arg(long)]
        gsi_sk: Option<String>,
        #[arg(long)]
        gsi_sk_begins_with: Option<String>,
        #[arg(long)]
        gsi_sk_from: Option<String>,
        #[arg(long)]
        gsi_sk_to: Option<String>,
        #[arg(long)]
        limit: Option<usize>,
    },
}
