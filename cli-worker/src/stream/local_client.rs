use std::io::Write;
use tokio::io::AsyncReadExt;

/// Executed on the local Client laptop. Reads data from the P2P stream and renders it locally.
#[allow(dead_code)]
pub async fn render_remote_cloud_terminal<S>(mut p2p_stream: S)
where
    S: tokio::io::AsyncRead + Unpin + Send + 'static,
{
    let mut buffer = vec![0; 1024];
    loop {
        match p2p_stream.read(&mut buffer).await {
            Ok(0) => break, // Connection closed
            Ok(bytes_read) => {
                let remote_log = String::from_utf8_lossy(&buffer[..bytes_read]);
                print!("{}", remote_log);
                let _ = std::io::stdout().flush();
            }
            Err(e) => {
                eprintln!("\n[Local Client] Error reading from P2P stream: {}", e);
                break;
            }
        }
    }
}
