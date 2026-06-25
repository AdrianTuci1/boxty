use std::process::Stdio;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command;

/// Executed on the idle Provider. Spawns the sandbox, captures output, and pumps it over the P2P stream.
#[allow(dead_code)]
pub async fn execute_in_cloud_and_stream<S>(script_path: &str, mut p2p_stream: S)
where
    S: tokio::io::AsyncWrite + Unpin + Send + 'static,
{
    let mut child = Command::new("wasmtime")
        .args(["run", script_path])
        .stdout(Stdio::piped())
        .stdin(Stdio::piped())
        .spawn()
        .expect("Eșec la pornirea sandbox-ului în cloud");

    let stdout = child.stdout.take().unwrap();
    let mut reader = BufReader::new(stdout).lines();

    // Stream din Cloud Sandbox -> Către Laptopul Clientului în timp real
    while let Ok(Some(line)) = reader.next_line().await {
        if let Err(e) = p2p_stream.write_all(format!("{}\n", line).as_bytes()).await {
            eprintln!("[Remote Stream] Error writing to P2P stream: {}", e);
            break;
        }
    }

    let _ = child.wait().await;
}
