pub mod dashboard {
    use crossterm::{
        event::{self, Event, KeyCode},
        execute,
        terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
    };
    use ratatui::{
        backend::CrosstermBackend,
        layout::{Constraint, Direction, Layout},
        style::{Color, Modifier, Style},
        widgets::{Block, Borders, Paragraph},
        Terminal,
    };
    use std::io;
    use std::sync::Arc;
    use std::time::{Duration, Instant};
    use tokio::sync::Mutex;

    #[derive(Clone)]
    pub struct Task {
        pub id: u32,
        pub name: String,
        pub status: String,
        pub cpu_usage: u32,
        pub ram_usage: f64,
        pub active: bool,
    }

    #[derive(Clone)]
    pub struct NodeState {
        pub peer_id: String,
        pub status: String,
        pub connected_peers: u32,
        pub shared_cpu: u32,
        pub max_cpu: u32,
        pub shared_ram: f64,
        pub max_ram: f64,
        pub current_balance: f64,
        pub earned_today: f64,
        pub current_task: Task,
        pub logs: Vec<String>,
    }

    impl Default for NodeState {
        fn default() -> Self {
            Self {
                peer_id: "QmYwAPJviwYg21X9iJGgaXj8F".to_string(),
                status: "ACTIVE".to_string(),
                connected_peers: 142,
                shared_cpu: 2,
                max_cpu: 8,
                shared_ram: 4.0,
                max_ram: 16.0,
                current_balance: 450.50,
                earned_today: 24.10,
                current_task: Task {
                    id: 9482,
                    name: "WebScraperAgent".to_string(),
                    status: "Running (Wasmtime Runtime)".to_string(),
                    cpu_usage: 45,
                    ram_usage: 1.2,
                    active: true,
                },
                logs: vec![
                    "[12:14:02] Joined global Kademlia DHT mesh...".to_string(),
                    "[12:15:10] Received task challenge from peer ...8aFf".to_string(),
                    "[12:15:11] Verification passed. MicroVM instanced successfully".to_string(),
                    "[12:17:34] Task complete. State synced. Reward pending...".to_string(),
                ],
            }
        }
    }

    pub async fn run_tui(state: Arc<Mutex<NodeState>>) -> Result<(), Box<dyn std::error::Error>> {
        enable_raw_mode()?;
        let mut stdout = io::stdout();
        execute!(stdout, EnterAlternateScreen)?;
        let backend = CrosstermBackend::new(stdout);
        let mut terminal = Terminal::new(backend)?;

        let tick_rate = Duration::from_millis(250);
        let mut last_tick = Instant::now();

        loop {
            terminal.draw(|f| {
                let chunks = Layout::default()
                    .direction(Direction::Vertical)
                    .margin(1)
                    .constraints(
                        [
                            Constraint::Length(3), // Header
                            Constraint::Length(5), // Node Specs
                            Constraint::Length(6), // Workload
                            Constraint::Length(5), // Wallet/Economy
                            Constraint::Length(8), // Logs
                        ]
                        .as_ref(),
                    )
                    .split(f.size());

                let local_state = futures::executor::block_on(state.lock());

                // 1. Header Block
                let header = Paragraph::new(format!(
                    " BOXTY DECENTRALIZED NODE v1.0.0          Status: {}",
                    local_state.status
                ))
                .style(Style::default().fg(Color::Green).add_modifier(Modifier::BOLD))
                .block(Block::default().borders(Borders::ALL).border_style(Style::default().fg(Color::Cyan)));
                f.render_widget(header, chunks[0]);

                // 2. Node Specs
                let specs_text = format!(
                    " Peer ID: {}    [OK]\n Connected Peers: {}\n Resources Shared: {}/{} Cores CPU  |  {:.1} / {:.1} GB RAM",
                    local_state.peer_id,
                    local_state.connected_peers,
                    local_state.shared_cpu,
                    local_state.max_cpu,
                    local_state.shared_ram,
                    local_state.max_ram
                );
                let specs = Paragraph::new(specs_text)
                    .block(Block::default().title(" NODE IDENTITY & HARDWARE ").borders(Borders::ALL));
                f.render_widget(specs, chunks[1]);

                // 3. Current Workload
                let task_text = if local_state.current_task.active {
                    format!(
                        " [Task #{}] Running Agent AI: \"{}\"\n Sandbox Status: {}\n CPU Usage: {}%   |   RAM Usage: {:.1} GB",
                        local_state.current_task.id,
                        local_state.current_task.name,
                        local_state.current_task.status,
                        local_state.current_task.cpu_usage,
                        local_state.current_task.ram_usage
                    )
                } else {
                    " IDLE - Awaiting workloads from the Kademlia DHT Network...".to_string()
                };
                let task_block = Paragraph::new(task_text)
                    .block(Block::default().title(" CURRENT WORKLOAD ").borders(Borders::ALL).border_style(Style::default().fg(Color::Yellow)));
                f.render_widget(task_block, chunks[2]);

                // 4. Economy & Rewards
                let econ_text = format!(
                    " Current Balance : {:.2} USDC\n Earned Today    : +{:.2} USDC",
                    local_state.current_balance, local_state.earned_today
                );
                let econ = Paragraph::new(econ_text)
                    .block(Block::default().title(" ECONOMY & REWARDS ").borders(Borders::ALL).border_style(Style::default().fg(Color::Green)));
                f.render_widget(econ, chunks[3]);

                // 5. Logs
                let mut log_text = String::new();
                for log in local_state.logs.iter().rev().take(6).rev() {
                    log_text.push_str(&format!(" {}\n", log));
                }
                let logs = Paragraph::new(log_text)
                    .block(Block::default().title(" SYSTEM EVENT LOGGER ").borders(Borders::ALL).border_style(Style::default().fg(Color::Gray)));
                f.render_widget(logs, chunks[4]);
            })?;

            let timeout = tick_rate
                .checked_sub(last_tick.elapsed())
                .unwrap_or_else(|| Duration::from_secs(0));

            if crossterm::event::poll(timeout)? {
                if let Event::Key(key) = event::read()? {
                    if let KeyCode::Char('q') | KeyCode::Esc = key.code {
                        break;
                    }
                }
            }

            if last_tick.elapsed() >= tick_rate {
                // Fluctuate CPU and RAM values for the simulation inside the dashboard
                let mut local_state = state.lock().await;
                if local_state.current_task.active {
                    let cpu_delta = rand::random::<i32>() % 9 - 4; // -4 to +4
                    let mut new_cpu = local_state.current_task.cpu_usage as i32 + cpu_delta;
                    if new_cpu < 10 {
                        new_cpu = 10;
                    }
                    if new_cpu > 95 {
                        new_cpu = 95;
                    }
                    local_state.current_task.cpu_usage = new_cpu as u32;

                    let ram_delta = (rand::random::<f64>() - 0.5) * 0.1;
                    local_state.current_task.ram_usage += ram_delta;
                    if local_state.current_task.ram_usage < 0.2 {
                        local_state.current_task.ram_usage = 0.2;
                    }
                }

                // Randomly fluctuate peers
                let peer_delta = rand::random::<i32>() % 3 - 1;
                let mut new_peers = local_state.connected_peers as i32 + peer_delta;
                if new_peers < 130 {
                    new_peers = 130;
                }
                if new_peers > 150 {
                    new_peers = 150;
                }
                local_state.connected_peers = new_peers as u32;

                last_tick = Instant::now();
            }
        }

        disable_raw_mode()?;
        execute!(terminal.backend_mut(), LeaveAlternateScreen)?;
        Ok(())
    }
}
