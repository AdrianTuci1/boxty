# SDK Python ↔ Control Plane Integration Checklist (Real)

## Sursa: docs/reference/*.md + sdk/python/boxty/*.py

## 1. AUTHENTICATION
- [x] Backend: POST /v1/auth/register
- [x] Backend: POST /v1/auth/login
- [x] SDK: `Boxty.signup()` exists (client.py:49)
- [ ] SDK: `Boxty.login()` method (missing — only signup exists)
- [ ] SDK: `Boxty.whoami()` method (documentat in reference)
- [ ] SDK: `BoxtyClient.from_env()` (documentat in reference/client.md)
- [ ] SDK: `BoxtyClient.from_credentials()` (documentat in reference/client.md)
- [ ] SDK: Token storage and reuse across requests
- [ ] SDK: Auto-refresh token if expired

## 2. WORKSPACES
- [x] Backend: GET /v1/workspaces
- [x] Backend: POST /v1/workspaces
- [x] Backend: DELETE /v1/workspaces/{id}
- [x] SDK: `Boxty.workspaces()` exists (client.py:66)
- [x] SDK: `Boxty.create_workspace()` exists (client.py:71)
- [ ] SDK: `Boxty.delete_workspace()` method (missing)
- [ ] SDK: `Boxty.get_workspace()` method (missing)
- [ ] SDK: `Boxty.update_workspace()` method (missing)
- [ ] SDK: `boxty.Workspace.from_context()` (documentat in reference/workspace.md)
- [ ] SDK: `boxty.Workspace.name()` (documentat in reference/workspace.md)
- [ ] SDK: `boxty.Workspace.members.list()` (documentat in reference/workspace.md)
- [ ] SDK: `boxty.Workspace.billing.report()` (documentat in reference/workspace.md)
- [ ] SDK: `boxty.Workspace.proxy_tokens.create/list/allow/revoke/delete()` (documentat in reference/workspace.md)

## 3. ENVIRONMENTS
- [x] Backend: GET /v1/workspaces/{ws}/environments
- [x] Backend: POST /v1/environments
- [x] Backend: DELETE /v1/environments/{id}
- [x] SDK: `Boxty.environments()` exists (client.py:76)
- [x] SDK: `Boxty.create_environment()` exists (client.py:81)
- [ ] SDK: `Boxty.delete_environment()` method (missing)
- [ ] SDK: `Boxty.get_environment()` method (missing)
- [ ] SDK: `boxty.Environment.from_context()` (documentat in reference/environment.md)
- [ ] SDK: `boxty.Environment.from_name()` (documentat in reference/environment.md)
- [ ] SDK: `boxty.Environment.objects.create/list/delete()` (documentat in reference/environment.md)
- [ ] SDK: `boxty.Environment.members.list/update/remove()` (documentat in reference/environment.md - RBAC)
- [ ] SDK: `boxty.Environment.billing.report()` (documentat in reference/environment.md)

## 4. APPS / WORKLOADS
- [x] Backend: GET /v1/workloads
- [x] Backend: POST /v1/workloads
- [x] Backend: GET /v1/workloads/{id}
- [x] Backend: DELETE /v1/workloads/{id}
- [x] Backend: GET /v1/workloads/{id}/metrics
- [x] Backend: GET /v1/workloads/{id}/logs
- [x] SDK: `Boxty.create_workload()` exists (client.py:109)
- [x] SDK: `Boxty.list_workloads()` exists (client.py:153)
- [ ] SDK: `Boxty.get_workload()` method (missing)
- [ ] SDK: `Boxty.delete_workload()` method (missing)
- [ ] SDK: `Boxty.stop_workload()` method (missing)
- [ ] SDK: `Boxty.get_workload_metrics()` method (missing)
- [ ] SDK: `Boxty.get_workload_logs()` method (missing)
- [ ] SDK: `boxty.App.lookup()` (documentat in reference/app.md)
- [ ] SDK: `boxty.App.run()` (documentat in reference/app.md)
- [ ] SDK: `boxty.App.deploy()` (documentat in reference/app.md)
- [ ] SDK: `boxty.App.local_entrypoint()` (documentat in reference/app.md)
- [ ] SDK: `boxty.App.get_dashboard_url()` (documentat in reference/app.md)
- [ ] SDK: `boxty.App.name()` (documentat in reference/app.md)
- [ ] SDK: `boxty.App.app_id()` (documentat in reference/app.md)
- [ ] SDK: `boxty.App.description()` (documentat in reference/app.md)
- [ ] SDK: `boxty.App.function()` decorator (documentat in reference/app.md)
- [ ] SDK: `boxty.App.cls()` decorator (documentat in reference/app.md)
- [ ] SDK: `boxty.App.server()` decorator (documentat in reference/app.md)
- [ ] SDK: `boxty.App.include()` (documentat in reference/app.md)

## 5. FUNCTIONS
- [x] Backend: Workloads cu kind=function
- [ ] SDK: `boxty.Function.from_name()` (documentat in reference/function.md)
- [ ] SDK: `boxty.Function.hydrate()` (documentat in reference/function.md)
- [ ] SDK: `boxty.Function.update_autoscaler()` (documentat in reference/function.md)
- [ ] SDK: `boxty.Function.get_web_url()` (documentat in reference/function.md)
- [ ] SDK: `boxty.Function.with_options()` (documentat in reference/function.md)
- [ ] SDK: `boxty.Function.with_concurrency()` (documentat in reference/function.md)
- [ ] SDK: `boxty.Function.with_batching()` (documentat in reference/function.md)
- [ ] SDK: `boxty.Function.remote()` (documentat in reference/function.md)
- [ ] SDK: `boxty.Function.remote_gen()` (documentat in reference/function.md)
- [ ] SDK: `boxty.Function.local()` (documentat in reference/function.md)
- [ ] SDK: `boxty.Function.spawn()` (documentat in reference/function.md)
- [ ] SDK: `boxty.Function.map()` (documentat in reference/function.md)
- [ ] SDK: `boxty.Function.starmap()` (documentat in reference/function.md)
- [ ] SDK: `boxty.Function.for_each()` (documentat in reference/function.md)
- [ ] SDK: `boxty.Function.spawn_map()` (documentat in reference/function.md)
- [ ] SDK: `boxty.Function.get_current_stats()` (documentat in reference/function.md)
- [ ] SDK: `boxty.Function.get_raw_f()` (documentat in reference/function.md)

## 6. SANDBOXES
- [x] Backend: POST /v1/sandbox-sessions
- [x] Backend: GET /v1/sandbox-sessions/verify
- [x] SDK: `Boxty.create_sandbox_session()` exists (client.py:158)
- [ ] SDK: `boxty.Sandbox.create()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.from_name()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.from_id()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.hydrate()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.detach()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.wait()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.wait_until_ready()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.terminate()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.poll()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.exec()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.tunnels()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.create_connect_token()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.snapshot_filesystem()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.snapshot_directory()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.mount_image()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.unmount_image()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.filesystem.copy_from_local()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.filesystem.copy_to_local()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.get_tags()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.set_tags()` (documentat in reference/sandbox.md)
- [ ] SDK: `boxty.Sandbox.reload_volumes()` (documentat in reference/sandbox.md)

## 7. VOLUMES
- [x] Backend: GET /v1/volumes
- [x] Backend: POST /v1/volumes
- [x] Backend: DELETE /v1/volumes/{ws}/{locator}
- [x] Backend: GET /v1/volumes/{locator}/entries
- [x] Backend: PUT /v1/volumes/{locator}/blob
- [x] Backend: GET /v1/volumes/{locator}/blob
- [x] Backend: DELETE /v1/volumes/{locator}/blob
- [x] SDK: `Boxty.volumes` sub-client exists (client.py:33)
- [x] SDK: `VolumesClient.list()` exists (volumes.py)
- [x] SDK: `VolumesClient.create()` exists (volumes.py)
- [x] SDK: `VolumesClient.delete()` exists (volumes.py)
- [x] SDK: `VolumesClient.list_entries()` exists (volumes.py)
- [x] SDK: `VolumesClient.put_blob()` exists (volumes.py)
- [x] SDK: `VolumesClient.get_blob()` exists (volumes.py)
- [ ] SDK: `boxty.Volume.from_name()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.from_id()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.ephemeral()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.objects.create/list/delete()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.name()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.with_mount_options()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.commit()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.reload()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.iterdir()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.listdir()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.read_file()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.remove_file()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.copy_files()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.batch_upload()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.rename()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.info()` (documentat in reference/volume.md)

## 8. SECRETS
- [x] Backend: GET /v1/secrets
- [x] Backend: POST /v1/secrets
- [x] Backend: DELETE /v1/secrets/{ws}/{name}
- [x] SDK: `Boxty.secrets` sub-client exists (client.py:29)
- [x] SDK: `SecretsClient.list()` exists (secrets.py)
- [x] SDK: `SecretsClient.create()` exists (secrets.py)
- [x] SDK: `SecretsClient.delete()` exists (secrets.py)
- [ ] SDK: `boxty.Secret.from_name()` (documentat in reference/secret.md)
- [ ] SDK: `boxty.Secret.from_dict()` (documentat in reference/secret.md)
- [ ] SDK: `boxty.Secret.from_local_environ()` (documentat in reference/secret.md)
- [ ] SDK: `boxty.Secret.from_dotenv()` (documentat in reference/secret.md)
- [ ] SDK: `boxty.Secret.objects.create/list/delete()` (documentat in reference/secret.md)
- [ ] SDK: `boxty.Secret.name()` (documentat in reference/secret.md)
- [ ] SDK: `boxty.Secret.update()` (documentat in reference/secret.md)
- [ ] SDK: `boxty.Secret.info()` (documentat in reference/secret.md)

## 9. API KEYS / TOKENS
- [x] Backend: GET /v1/api-keys
- [x] Backend: POST /v1/api-keys
- [x] Backend: DELETE /v1/api-keys/{id}
- [x] SDK: `Boxty.api_keys()` exists (client.py:86)
- [x] SDK: `Boxty.create_api_key()` exists (client.py:91)
- [ ] SDK: `Boxty.delete_api_key()` method (missing)
- [ ] SDK: `Boxty.get_api_key()` method (missing)
- [ ] SDK: API Key model/dataclass

## 10. IMAGES
- [x] Backend: GET /v1/images
- [x] Backend: POST /v1/images/build
- [ ] SDK: `Boxty.list_images()` method (missing)
- [ ] SDK: `Boxty.build_image()` method (missing)
- [ ] SDK: `Boxty.get_image()` method (missing)
- [ ] SDK: `boxty.Image.debian_slim()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.from_registry()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.from_id()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.build()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.pip_install()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.uv_pip_install()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.pip_install_from_requirements()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.pip_install_from_pyproject()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.poetry_install_from_file()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.uv_sync()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.add_local_file()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.add_local_dir()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.add_local_python_source()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.pip_install_private_repos()` (documentat in reference/image.md)

## 11. BILLING
- [x] Backend: GET /v1/pricing
- [x] Backend: GET /v1/billing/balance
- [x] Backend: GET /v1/billing/usage
- [x] Backend: POST /v1/billing/credits
- [x] SDK: `Boxty.balance()` exists (client.py:61)
- [x] SDK: `Boxty.pricing()` exists (client.py:104)
- [ ] SDK: `Boxty.billing_balance()` method (missing — only account balance)
- [ ] SDK: `Boxty.billing_usage()` method (missing)
- [ ] SDK: `Boxty.add_credits()` method (missing)
- [ ] SDK: `Boxty.usage_history()` method (missing)
- [ ] SDK: `boxty.billing.workspace_billing_report()` (documentat in reference/billing.md)
- [ ] SDK: `boxty.Workspace.billing.report()` (documentat in reference/billing.md)
- [ ] SDK: `boxty.Environment.billing.report()` (documentat in reference/billing.md)
- [ ] SDK: `boxty.billing.BillingReportItem` (documentat in reference/billing.md)
- [ ] SDK: `boxty.billing.WorkspaceBillingReportItem` (documentat in reference/billing.md)

## 12. DASHBOARD
- [x] Backend: GET /v1/dashboard/{ws}/{env}
- [x] Backend: GET /v1/dashboard/{ws}/{env}/summary
- [ ] SDK: `Boxty.dashboard()` method (missing)
- [ ] SDK: `Boxty.dashboard_summary()` method (missing)
- [ ] SDK: DashboardSummary model/dataclass

## 13. ROUTES / ENDPOINTS
- [x] Backend: POST /v1/routes
- [x] Backend: GET /v1/routes
- [x] Backend: DELETE /v1/routes/{id}
- [ ] SDK: `Boxty.list_routes()` method (missing)
- [ ] SDK: `Boxty.create_route()` method (missing)
- [ ] SDK: `Boxty.delete_route()` method (missing)
- [ ] SDK: Route model/dataclass

## 14. SCHEDULES / CRON
- [x] Backend: GET /v1/schedules
- [x] Backend: POST /v1/schedules
- [x] Backend: PATCH /v1/schedules/{id}
- [x] Backend: DELETE /v1/schedules/{id}
- [x] Backend: POST /v1/schedules/{id}/trigger
- [ ] SDK: `Boxty.list_schedules()` method (missing)
- [ ] SDK: `Boxty.create_schedule()` method (missing)
- [ ] SDK: `Boxty.update_schedule()` method (missing)
- [ ] SDK: `Boxty.delete_schedule()` method (missing)
- [ ] SDK: `Boxty.trigger_schedule()` method (missing)
- [ ] SDK: `boxty.Period()` (documentat in reference)
- [ ] SDK: `boxty.Cron()` (documentat in reference)
- [ ] SDK: Schedule model/dataclass

## 15. INVITES / TEAM
- [x] Backend: GET /v1/invites
- [x] Backend: POST /v1/invites
- [ ] SDK: `Boxty.list_invites()` method (missing)
- [ ] SDK: `Boxty.create_invite()` method (missing)
- [ ] SDK: `Boxty.accept_invite()` method (missing)
- [ ] SDK: Invite model/dataclass

## 16. USAGE METERING
- [x] Backend: POST /v1/usage/meter
- [x] SDK: `Boxty.meter_usage()` exists (client.py:170)
- [ ] SDK: UsageRecord model/dataclass

## 17. DATABASES (SDK-specific feature)
- [x] SDK: `Boxty.databases` sub-client exists (client.py:37)
- [x] SDK: `DatabasesClient.list()` exists (databases.py)
- [x] SDK: `DatabasesClient.create()` exists (databases.py)
- [x] SDK: `DatabasesClient.delete()` exists (databases.py)
- [x] SDK: `DatabasesClient.list_items()` exists (databases.py)
- [x] SDK: `DatabasesClient.put_item()` exists (databases.py)
- [x] SDK: `DatabasesClient.delete_item()` exists (databases.py)
- [x] SDK: `DatabasesClient.query()` exists (databases.py)
- [ ] Backend: Databases endpoints — NOT IMPLEMENTED (SDK-only feature)

## 18. APP DECORATOR (SDK-specific)
- [x] SDK: `App` decorator exists (app.py)
- [x] SDK: `Image` class exists (app.py)
- [x] SDK: `Mount` class exists (app.py)
- [x] SDK: `Secret` class exists (app.py)
- [x] SDK: `Volume` class exists (app.py)
- [ ] SDK: `@app.function()` decorator wired to control plane
- [ ] SDK: `@app.cls()` decorator wired to control plane
- [ ] SDK: `@app.server()` decorator wired to control plane
- [ ] SDK: `@app.build()` decorator wired to control plane
- [ ] SDK: Local dev server for testing functions
- [ ] SDK: Auto-deploy on file save

## 19. ERROR HANDLING
- [ ] SDK: Custom exception hierarchy (BoxtyError, BoxtyAuthError, etc.)
- [ ] SDK: Retry with exponential backoff
- [ ] SDK: Timeout configuration per-request
- [ ] SDK: Detailed error messages from backend
- [ ] SDK: Connection error handling

## 20. TESTING
- [ ] SDK: Unit tests for all client methods
- [ ] SDK: Integration tests against real backend
- [ ] SDK: Mock backend for offline testing
- [ ] SDK: pytest fixtures
- [ ] SDK: Test coverage > 80%

## 21. DOCUMENTATION
- [ ] SDK: API reference docs (auto-generated)
- [ ] SDK: Usage examples for each feature
- [ ] SDK: Quickstart guide
- [ ] SDK: README with installation instructions
- [ ] SDK: Changelog

## 22. CRITICAL PATH (ce trebuie implementat PRIMA)
- [ ] Add `Boxty.login()` method
- [ ] Add `Boxty.delete_workspace()` method
- [ ] Add `Boxty.delete_workload()` method
- [ ] Add `Boxty.get_workload()` method
- [ ] Add `Boxty.list_routes()` / `create_route()` / `delete_route()`
- [ ] Add `Boxty.list_schedules()` / `create_schedule()` / `delete_schedule()`
- [ ] Add `Boxty.list_images()` / `build_image()`
- [ ] Add `Boxty.dashboard()` method
- [ ] Add typed models/dataclasses for all entities
- [ ] Add proper error handling with custom exceptions
- [ ] Add tests
