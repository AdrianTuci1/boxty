# SDK Python Implementation Checklist

> Updated: 2026-06-28
> Status: ~75% complete (API client 100%, declarative API 80%, advanced features 50%)

## ✅ API Client (Complete)

### Auth
- [x] `POST /v1/auth/register` → `Boxty.signup()`
- [x] `POST /v1/auth/login` → `Boxty.login()`
- [x] `GET /v1/auth/me` → `Boxty.whoami()`
- [x] `Boxty.from_env()` factory method
- [x] `Boxty.from_credentials()` factory method
- [x] Token storage in client

### Accounts & Users
- [x] `GET /v1/accounts/{user_id}` → `Boxty.get_account()`
- [x] `GET /v1/users/{user_id}` → `Boxty.get_user()`

### Workspaces
- [x] `GET /v1/workspaces` → `Boxty.workspaces()`
- [x] `POST /v1/workspaces` → `Boxty.create_workspace()`
- [x] `GET /v1/workspaces/{id}` → `Boxty.get_workspace()`
- [x] `PATCH /v1/workspaces/{id}` → `Boxty.update_workspace()`
- [x] `DELETE /v1/workspaces/{id}` → `Boxty.delete_workspace()`
- [x] `Workspace` class with `members()`, `billing_report()`, `proxy_tokens()`
- [x] `ProxyTokenManager` class

### Environments
- [x] `GET /v1/workspaces/{id}/environments` → `Boxty.environments()`
- [x] `POST /v1/environments` → `Boxty.create_environment()`
- [x] `GET /v1/environments/{id}` → `Boxty.get_environment()`
- [x] `PATCH /v1/environments/{id}` → `Boxty.update_environment()`
- [x] `DELETE /v1/environments/{id}` → `Boxty.delete_environment()`
- [x] `Environment` class with `from_name()`, `objects()`, `members()`, `billing_report()`
- [x] `ObjectManager` class

### API Keys
- [x] `GET /v1/api-keys` → `Boxty.api_keys()`
- [x] `POST /v1/api-keys` → `Boxty.create_api_key()`
- [x] `GET /v1/api-keys/{id}` → `Boxty.get_api_key()`
- [x] `PATCH /v1/api-keys/{id}` → `Boxty.update_api_key()`
- [x] `DELETE /v1/api-keys/{id}` → `Boxty.delete_api_key()`

### Workloads
- [x] `GET /v1/workloads` → `Boxty.list_workloads()`
- [x] `POST /v1/workloads` → `Boxty.create_workload()`
- [x] `GET /v1/workloads/{id}` → `Boxty.get_workload()`
- [x] `PATCH /v1/workloads/{id}` → `Boxty.update_workload()`
- [x] `POST /v1/workloads/{id}/status` → `Boxty.update_workload_status()`
- [x] `DELETE /v1/workloads/{id}` → `Boxty.delete_workload()`
- [x] `GET /v1/workloads/{id}/metrics` → `Boxty.get_workload_metrics()`
- [x] `GET /v1/workloads/{id}/logs` → `Boxty.get_workload_logs()`
- [x] `GET /v1/workloads/{id}/launch-spec` → `Boxty.get_workload_launch_spec()`

### Routes
- [x] `GET /v1/routes` → `Boxty.list_routes()`
- [x] `POST /v1/routes` → `Boxty.create_route()`
- [x] `GET /v1/routes/{id}` → `Boxty.get_route()`
- [x] `DELETE /v1/routes/{id}` → `Boxty.delete_route()`

### Schedules
- [x] `GET /v1/schedules` → `Boxty.list_schedules()`
- [x] `POST /v1/schedules` → `Boxty.create_schedule()`
- [x] `GET /v1/schedules/{id}` → `Boxty.get_schedule()`
- [x] `PATCH /v1/schedules/{id}` → `Boxty.update_schedule()`
- [x] `DELETE /v1/schedules/{id}` → `Boxty.delete_schedule()`
- [x] `POST /v1/schedules/{id}/trigger` → `Boxty.trigger_schedule()`
- [x] `Period` class
- [x] `Cron` class

### Images
- [x] `GET /v1/images` → `Boxty.list_images()`
- [x] `POST /v1/images/build` → `Boxty.build_image()`
- [x] `GET /v1/images/{id}` → `Boxty.get_image()`
- [x] `DELETE /v1/images/{id}` → `Boxty.delete_image()`
- [x] `Image` class with `debian_slim()`, `from_registry()`, `from_id()`, `build()`, `pip_install()`, etc.

### Secrets
- [x] `GET /v1/secrets` → `Boxty.secrets.list()`
- [x] `POST /v1/secrets` → `Boxty.secrets.create()`
- [x] `GET /v1/secrets/{id}` → `Boxty.secrets.get()`
- [x] `PATCH /v1/secrets/{id}` → `Boxty.secrets.update()`
- [x] `DELETE /v1/secrets/{id}` → `Boxty.secrets.delete()`
- [x] `Secret` class with `from_name()`, `from_dict()`, `from_local_environ()`, `from_dotenv()`, `update()`, `info()`

### Volumes
- [x] `GET /v1/volumes` → `Boxty.volumes.list()`
- [x] `POST /v1/volumes` → `Boxty.volumes.create()`
- [x] `GET /v1/volumes/{id}` → `Boxty.volumes.get()`
- [x] `DELETE /v1/volumes/{id}` → `Boxty.volumes.delete()`
- [x] `Volume` class with `from_name()`, `from_id()`, `objects()`, `reload()`, `rename()`

### Databases
- [x] `GET /v1/databases` → `Boxty.databases.list()`
- [x] `POST /v1/databases` → `Boxty.databases.create()`
- [x] `GET /v1/databases/{id}` → `Boxty.databases.get()`
- [x] `DELETE /v1/databases/{id}` → `Boxty.databases.delete()`
- [x] `GET /v1/databases/{id}/items` → `Boxty.databases.list_items()`
- [x] `GET /v1/databases/{id}/items?pk=` → `Boxty.databases.get_item()`
- [x] `POST /v1/databases/{id}/items` → `Boxty.databases.put_item()`
- [x] `DELETE /v1/databases/{id}/items` → `Boxty.databases.delete_item()`
- [x] `POST /v1/databases/{id}/query` → `Boxty.databases.query()`

### Billing
- [x] `GET /v1/billing/balance` → `Boxty.billing_balance()`
- [x] `GET /v1/billing/usage` → `Boxty.billing_usage()`
- [x] `POST /v1/billing/credits` → `Boxty.add_credits()`
- [x] `POST /v1/billing/checkout` → `Boxty.create_checkout()`
- [x] `GET /v1/billing/history` → `Boxty.get_billing_history()`
- [x] `GET /v1/billing/invoices` → `Boxty.get_invoices()`

### Usage
- [x] `GET /v1/usage` → `Boxty.list_usage()`
- [x] `POST /v1/usage/meter` → `Boxty.meter_usage()`

### Invites
- [x] `GET /v1/invites` → `Boxty.list_invites()`
- [x] `POST /v1/invites` → `Boxty.create_invite()`
- [x] `POST /v1/invites/accept` → `Boxty.accept_invite()`
- [x] `GET /v1/invites/{id}` → `Boxty.get_invite()`
- [x] `DELETE /v1/invites/{id}` → `Boxty.delete_invite()`

### Providers
- [x] `GET /v1/providers` → `Boxty.list_providers()`
- [x] `GET /v1/providers/{id}` → `Boxty.get_provider()`
- [x] `POST /v1/providers/register` → `Boxty.register_provider()`
- [x] `DELETE /v1/providers/{id}` → `Boxty.delete_provider()`
- [x] `POST /v1/providers/{id}/heartbeat` → `Boxty.provider_heartbeat()`
- [x] `POST /v1/providers/{id}/assignments/next` → `Boxty.claim_next_assignment()`

### Sandbox Sessions
- [x] `POST /v1/sandbox-sessions` → `Boxty.create_sandbox_session()`
- [x] `GET /v1/sandbox-sessions/verify` → `Boxty.verify_sandbox_session()`
- [x] `Sandbox` class with `create()`, `wait()`, `terminate()`, `exec()`, `tunnels()`, etc.
- [x] `FileSystemManager` class

### RunPod
- [x] `POST /v1/runpod/dispatch` → `Boxty.dispatch_runpod()`

### Dashboard
- [x] `GET /v1/dashboard/{ws}/{env}` → `Boxty.dashboard()`
- [x] `GET /v1/dashboard/{ws}/{env}/summary` → `Boxty.dashboard_summary()`

### Pricing
- [x] `GET /v1/pricing` → `Boxty.pricing()`

## ✅ Declarative API (App)

- [x] `App` class
- [x] `@app.function()` decorator
- [x] `@app.web_endpoint()` decorator
- [x] `@app.cls()` decorator
- [x] `@app.server()` decorator
- [x] `App.to_manifest()`
- [x] `App.to_manifest_json()`
- [x] `App.run()`
- [x] `App.deploy()` (placeholder)
- [x] `App.local_entrypoint()`
- [x] `App.get_dashboard_url()`
- [x] `App.lookup()`
- [x] `@boxty.concurrent()` decorator
- [x] `@boxty.batched()` decorator
- [x] `FunctionDef` dataclass
- [x] `WebEndpointDef` dataclass

## ✅ Resource Classes

- [x] `Workspace`
- [x] `Environment`
- [x] `Secret`
- [x] `Image`
- [x] `Sandbox`
- [x] `Volume`
- [x] `Function`
- [x] `Period`
- [x] `Cron`
- [x] `Proxy`
- [x] `Probe`
- [x] `NetworkFileSystem`
- [x] `CloudBucketMount`
- [x] `ObjectManager`
- [x] `ProxyTokenManager`
- [x] `FileSystemManager`

## ✅ Exceptions

- [x] `BoxtyError`
- [x] `BoxtyAPIError`
- [x] `BoxtyAuthError`
- [x] `BoxtyNotFoundError`
- [x] `BoxtyValidationError`
- [x] `BoxtyConnectionError`
- [x] `BoxtyTimeoutError`

## ⚠️ Partial / Placeholder

- [ ] `App.deploy()` - requires CLI integration
- [ ] `Function.remote()` - requires runtime context
- [ ] `Function.spawn()` - requires runtime context
- [ ] `Function.map()` - requires runtime context
- [ ] `Sandbox.from_name()` - not yet implemented in backend
- [ ] `Sandbox.exec()` - not yet implemented in backend
- [ ] `Volume.listdir()` - not yet implemented in backend
- [ ] `Volume.read_file()` - not yet implemented in backend
- [ ] `Workspace.billing_report()` - not yet implemented in backend
- [ ] `Environment.billing_report()` - not yet implemented in backend
- [ ] `ProxyTokenManager` methods - not yet implemented in backend
- [ ] `Image.pip_install()` - builder pattern, needs backend integration
- [ ] Auto-refresh token
- [ ] Progress bars for long operations
- [ ] `Boxty.config` / `Boxty.context`
- [ ] `Boxty.deploy()` / `Boxty.run()` / `Boxty.serve()`

## ❌ Not Implemented (Backend Missing)

- [ ] Database endpoints in control plane (backend has them, SDK has them)
- [ ] Billing workspace/environment reports
- [ ] RBAC for environment members
- [ ] Proxy tokens API
- [ ] Sandbox filesystem operations (copy_from_local, copy_to_local)
- [ ] Volume commit/snapshot operations
- [ ] Function autoscaler
- [ ] Function stats
