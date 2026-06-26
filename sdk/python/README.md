# Boxty Python SDK

```python
import boxty

# Auto-discovers BOXTY_GATEWAY_URL from environment
bx = boxty.Boxty()

# Secrets
secrets = bx.secrets.list()
bx.secrets.create("openai-key", {"OPENAI_API_KEY": "sk-..."})

# Volumes
volumes = bx.volumes.list()
bx.volumes.put_entry("my-vol", "data.json", b'{"hello":"world"}')

# Databases
dbs = bx.databases.list()
bx.databases.query("my-db", pk="user_42")

# App state
state = bx.state()

# Central control plane
user = bx.signup("alice", "alice@example.com")
balance = bx.balance(user["user_id"])
workspaces = bx.workspaces(user["user_id"])
workspace_id = user["default_workspace_id"]
environment_id = user["default_environment_id"]
api_key = bx.create_api_key(user["user_id"], workspace_id, environment_id, "local-dev")
pricing = bx.pricing()
workload = bx.create_workload(
    owner_id=user["user_id"],
    workspace_id=workspace_id,
    environment_id=environment_id,
    kind="sandbox",
    image="ubuntu:22.04",
    cpu_cores=2,
    memory_mb=4096,
)
session = bx.create_sandbox_session(workload["workload_id"], user["user_id"])
usage = bx.meter_usage(
    workload["workload_id"],
    cpu_seconds=3600,
    ram_gb_seconds=7200,
)
```
