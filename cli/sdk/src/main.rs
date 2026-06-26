mod cli;
mod gateway;
mod network;
mod resources;
mod sandbox;
mod state;
mod stream;
mod sync;
mod tui;
mod wallet;

use clap::Parser;

fn read_json_input(
    json: Option<String>,
    file: Option<String>,
) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
    match (json, file) {
        (Some(raw), None) => Ok(serde_json::from_str(&raw)?),
        (None, Some(path)) => Ok(serde_json::from_str(&std::fs::read_to_string(path)?)?),
        _ => Err("provide exactly one of --json or --file".into()),
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = cli::Cli::parse();

    match args.command {
        Some(command) => match command {
            cli::Commands::Function {
                wasm,
                replication,
                secret,
                volume,
            } => {
                cli::client::handle_function(&wasm, replication, &secret, &volume, &args.signaling)
                    .await?;
            }
            cli::Commands::Run {
                wasm,
                replication,
                secret,
                volume,
            } => {
                cli::client::handle_function(&wasm, replication, &secret, &volume, &args.signaling)
                    .await?;
            }
            cli::Commands::Sandbox {
                image,
                timeout,
                secret,
                volume,
            } => {
                cli::client::handle_sandbox(&image, timeout, &secret, &volume, &args.signaling)
                    .await?;
            }
            cli::Commands::Shell {
                image,
                timeout,
                secret,
                volume,
            } => {
                cli::client::handle_sandbox(&image, timeout, &secret, &volume, &args.signaling)
                    .await?;
            }
            cli::Commands::Deploy {
                image,
                install,
                serve,
                idle_timeout,
                secret,
                volume,
            } => {
                cli::client::handle_deploy(
                    &image,
                    install.as_deref(),
                    serve,
                    idle_timeout,
                    &secret,
                    &volume,
                    &args.signaling,
                )
                .await?;
            }
            cli::Commands::Attach { task_id } => {
                cli::client::handle_attach(task_id, &args.signaling).await?;
            }
            cli::Commands::App { app_command } => {
                cli::client::handle_app(app_command).await?;
            }
            cli::Commands::Provider {
                tier,
                disk,
                instances,
            } => {
                cli::provider::handle_provider(tier.as_deref(), disk, instances, &args.signaling)
                    .await?;
            }
            cli::Commands::Worker {
                config,
                attach_session_token,
                once,
            } => {
                cli::worker::handle_worker(&config, attach_session_token.as_deref(), once).await?;
            }
            cli::Commands::Wallet { wallet_command } => match wallet_command {
                cli::WalletCommands::New => {
                    println!("Generating new Ed25519 identity keypair...");
                    let wallet = wallet::Wallet::new();
                    println!("Successfully generated new wallet!");
                    println!("Wallet Address (PeerID): {}", wallet.address);
                }
                cli::WalletCommands::Status => {
                    let w = wallet::Wallet::new();
                    println!("Wallet Address (PeerID): {}", w.address);
                    println!("Current Balance        : {:.2} USDC", w.get_balance());
                }
                cli::WalletCommands::Export => {
                    let _w = wallet::Wallet::new();
                    let path = state::wallet_path();
                    if let Ok(data) = std::fs::read_to_string(&path) {
                        if let Ok(state) = serde_json::from_str::<wallet::WalletState>(&data) {
                            println!("Your Ed25519 Private Key Hex (copy this to connect to Web Console):");
                            println!("{}", state.secret_key_hex);
                        } else {
                            println!("Error: Failed to parse wallet JSON.");
                        }
                    } else {
                        println!("Error: Could not open wallet.json at {:?}", path);
                    }
                }
            },
            cli::Commands::Tiers => {
                println!("| Tier       | Cores | RAM      | GPU / VRAM             | Price                |");
                println!("| :---       | :---  | :---     | :---                   | :---                 |");
                println!("| nano       | 2     | 2048 MB  | -                      | ~$0.00005 / second   |");
                println!("| micro      | 2     | 4096 MB  | -                      | ~$0.00010 / second   |");
                println!("| standard   | 4     | 4096 MB  | -                      | ~$0.00018 / second   |");
                println!("| pro        | 8     | 8192 MB  | -                      | ~$0.00035 / second   |");
                println!("| max        | 8     | 16384 MB | -                      | ~$0.00060 / second   |");
                println!("| gpu-4090   | 8     | 32768 MB | 1x RTX 4090 (24 GB)    | ~$0.00022 / second   |");
                println!("| gpu-a100   | 16    | 65536 MB | 1x A100 Tensor (80 GB) | ~$0.00062 / second   |");
                println!("| gpu-h100   | 32    | 131072 MB| 1x H100 Tensor (80 GB) | ~$0.00138 / second   |");
            }
            cli::Commands::Gateway { port } => {
                cli::client::handle_gateway(port).await?;
            }
            cli::Commands::Init { lang, output } => {
                cli::client::handle_init(&lang, &output).await?;
            }
            cli::Commands::Secret { secret_command } => match secret_command {
                cli::SecretCommands::List => {
                    let secrets = resources::list_secrets();
                    if secrets.is_empty() {
                        println!("No secrets configured.");
                    } else {
                        for secret in secrets {
                            let keys = secret
                                .env_vars
                                .iter()
                                .map(|entry| entry.key.clone())
                                .collect::<Vec<_>>()
                                .join(", ");
                            println!("{} [{}] ({})", secret.name, keys, secret.id);
                        }
                    }
                }
                cli::SecretCommands::Save { name, env } => {
                    let env_vars = resources::encode_secret_env_vars(&env)?;
                    let secret = resources::save_secret(&name, env_vars)?;
                    println!("Saved secret '{}' ({})", secret.name, secret.id);
                }
                cli::SecretCommands::Delete { locator } => {
                    if resources::delete_secret(&locator) {
                        println!("Deleted secret '{}'.", locator);
                    } else {
                        println!("Secret '{}' not found.", locator);
                    }
                }
            },
            cli::Commands::Volume { volume_command } => match volume_command {
                cli::VolumeCommands::List => {
                    let volumes = resources::list_volumes();
                    if volumes.is_empty() {
                        println!("No volumes configured.");
                    } else {
                        for volume in volumes {
                            println!(
                                "{} [{}] {}GB {}",
                                volume.name, volume.id, volume.size_gb, volume.volume_type
                            );
                        }
                    }
                }
                cli::VolumeCommands::Create {
                    name,
                    size_gb,
                    volume_type,
                } => {
                    let volume = resources::create_volume(&name, size_gb, &volume_type)?;
                    println!("Created volume '{}' ({})", volume.name, volume.id);
                }
                cli::VolumeCommands::Delete { locator } => {
                    if resources::delete_volume(&locator) {
                        println!("Deleted volume '{}'.", locator);
                    } else {
                        println!("Volume '{}' not found.", locator);
                    }
                }
                cli::VolumeCommands::Ls { locator, path } => {
                    let entries = resources::list_volume_entries(&locator, &path)?;
                    for entry in entries {
                        println!(
                            "{}\t{}\t{}",
                            entry.entry_type,
                            entry.path,
                            entry
                                .size
                                .map(|value| value.to_string())
                                .unwrap_or_else(|| "-".to_string())
                        );
                    }
                }
                cli::VolumeCommands::Put {
                    locator,
                    source,
                    path,
                } => {
                    let bytes = std::fs::read(source)?;
                    let entry = resources::write_volume_file(&locator, &path, &bytes)?;
                    println!("Wrote {} ({} bytes)", entry.path, entry.size.unwrap_or(0));
                }
                cli::VolumeCommands::Rm { locator, path } => {
                    if resources::delete_volume_entry(&locator, &path)? {
                        println!("Deleted '{}'.", path);
                    } else {
                        println!("Entry '{}' not found.", path);
                    }
                }
                cli::VolumeCommands::Url {
                    locator,
                    path,
                    port,
                } => {
                    let url = resources::volume_locator_public_url(port, &locator, &path)?;
                    println!("{}", url);
                }
            },
            cli::Commands::Database { database_command } => match database_command {
                cli::DatabaseCommands::List => {
                    let databases = resources::list_databases();
                    if databases.is_empty() {
                        println!("No databases configured.");
                    } else {
                        for database in databases {
                            let count = resources::database_record_count(&database.id).unwrap_or(0);
                            println!(
                                "{} [{}] pk={} sk={} records={}",
                                database.name,
                                database.id,
                                database.pk_name,
                                if database.sk_name.is_empty() {
                                    "-"
                                } else {
                                    &database.sk_name
                                },
                                count
                            );
                        }
                    }
                }
                cli::DatabaseCommands::Create {
                    name,
                    pk,
                    sk,
                    gsi_name,
                    gsi_pk,
                    gsi_sk,
                } => {
                    let database =
                        resources::create_database(&name, &pk, &sk, &gsi_name, &gsi_pk, &gsi_sk)?;
                    println!("Created database '{}' ({})", database.name, database.id);
                }
                cli::DatabaseCommands::Delete { locator } => {
                    if resources::delete_database(&locator) {
                        println!("Deleted database '{}'.", locator);
                    } else {
                        println!("Database '{}' not found.", locator);
                    }
                }
                cli::DatabaseCommands::Items { locator } => {
                    let items = resources::list_database_items(&locator)?;
                    println!("{}", serde_json::to_string_pretty(&items)?);
                }
                cli::DatabaseCommands::Put {
                    locator,
                    json,
                    file,
                } => {
                    let value = read_json_input(json, file)?;
                    let item = resources::put_database_item(&locator, value)?;
                    println!("{}", serde_json::to_string_pretty(&item)?);
                }
                cli::DatabaseCommands::DeleteItem { locator, pk, sk } => {
                    if resources::delete_database_item(&locator, &pk, &sk)? {
                        println!("Deleted item {}#{}", pk, sk);
                    } else {
                        println!("Item {}#{} not found.", pk, sk);
                    }
                }
                cli::DatabaseCommands::Query {
                    locator,
                    pk,
                    sk,
                    sk_begins_with,
                    sk_from,
                    sk_to,
                    gsi_pk,
                    gsi_sk,
                    gsi_sk_begins_with,
                    gsi_sk_from,
                    gsi_sk_to,
                    limit,
                } => {
                    let results = resources::query_database(
                        &locator,
                        resources::DatabaseQuery {
                            pk,
                            sk,
                            sk_begins_with,
                            sk_from,
                            sk_to,
                            gsi_pk,
                            gsi_sk,
                            gsi_sk_begins_with,
                            gsi_sk_from,
                            gsi_sk_to,
                            limit,
                        },
                    )?;
                    println!("{}", serde_json::to_string_pretty(&results)?);
                }
            },
            cli::Commands::Update { force } => {
                cli::client::handle_update(force).await?;
            }
            cli::Commands::Version => {
                println!("Boxty CLI {}", env!("CARGO_PKG_VERSION"));
                println!(
                    "Built for: {}-{}",
                    std::env::consts::OS,
                    std::env::consts::ARCH
                );
            }
        },
        None => {
            let banner = cli::get_welcome_banner();
            println!("{}", banner);
            println!();
            use clap::CommandFactory;
            let mut cmd = cli::Cli::command();
            let _ = cmd.print_help();
            println!();
        }
    }

    Ok(())
}
