"""Boxty CLI - Client interface for the Boxty platform."""

import click
import os
import json
import sys
from pathlib import Path
from typing import Optional

from boxty import Boxty
from boxty.exceptions import BoxtyError, BoxtyAuthError

# Config paths
CONFIG_DIR = Path.home() / ".boxty"
CONFIG_FILE = CONFIG_DIR / "config.json"


def ensure_config_dir():
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)


def load_config() -> dict:
    ensure_config_dir()
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE) as f:
            return json.load(f)
    return {}


def save_config(config: dict):
    ensure_config_dir()
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)


def get_client() -> Boxty:
    config = load_config()
    base_url = os.environ.get("BOXTY_API_URL", config.get("api_url", "http://127.0.0.1:8080"))
    return Boxty(base_url=base_url)


def get_token() -> Optional[str]:
    config = load_config()
    return config.get("token")


def set_token(token: str):
    config = load_config()
    config["token"] = token
    save_config(config)


def clear_token():
    config = load_config()
    config.pop("token", None)
    save_config(config)


def get_active_workspace() -> Optional[str]:
    config = load_config()
    return config.get("active_workspace_id")


def set_active_workspace(workspace_id: str):
    config = load_config()
    config["active_workspace_id"] = workspace_id
    save_config(config)


def get_active_environment() -> Optional[str]:
    config = load_config()
    return config.get("active_environment_id")


def set_active_environment(environment_id: str):
    config = load_config()
    config["active_environment_id"] = environment_id
    save_config(config)


def print_table(headers: list, rows: list):
    """Print a simple text table."""
    if not rows:
        click.echo("No data.")
        return
    
    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, cell in enumerate(row):
            col_widths[i] = max(col_widths[i], len(str(cell)))
    
    # Header
    header_line = " | ".join(h.ljust(w) for h, w in zip(headers, col_widths))
    click.echo(header_line)
    click.echo("-" * len(header_line))
    
    # Rows
    for row in rows:
        click.echo(" | ".join(str(cell).ljust(w) for cell, w in zip(row, col_widths)))


@click.group()
@click.version_option(version="1.0.0")
@click.option("--api-url", envvar="BOXTY_API_URL", default="http://127.0.0.1:8080", help="Boxty API URL")
@click.pass_context
def cli(ctx, api_url):
    """Boxty CLI - Manage your Boxty resources."""
    ctx.ensure_object(dict)
    ctx.obj["api_url"] = api_url


# AUTH
@cli.group()
def auth():
    """Authentication commands."""
    pass


@auth.command()
@click.argument("external_user_id")
@click.option("--email", default=None, help="Email address")
def login(external_user_id, email):
    """Login to Boxty."""
    client = get_client()
    try:
        result = client.login(external_user_id, email)
        if "access_token" in result:
            set_token(result["access_token"])
            click.echo(f"Login successful! User ID: {result.get('user_id', 'N/A')}")
        else:
            click.echo(f"Login response: {json.dumps(result, indent=2)}")
    except BoxtyError as e:
        click.echo(f"Login failed: {e.message}", err=True)
        sys.exit(1)


@auth.command()
def logout():
    """Logout from Boxty."""
    clear_token()
    click.echo("Logged out successfully.")


@auth.command()
def whoami():
    """Show current user info."""
    token = get_token()
    if not token:
        click.echo("Not logged in. Run 'boxty auth login <external_user_id>'")
        return
    click.echo(f"Token: {token[:20]}...")
    click.echo("Use 'boxty workspace list' to see your workspaces.")


# WORKSPACE
@cli.group()
def workspace():
    """Workspace management."""
    pass


@workspace.command("list")
def workspace_list():
    """List all workspaces."""
    client = get_client()
    try:
        workspaces = client.workspaces()
        if not workspaces:
            click.echo("No workspaces found.")
            return
        headers = ["ID", "Name", "Created"]
        rows = [[w.get("workspace_id", "")[:20], w.get("name", ""), w.get("created_at", "")[:19]] for w in workspaces]
        print_table(headers, rows)
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@workspace.command("create")
@click.argument("name")
@click.option("--owner-id", required=True, help="Owner ID")
def workspace_create(name, owner_id):
    """Create a new workspace."""
    client = get_client()
    try:
        result = client.create_workspace(owner_id, name)
        click.echo(f"Created workspace: {result.get('workspace_id')}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@workspace.command("delete")
@click.argument("workspace_id")
def workspace_delete(workspace_id):
    """Delete a workspace."""
    client = get_client()
    try:
        client.delete_workspace(workspace_id)
        click.echo(f"Deleted workspace {workspace_id}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@workspace.command("switch")
@click.argument("workspace_id")
def workspace_switch(workspace_id):
    """Switch active workspace."""
    set_active_workspace(workspace_id)
    click.echo(f"Switched to workspace {workspace_id}")


@workspace.command("show")
def workspace_show():
    """Show active workspace."""
    ws = get_active_workspace()
    if ws:
        click.echo(f"Active workspace: {ws}")
    else:
        click.echo("No active workspace. Use 'boxty workspace switch <id>'")


# ENVIRONMENT
@cli.group()
def env():
    """Environment management."""
    pass


@env.command("list")
@click.option("--workspace-id", default=None, help="Workspace ID")
def env_list(workspace_id):
    """List environments."""
    client = get_client()
    ws_id = workspace_id or get_active_workspace()
    if not ws_id:
        click.echo("No workspace specified. Use --workspace-id or set active workspace.")
        return
    try:
        environments = client.environments(ws_id)
        if not environments:
            click.echo("No environments found.")
            return
        headers = ["ID", "Name", "Created"]
        rows = [[e.get("environment_id", "")[:20], e.get("name", ""), e.get("created_at", "")[:19]] for e in environments]
        print_table(headers, rows)
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@env.command("create")
@click.argument("name")
@click.option("--workspace-id", default=None, help="Workspace ID")
def env_create(name, workspace_id):
    """Create a new environment."""
    client = get_client()
    ws_id = workspace_id or get_active_workspace()
    if not ws_id:
        click.echo("No workspace specified. Use --workspace-id or set active workspace.")
        return
    try:
        result = client.create_environment(ws_id, name)
        click.echo(f"Created environment: {result.get('environment_id')}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@env.command("delete")
@click.argument("environment_id")
def env_delete(environment_id):
    """Delete an environment."""
    client = get_client()
    try:
        client.delete_environment(environment_id)
        click.echo(f"Deleted environment {environment_id}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@env.command("switch")
@click.argument("environment_id")
def env_switch(environment_id):
    """Switch active environment."""
    set_active_environment(environment_id)
    click.echo(f"Switched to environment {environment_id}")


# APP / WORKLOAD
@cli.group()
def app():
    """Application management."""
    pass


@app.command("list")
@click.option("--workspace-id", default=None, help="Filter by workspace")
@click.option("--environment-id", default=None, help="Filter by environment")
def app_list(workspace_id, environment_id):
    """List all workloads."""
    client = get_client()
    try:
        workloads = client.list_workloads_filtered(workspace_id, environment_id)
        if not workloads:
            click.echo("No workloads found.")
            return
        headers = ["ID", "Name", "Kind", "Status"]
        rows = [[w.get("workload_id", "")[:20], w.get("name", ""), w.get("kind", ""), w.get("status", "")] for w in workloads]
        print_table(headers, rows)
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@app.command("deploy")
@click.argument("name")
@click.option("--kind", default="sandbox", help="Workload kind (sandbox, function, endpoint, build)")
@click.option("--image", required=True, help="Docker image")
@click.option("--workspace-id", default=None, help="Workspace ID")
@click.option("--environment-id", default=None, help="Environment ID")
@click.option("--cpu", default=1, help="CPU cores")
@click.option("--memory", default=512, help="Memory MB")
@click.option("--gpu", default=0, help="GPU count")
def app_deploy(name, kind, image, workspace_id, environment_id, cpu, memory, gpu):
    """Deploy a new workload."""
    client = get_client()
    ws_id = workspace_id or get_active_workspace()
    env_id = environment_id or get_active_environment()
    if not ws_id or not env_id:
        click.echo("Workspace and environment required. Use --workspace-id and --environment-id or set active context.")
        return
    try:
        result = client.create_workload(
            owner_id="cli-user",  # TODO: get from auth
            workspace_id=ws_id,
            environment_id=env_id,
            kind=kind,
            image=image,
            cpu_cores=cpu,
            memory_mb=memory,
            gpu_count=gpu,
        )
        click.echo(f"Deployed workload: {result.get('workload_id')}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@app.command("stop")
@click.argument("workload_id")
def app_stop(workload_id):
    """Stop a workload."""
    client = get_client()
    try:
        client.delete_workload(workload_id)
        click.echo(f"Stopped workload {workload_id}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@app.command("logs")
@click.argument("workload_id")
def app_logs(workload_id):
    """Get workload logs."""
    client = get_client()
    try:
        logs = client.get_workload_logs(workload_id)
        for log in logs:
            click.echo(f"[{log.get('timestamp', '?')}] {log.get('message', '')}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@app.command("metrics")
@click.argument("workload_id")
def app_metrics(workload_id):
    """Get workload metrics."""
    client = get_client()
    try:
        metrics = client.get_workload_metrics(workload_id)
        click.echo(json.dumps(metrics, indent=2))
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


# VOLUME
@cli.group()
def volume():
    """Volume management."""
    pass


@volume.command("list")
def volume_list():
    """List all volumes."""
    client = get_client()
    try:
        volumes = client.volumes.list()
        if not volumes:
            click.echo("No volumes found.")
            return
        headers = ["ID", "Name", "Size GB", "Type", "Status"]
        rows = [[v.get("volume_id", "")[:20], v.get("name", ""), v.get("size_gb", ""), v.get("volume_type", ""), v.get("status", "")] for v in volumes]
        print_table(headers, rows)
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@volume.command("create")
@click.argument("name")
@click.option("--size", default=10, help="Size in GB")
@click.option("--volume-type", default="standard", help="Volume type")
def volume_create(name, size, volume_type):
    """Create a new volume."""
    client = get_client()
    try:
        result = client.volumes.create(name, size, volume_type)
        click.echo(f"Created volume: {result.get('volume_id')}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@volume.command("delete")
@click.argument("volume_id")
def volume_delete(volume_id):
    """Delete a volume."""
    client = get_client()
    try:
        client.volumes.delete(volume_id)
        click.echo(f"Deleted volume {volume_id}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


# SECRET
@cli.group()
def secret():
    """Secret management."""
    pass


@secret.command("list")
def secret_list():
    """List all secrets."""
    client = get_client()
    try:
        secrets = client.secrets.list()
        if not secrets:
            click.echo("No secrets found.")
            return
        headers = ["ID", "Name", "Keys"]
        rows = [[s.get("secret_id", "")[:20], s.get("name", ""), ", ".join(s.get("key_names", []))] for s in secrets]
        print_table(headers, rows)
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@secret.command("create")
@click.argument("name")
@click.option("--from-env", type=click.File("r"), help="Load from .env file")
@click.option("--key", multiple=True, help="Key=value pairs")
def secret_create(name, from_env, key):
    """Create a new secret."""
    client = get_client()
    env_vars = {}
    if from_env:
        for line in from_env:
            line = line.strip()
            if line and "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env_vars[k.strip()] = v.strip().strip('"').strip("'")
    for k in key:
        if "=" in k:
            k, v = k.split("=", 1)
            env_vars[k] = v
    try:
        result = client.secrets.create(name, env_vars)
        click.echo(f"Created secret: {result.get('secret_id')}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@secret.command("delete")
@click.argument("name")
def secret_delete(name):
    """Delete a secret."""
    client = get_client()
    try:
        client.secrets.delete(name)
        click.echo(f"Deleted secret {name}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


# BILLING
@cli.group()
def billing():
    """Billing and usage."""
    pass


@billing.command("balance")
@click.option("--user-id", required=True, help="User ID")
def billing_balance(user_id):
    """Show account balance."""
    client = get_client()
    try:
        result = client.billing_balance(user_id)
        click.echo(f"Balance: ${result.get('balance_usd', 0):.2f}")
        click.echo(f"Credits: ${result.get('credit_grants_usd', 0):.2f}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@billing.command("usage")
@click.option("--user-id", required=True, help="User ID")
def billing_usage(user_id):
    """Show usage records."""
    client = get_client()
    try:
        result = client.billing_usage(user_id)
        click.echo(json.dumps(result, indent=2))
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@billing.command("buy")
@click.argument("amount", type=float)
@click.option("--user-id", required=True, help="User ID")
def billing_buy(amount, user_id):
    """Add credits to account."""
    client = get_client()
    try:
        result = client.add_credits(user_id, amount)
        click.echo(f"Added ${amount} credits.")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


# STATUS
@cli.command()
@click.option("--watch", is_flag=True, help="Watch mode - refresh every 5 seconds")
def status(watch):
    """Show dashboard status."""
    client = get_client()
    ws_id = get_active_workspace()
    env_id = get_active_environment()
    if not ws_id or not env_id:
        click.echo("No active workspace/environment. Use 'boxty workspace switch' and 'boxty env switch'")
        return
    
    import time
    while True:
        try:
            summary = client.dashboard_summary(ws_id, env_id)
            click.echo(f"Workloads: {summary.get('workloads', 0)}")
            click.echo(f"Running: {summary.get('running', 0)}")
            click.echo(f"Balance: ${summary.get('balance_usd', 0):.2f}")
        except BoxtyError as e:
            click.echo(f"Error: {e.message}", err=True)
        
        if not watch:
            break
        click.echo("---")
        time.sleep(5)


# ROUTE
@cli.group()
def route():
    """Route management."""
    pass


@route.command("list")
def route_list():
    """List all routes."""
    client = get_client()
    try:
        routes = client.list_routes()
        if not routes:
            click.echo("No routes found.")
            return
        headers = ["ID", "Endpoint", "Workload"]
        rows = [[r.get("route_id", "")[:20], r.get("endpoint_name", ""), r.get("workload_id", "")[:20]] for r in routes]
        print_table(headers, rows)
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@route.command("create")
@click.argument("endpoint_name")
@click.option("--workload-id", required=True, help="Workload ID")
def route_create(endpoint_name, workload_id):
    """Create a new route."""
    client = get_client()
    try:
        result = client.create_route(workload_id, endpoint_name)
        click.echo(f"Created route: {result.get('route_id')}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@route.command("delete")
@click.argument("route_id")
def route_delete(route_id):
    """Delete a route."""
    client = get_client()
    try:
        client.delete_route(route_id)
        click.echo(f"Deleted route {route_id}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


# SCHEDULE
@cli.group()
def schedule():
    """Schedule management."""
    pass


@schedule.command("list")
@click.option("--workspace-id", default=None, help="Filter by workspace")
def schedule_list(workspace_id):
    """List all schedules."""
    client = get_client()
    try:
        schedules = client.list_schedules(workspace_id)
        if not schedules:
            click.echo("No schedules found.")
            return
        headers = ["ID", "Name", "Type", "Value", "Function"]
        rows = [[s.get("schedule_id", "")[:20], s.get("name", ""), s.get("schedule_type", ""), s.get("schedule_value", ""), s.get("function_name", "")] for s in schedules]
        print_table(headers, rows)
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@schedule.command("create")
@click.argument("name")
@click.option("--type", "schedule_type", required=True, help="Schedule type (cron, interval)")
@click.option("--value", "schedule_value", required=True, help="Schedule value (e.g., '0 * * * *')")
@click.option("--function", "function_name", required=True, help="Function name")
@click.option("--workspace-id", default=None, help="Workspace ID")
@click.option("--environment-id", default=None, help="Environment ID")
@click.option("--image", default=None, help="Docker image")
def schedule_create(name, schedule_type, schedule_value, function_name, workspace_id, environment_id, image):
    """Create a new schedule."""
    client = get_client()
    ws_id = workspace_id or get_active_workspace()
    env_id = environment_id or get_active_environment()
    if not ws_id or not env_id:
        click.echo("Workspace and environment required.")
        return
    try:
        result = client.create_schedule(name, schedule_type, schedule_value, function_name, ws_id, env_id, image=image)
        click.echo(f"Created schedule: {result.get('schedule_id')}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@schedule.command("delete")
@click.argument("schedule_id")
def schedule_delete(schedule_id):
    """Delete a schedule."""
    client = get_client()
    try:
        client.delete_schedule(schedule_id)
        click.echo(f"Deleted schedule {schedule_id}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@schedule.command("trigger")
@click.argument("schedule_id")
def schedule_trigger(schedule_id):
    """Trigger a schedule manually."""
    client = get_client()
    try:
        client.trigger_schedule(schedule_id)
        click.echo(f"Triggered schedule {schedule_id}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


# IMAGE
@cli.group()
def image():
    """Image management."""
    pass


@image.command("list")
def image_list():
    """List all images."""
    client = get_client()
    try:
        images = client.list_images()
        if not images:
            click.echo("No images found.")
            return
        headers = ["ID", "Name", "Base Image", "Status"]
        rows = [[i.get("image_id", "")[:20], i.get("name", ""), i.get("base_image", ""), i.get("status", "")] for i in images]
        print_table(headers, rows)
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@image.command("build")
@click.argument("name")
@click.option("--dockerfile", default=None, help="Path to Dockerfile")
@click.option("--base-image", default=None, help="Base image")
def image_build(name, dockerfile, base_image):
    """Build a new image."""
    client = get_client()
    try:
        result = client.build_image(name, dockerfile=dockerfile, base_image=base_image)
        click.echo(f"Build started: {result.get('image_id')}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


# INVITE
@cli.group()
def invite():
    """Team invite management."""
    pass


@invite.command("list")
@click.option("--workspace-id", default=None, help="Filter by workspace")
def invite_list(workspace_id):
    """List all invites."""
    client = get_client()
    try:
        invites = client.list_invites(workspace_id)
        if not invites:
            click.echo("No invites found.")
            return
        headers = ["ID", "Email", "Role", "Status"]
        rows = [[i.get("invite_id", "")[:20], i.get("email", ""), i.get("role", ""), i.get("status", "")] for i in invites]
        print_table(headers, rows)
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@invite.command("create")
@click.argument("email")
@click.option("--workspace-id", required=True, help="Workspace ID")
@click.option("--role", default="viewer", help="Role (viewer, contributor, admin)")
def invite_create(email, workspace_id, role):
    """Create a new invite."""
    client = get_client()
    try:
        result = client.create_invite(workspace_id, email, role)
        click.echo(f"Created invite: {result.get('invite_id')}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@invite.command("accept")
@click.argument("token")
def invite_accept(token):
    """Accept an invite."""
    client = get_client()
    try:
        result = client.accept_invite(token)
        click.echo(f"Accepted invite: {result}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


# PROVIDER
@cli.group()
def provider():
    """Provider management (admin)."""
    pass


@provider.command("list")
def provider_list():
    """List all providers."""
    client = get_client()
    try:
        providers = client.list_providers()
        if not providers:
            click.echo("No providers found.")
            return
        headers = ["ID", "Name", "Region", "Pool", "Slots"]
        rows = [[p.get("provider_id", "")[:20], p.get("name", ""), p.get("region", ""), p.get("pool", ""), p.get("total_slots", "")] for p in providers]
        print_table(headers, rows)
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@provider.command("register")
@click.argument("name")
@click.option("--region", required=True, help="Region")
@click.option("--pool", default="default", help="Pool")
@click.option("--slots", default=10, help="Total slots")
def provider_register(name, region, pool, slots):
    """Register a new provider."""
    client = get_client()
    try:
        result = client.register_provider(name, region, pool, slots)
        click.echo(f"Registered provider: {result.get('provider_id')}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


@provider.command("delete")
@click.argument("provider_id")
def provider_delete(provider_id):
    """Delete a provider."""
    client = get_client()
    try:
        client.delete_provider(provider_id)
        click.echo(f"Deleted provider {provider_id}")
    except BoxtyError as e:
        click.echo(f"Error: {e.message}", err=True)


# CONFIG
@cli.group()
def config():
    """Configuration management."""
    pass


@config.command("set")
@click.argument("key")
@click.argument("value")
def config_set(key, value):
    """Set a config value."""
    cfg = load_config()
    cfg[key] = value
    save_config(cfg)
    click.echo(f"Set {key} = {value}")


@config.command("get")
@click.argument("key")
def config_get(key):
    """Get a config value."""
    cfg = load_config()
    click.echo(cfg.get(key, "(not set)"))


@config.command("list")
def config_list():
    """List all config values."""
    cfg = load_config()
    if not cfg:
        click.echo("No config set.")
        return
    for key, value in cfg.items():
        click.echo(f"{key} = {value}")


# CONTEXT
@cli.command()
def context():
    """Show current context."""
    cfg = load_config()
    click.echo(f"API URL: {cfg.get('api_url', 'http://127.0.0.1:8080')}")
    click.echo(f"Active workspace: {cfg.get('active_workspace_id', '(none)')}")
    click.echo(f"Active environment: {cfg.get('active_environment_id', '(none)')}")
    click.echo(f"Token: {'(set)' if cfg.get('token') else '(not set)'}")


if __name__ == "__main__":
    cli()
