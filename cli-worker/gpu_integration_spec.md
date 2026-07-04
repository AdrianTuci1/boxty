# Boxty CLI: GPU Integration Specification

This document details the step-by-step architectural and implementation specification to add **native GPU auto-detection and execution** to the `boxty` Rust CLI and P2P provider network.

---

## 1. Rust Dependencies (NVIDIA NVML)

To query NVIDIA hardware details directly from the host system, we use **NVML (NVIDIA Management Library)**. The safest way to do this in Rust is via the `nvml-wrapper` crate, which links dynamically to the host's `libnvidia-ml.so` (Linux) or `nvml.dll` (Windows).

Add the following to `Cargo.toml`:
```toml
[dependencies]
# Safe wrapper around NVIDIA Management Library (NVML)
nvml-wrapper = "0.9.0"
```

---

## 2. Implementing GPU Discovery in Rust (`gpu.rs`)

Create a new file `src/wallet/gpu.rs` or `src/cli/gpu.rs` to handle hardware discovery:

```rust
use nvml_wrapper::Nvml;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GpuInfo {
    pub name: String,
    pub vram_mb: u64,
    pub cuda_cores: u32,
    pub driver_version: String,
}

/// Detects if an NVIDIA GPU is present and returns its hardware specifications
pub fn detect_nvidia_gpus() -> Result<Vec<GpuInfo>, Box<dyn std::error::Error>> {
    // Initialize the NVML library
    let nvml = Nvml::init()?;
    let device_count = nvml.device_count()?;
    let mut gpus = Vec::new();

    for i in 0..device_count {
        let device = nvml.device_by_index(i)?;
        let name = device.name()?;
        
        // Query memory information (bytes to MB)
        let mem_info = device.memory_info()?;
        let vram_mb = mem_info.total / (1024 * 1024);
        
        // Query CUDA driver version
        let driver_version = nvml.sys_driver_version()?;
        
        // Approximate cores or fetch from device structure if available
        let cuda_cores = match name.as_str() {
            n if n.contains("4090") => 16384,
            n if n.contains("3090") => 10496,
            n if n.contains("A100") => 6912,
            n if n.contains("H100") => 16896,
            _ => 2048, // Fallback default
        };

        gpus.push(GpuInfo {
            name,
            vram_mb,
            cuda_cores,
            driver_version,
        });
    }

    Ok(gpus)
}
```

---

## 3. Dynamic DHT Resource Advertising

When starting the provider node in `src/cli/provider.rs`, we replace the hardcoded resource tier check with the dynamic hardware profile:

```rust
// In src/cli/provider.rs
pub async fn handle_provider(...) {
    // 1. Auto-detect CPU & RAM
    let mut sys = sysinfo::System::new_all();
    sys.refresh_all();
    let cores = sys.cpus().len();
    let ram_mb = sys.total_memory() / (1024 * 1024); // KB to MB

    // 2. Auto-detect GPUs
    let gpus = match detect_nvidia_gpus() {
        Ok(found) => {
            println!("   [GPU] Detected {} active NVIDIA GPU(s):", found.len());
            for gpu in &found {
                println!("         - {} ({} MB VRAM)", gpu.name, gpu.vram_mb);
            }
            found
        }
        Err(_) => {
            println!("   [GPU] No active NVIDIA GPU detected (CPU-only execution enabled).");
            Vec::new()
        }
    };

    // 3. Serialize this profile and advertise on Kademlia DHT topic
    let provider_profile = serde_json::json!({
        "peer_id": local_peer_id,
        "cpu_cores": cores,
        "ram_mb": ram_mb,
        "gpus": gpus,
        "status": "idle"
    });
    
    // Broadcast metadata...
}
```

---

## 4. Container Isolation & GPU Passthrough (NVIDIA Container Toolkit)

When the provider's runtime daemon (like `containerd` or Docker daemon) spawns a container to execute an incoming client workload, it must inject the GPU resources.

If using Docker's SDK or CLI spawning from Rust (`std::process::Command` in `src/cli/client.rs` / `provider.rs`):

```rust
// Modify container spawning arguments in Rust:
let mut command = std::process::Command::new("docker");
command.arg("run");

// 1. If the workload requested a GPU, add the NVIDIA GPU runtime flags
if task_requires_gpu {
    command.arg("--gpus").arg("all");
    command.arg("--runtime=nvidia");
    command.env("NVIDIA_VISIBLE_DEVICES", "all");
    command.env("NVIDIA_DRIVER_CAPABILITIES", "all");
}

command.arg("-d")
       .arg("--name").arg(format!("boxty-task-{}", task_id))
       .arg(image_name);
```

---

## 5. Host Setup Verification Checklist

For a provider's server node to successfully run the GPU-enabled CLI, the host machine must satisfy the following checklist:

1. **Verify NVIDIA GPU Presence:**
   ```bash
   lspci | grep -i nvidia
   ```
2. **Verify CUDA Driver Installation:**
   ```bash
   nvidia-smi
   ```
3. **Install NVIDIA Container Toolkit (allows Docker to access CUDA):**
   ```bash
   # Add repository
   curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
   
   # Install package
   sudo apt-get update
   sudo apt-get install -y nvidia-container-toolkit
   
   # Restart Docker daemon
   sudo systemctl restart docker
   ```
4. **Test Docker GPU Passthrough:**
   ```bash
   docker run --rm --gpus all nvidia/cuda:12.0.0-base-ubuntu22.04 nvidia-smi
   ```
   *If this returns the GPU status table inside the container, the provider is ready to serve GPU workloads on Boxty!*
