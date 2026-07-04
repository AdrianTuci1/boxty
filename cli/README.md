# Boxty CLI

Modal-style CLI for the Boxty serverless GPU platform.

## Install

From the repository:

```bash
pip install -e cli/
```

From PyPI:

```bash
pip install boxty-cli
```

## Usage

```bash
# Authentication
boxty auth login <token>
boxty auth logout
boxty auth whoami

# Workspaces and environments
boxty workspace create my-workspace --switch
boxty environment create prod

# Deploy and run apps
boxty app deploy app.py
boxty app serve app.py
boxty run app.py::hello
boxty app list
boxty app logs <app>
boxty app stop <app>
boxty app delete <app>
boxty app rollback <app>
boxty app history <app>

# Containers
boxty container list
boxty container logs <id>
boxty container exec <id>
boxty container stop <id>

# Volumes
boxty volume create my-data
boxty volume ls <volume>
boxty volume get <volume> <path>
boxty volume put <volume> <local> <remote>
boxty volume rm <volume> <path>
boxty volume cp <volume> <src> <dst>

# Secrets
boxty secret list
boxty secret create <name> <value>
boxty secret delete <name>

# Tokens
boxty token set <token>
boxty token new

# Profiles
boxty profile list
boxty profile activate <name>
boxty profile current

# Config
boxty config show
boxty config set-environment <id>

# Launch templates
boxty launch hello
boxty launch list

# Shell into a sandbox
boxty shell <app>
```

## Configuration

Configuration is stored in `~/.boxty/config.json`. Precedence:

1. CLI flags (`--api-url`, `--token`, `--workspace`, `--environment`)
2. Environment variables (`BOXTY_API_URL`, `BOXTY_TOKEN`, `BOXTY_WORKSPACE_ID`, `BOXTY_ENVIRONMENT_ID`)
3. Config file

## Development

```bash
cd cli
python -m build .
python -m pytest tests
```
