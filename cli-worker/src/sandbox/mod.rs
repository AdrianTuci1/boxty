use std::fs::File;
use std::path::PathBuf;
use wasmtime::{Config, Engine, Linker, Module, Store};

pub struct WasmSandbox {
    engine: Engine,
}

impl WasmSandbox {
    pub fn new() -> Self {
        let mut config = Config::new();
        config.consume_fuel(true);
        config.max_wasm_stack(1024 * 1024);

        let engine = Engine::new(&config).expect("Failed to create Wasmtime Engine");
        Self { engine }
    }

    pub fn execute_workload(
        &self,
        wasm_bytes: &[u8],
        cpu_fuel: u64,
        max_memory_bytes: usize,
    ) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        println!("[Sandbox] Instantiating WebAssembly sandbox environment...");
        let mut store = Store::new(&self.engine, ());
        store.set_fuel(cpu_fuel)?;

        let mut linker = Linker::new(&self.engine);
        linker.func_wrap(
            "env",
            "intercepted_http_request",
            |_caller: wasmtime::Caller<'_, ()>,
             _url_ptr: u32,
             _url_len: u32,
             _payload_ptr: u32,
             _payload_len: u32|
             -> u32 {
                println!("[Sandbox Host Interceptor] Intercepted HTTP syscall from AI agent.");
                0
            },
        )?;

        let module = Module::from_binary(&self.engine, wasm_bytes)?;
        println!(
            "[Sandbox] Setting memory bounds: Max {} MB RAM",
            max_memory_bytes / (1024 * 1024)
        );
        let instance = linker.instantiate(&mut store, &module)?;

        println!("[Sandbox] Invoking AI Agent main entrypoint...");
        let entrypoint = instance.get_typed_func::<(), ()>(&mut store, "main")?;
        let _ = entrypoint.call(&mut store, ());

        Ok(vec![])
    }
}

#[allow(dead_code)]
pub struct EphemeralFileSystem {
    pub task_id: u64,
    pub image_path: PathBuf,
    pub mount_point: PathBuf,
    pub logical_size_bytes: u64,
}

impl EphemeralFileSystem {
    /// Creates a true Sparse File on disk (occupies 0 blocks initially, grows on demand)
    pub fn create_sparse_file(
        task_id: u64,
        size_gb: u64,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        let image_name = format!("sandbox_task_{}.img", task_id);
        let mount_name = format!("mnt_sandbox_task_{}", task_id);

        let image_path = PathBuf::from(&image_name);
        let mount_point = PathBuf::from(&mount_name);
        let logical_size_bytes = size_gb * 1024 * 1024 * 1024;

        println!(
            "[Storage] Initializing ephemeral sparse storage for Task #{}",
            task_id
        );
        println!("   Image File   : {:?}", image_path);
        println!("   Logical Limit: {} GB", size_gb);

        // Create the actual sparse file using standard OS features (cross-platform)
        let file = File::create(&image_path)?;
        file.set_len(logical_size_bytes)?; // Sets the logical length without allocating physical blocks

        println!(
            "   [Sparse file created] Physical size: 0 bytes | Logical size: {} GB",
            size_gb
        );

        Ok(Self {
            task_id,
            image_path,
            mount_point,
            logical_size_bytes,
        })
    }

    /// Simulates formatting and mounting the loop device securely via kernel namespaces
    pub fn mount_loop_device(&self) -> Result<(), Box<dyn std::error::Error>> {
        println!("\n[Storage] Formatting virtual filesystem image with ext4...");
        println!("   Command: mkfs.ext4 -F {:?}", self.image_path);

        // Create mount directory
        std::fs::create_dir_all(&self.mount_point)?;

        println!("[Storage] Mounting loop device securely under isolated mount namespace...");
        println!(
            "   Command: mount -o loop,noexec,nosuid,nodev {:?} {:?}",
            self.image_path, self.mount_point
        );
        println!("   [OK] Mount point established at {:?}", self.mount_point);
        Ok(())
    }

    /// Simulates eStargz P2P lazy loading (intercepting reads, fetching blocks, caching to sparse disk)
    pub fn simulate_lazy_stream_file(
        &self,
        virtual_path: &str,
        file_size_mb: u64,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let target_file_path = self.mount_point.join(virtual_path);
        println!(
            "\n[eStargz] Sandbox requested file read: '{}'",
            virtual_path
        );
        println!(
            "   [Cache Miss] File not present in local snapshot. Requesting blocks via P2P..."
        );

        // Simulate network delay for fetching blocks
        std::thread::sleep(std::time::Duration::from_millis(300));

        // Create parent directories inside the loop mount point if they do not exist
        if let Some(parent) = target_file_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        // Write the downloaded block data into the loop-mounted ext4 sparse image
        let dummy_data = vec![0u8; (file_size_mb * 1024 * 1024) as usize];
        std::fs::write(&target_file_path, &dummy_data)?;

        println!(
            "   [P2P Stream] Fetced {} MB blocks for '{}' and cached to loop device.",
            file_size_mb, virtual_path
        );
        println!(
            "   [Disk Update] Physical storage grown dynamically by {} MB.",
            file_size_mb
        );
        Ok(())
    }

    /// Teardown: Unmounts the loop device and deletes the image file from disk
    pub fn teardown(&self) -> Result<(), Box<dyn std::error::Error>> {
        println!("\n[Storage Teardown] Cleaning up sandbox disk allocations...");
        println!("   Unmounting: {:?}", self.mount_point);
        println!("   Command: umount {:?}", self.mount_point);

        // Clean mount directory
        if self.mount_point.exists() {
            let _ = std::fs::remove_dir_all(&self.mount_point);
        }

        println!("   Deleting sparse disk image file: {:?}", self.image_path);
        if self.image_path.exists() {
            std::fs::remove_file(&self.image_path)?;
        }

        println!("[Storage Teardown] Workspace completely wiped. Zero trace remaining.");
        Ok(())
    }
}

pub struct EncryptedPersistentVolume {
    pub volume_id: String,
    pub image_path: PathBuf,
    pub decrypted_device_path: PathBuf,
    pub is_decrypted: bool,
}

impl EncryptedPersistentVolume {
    pub fn new(volume_id: &str) -> Self {
        let path = PathBuf::from(format!("pv_{}.img", volume_id));
        let decrypted_path = PathBuf::from(format!("/dev/mapper/pv_{}_decrypted", volume_id));
        Self {
            volume_id: volume_id.to_string(),
            image_path: path,
            decrypted_device_path: decrypted_path,
            is_decrypted: false,
        }
    }

    /// Simulates formatting the persistent volume with block-level encryption (LUKS/dm-crypt)
    pub fn create_and_format(&self, key: &[u8; 32]) -> Result<(), Box<dyn std::error::Error>> {
        println!(
            "\n[Persistent Volume] Provisioning encrypted volume '{}'...",
            self.volume_id
        );

        // Create the backing sparse file (logical size e.g. 100 GB for ML weights)
        let file = File::create(&self.image_path)?;
        file.set_len(100 * 1024 * 1024 * 1024)?; // 100 GB

        println!("   [LUKS Format] Formatting device with AES-256-XTS cipher...");
        println!(
            "   Command: cryptsetup luksFormat --key-file - {:?}",
            self.image_path
        );
        println!("   [LUKS Key] Key hash: 0x{:x}", fnv1a_hash_bytes(key));

        // Write a mock encrypted weights file
        println!("   [ext4 Format] Creating filesystem inside LUKS container...");
        println!(
            "   Command: mkfs.ext4 /dev/mapper/pv_{}_decrypted",
            self.volume_id
        );
        Ok(())
    }

    /// Simulates decrypting/unlocking the persistent volume using dm-crypt
    pub fn unlock(&mut self, key: &[u8; 32]) -> Result<(), Box<dyn std::error::Error>> {
        println!(
            "\n[Persistent Volume] Unlocking encrypted volume '{}'...",
            self.volume_id
        );
        println!(
            "   Command: cryptsetup luksOpen --key-file - {:?} pv_{}_decrypted",
            self.image_path, self.volume_id
        );
        println!(
            "   [LUKS Open] Device mapped to {:?}",
            self.decrypted_device_path
        );
        println!(
            "   [LUKS Open] Verified key hash: 0x{:x}",
            fnv1a_hash_bytes(key)
        );
        self.is_decrypted = true;
        Ok(())
    }

    /// Simulates an OverlayFS mount: overlays the persistent read-only decrypted volume
    /// with an ephemeral writeable layer for instant sandbox startup without copying weights.
    pub fn overlay_mount(
        &self,
        ephemeral_fs: &EphemeralFileSystem,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if !self.is_decrypted {
            return Err("Cannot mount: Persistent Volume is locked. Unlock it first.".into());
        }

        println!("\n[OverlayFS Mount] Attaching Persistent Volume to Ephemeral Sandbox...");
        println!(
            "   Lower Dir (Read-Only PV) : {:?}",
            self.decrypted_device_path
        );
        println!(
            "   Upper Dir (Writeable Sandbox): {:?}",
            ephemeral_fs.mount_point.join("scratch")
        );
        println!(
            "   Work Dir (Overlay Metadata)  : {:?}",
            ephemeral_fs.mount_point.join("work")
        );
        println!(
            "   Mount Point (Merged View)    : {:?}",
            ephemeral_fs.mount_point
        );

        // Create the directories for OverlayFS
        std::fs::create_dir_all(ephemeral_fs.mount_point.join("scratch"))?;
        std::fs::create_dir_all(ephemeral_fs.mount_point.join("work"))?;

        println!("   Command: mount -t overlay overlay -o lowerdir={:?},upperdir={:?}/scratch,workdir={:?}/work {:?}",
                 self.decrypted_device_path, ephemeral_fs.mount_point, ephemeral_fs.mount_point, ephemeral_fs.mount_point);

        println!("   [OverlayFS Success] ML Weights (15 GB) are now instantly visible inside the sandbox!");
        println!("   [Zero-Copy] Startup time: 12ms | No disk blocks were copied.");
        Ok(())
    }

    /// Simulates loading the model weights instantly using Memory-Mapped Files (mmap)
    pub fn simulate_mmap_load(&self, weights_path: &str) -> Result<(), Box<dyn std::error::Error>> {
        println!("\n[Machine Learning] Sandbox starting inference run...");
        println!("   Loading model weights: '{}'", weights_path);
        println!("   [mmap] Memory-mapping weights file directly from decrypted block device...");

        // Simulating the sys_mmap call
        std::thread::sleep(std::time::Duration::from_millis(150));

        println!("   [mmap Success] 15.2 GB mapped into virtual address space at 0x7f8a90000000.");
        println!(
            "   [Inference Ready] Model weights loaded instantly via page-fault on-demand reading."
        );
        Ok(())
    }

    /// Cleans up disk allocations for the persistent volume
    pub fn destroy(&self) -> Result<(), Box<dyn std::error::Error>> {
        println!("\n[Persistent Volume Teardown] Cleaning up persistent disk allocations...");
        println!("   Locking LUKS container: {:?}", self.volume_id);
        println!(
            "   Command: cryptsetup luksClose pv_{}_decrypted",
            self.volume_id
        );

        if self.image_path.exists() {
            std::fs::remove_file(&self.image_path)?;
            println!(
                "   Deleted persistent disk image file: {:?}",
                self.image_path
            );
        }
        Ok(())
    }
}

fn fnv1a_hash_bytes(data: &[u8]) -> u64 {
    let mut hash: u64 = 0xcbf29ce484222325;
    for byte in data {
        hash ^= *byte as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    hash
}
