# SDK Python ↔ Control Plane Integration Checklist (Real)

## Sursa: docs/reference/*.md + sdk/python/boxty/*.py

## 1. AUTHENTICATION
- [x] Backend: POST /v1/auth/register
- [x] Backend: POST /v1/auth/login
- [x] Backend: GET /v1/auth/me
- [x] SDK: `Boxty.signup()` exists (client.py:49)
- [x] SDK: `Boxty.login()` exists (client.py:191)
- [ ] SDK: `Boxty.whoami()` method (not implemented)
- [ ] SDK: `BoxtyClient.from_env()` (not implemented)
- [ ] SDK: `BoxtyClient.from_credentials()` (not implemented)
- [ ] SDK: Token storage and reuse across requests
- [ ] SDK: Auto-refresh token if expired

## 2. WORKSPACES
- [x] Backend: GET /v1/workspaces
- [x] Backend: POST /v1/workspaces
- [x] Backend: DELETE /v1/workspaces/{id}
- [x] SDK: `Boxty.workspaces()` exists (client.py:66)
- [x] SDK: `Boxty.create_workspace()` exists (client.py:71)
- [x] SDK: `Boxty.delete_workspace()` exists (client.py:199)
- [x] SDK: `Boxty.get_workspace()` exists (client.py:204)
- [ ] SDK: `Boxty.update_workspace()` method (not implemented)
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
- [x] SDK: `Boxty.delete_environment()` exists (client.py:209)
- [x] SDK: `Boxty.get_environment()` exists (client.py:214)
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
- [x] Backend: POST /v1/workloads/{id}/status
- [x] Backend: GET /v1/workloads/{id}/metrics
- [x] Backend: GET /v1/workloads/{id}/logs
- [x] SDK: `Boxty.create_workload()` exists (client.py:109)
- [x] SDK: `Boxty.list_workloads()` exists (client.py:153)
- [x] SDK: `Boxty.get_workload()` exists (client.py:229)
- [x] SDK: `Boxty.delete_workload()` exists (client.py:234)
- [x] SDK: `Boxty.update_workload_status()` exists (client.py:239)
- [x] SDK: `Boxty.get_workload_metrics()` exists (client.py:244)
- [x] SDK: `Boxty.get_workload_logs()` exists (client.py:249)
- [x] SDK: `Boxty.list_workloads_filtered()` exists (client.py:254)
- [x] SDK: `Boxty.create_sandbox_session()` exists (client.py:158)
- [ ] SDK: `Boxty.App.lookup()` (documentat in reference/app.md)
- [ ] SDK: `Boxty.App.run()` (documentat in reference/app.md - context manager)
- [ ] SDK: `Boxty.App.deploy()` (documentat in reference/app.md)
- [ ] SDK: `Boxty.App.local_entrypoint()` (documentat in reference/app.md)
- [ ] SDK: `Boxty.App.get_dashboard_url()` (documentat in reference/app.md)

## 5. FUNCTIONS
- [x] Backend: Workloads cu kind=function
- [ ] SDK: `Boxty.Function.from_name()` (documentat in reference/function.md)
- [ ] SDK: `Boxty.Function.remote()` (documentat in reference/function.md)
- [ ] SDK: `Boxty.Function.remote_gen()` (documentat in reference/function.md)
- [ ] SDK: `Boxty.Function.local()` (documentat in reference/function.md)
- [ ] SDK: `Boxty.Function.spawn()` (documentat in reference/function.md)
- [ ] SDK: `Boxty.Function.map()` (documentat in reference/function.md)
- [ ] SDK: `Boxty.Function.starmap()` (documentat in reference/function.md)
- [ ] SDK: `Boxty.Function.for_each()` (documentat in reference/function.md)
- [ ] SDK: `Boxty.Function.spawn_map()` (documentat in reference/function.md)
- [ ] SDK: `Boxty.Function.get_web_url()` (documentat in reference/function.md)
- [ ] SDK: `Boxty.Function.with_options()` (documentat in reference/function.md)
- [ ] SDK: `Boxty.Function.with_concurrency()` (documentat in reference/function.md)
- [ ] SDK: `Boxty.Function.with_batching()` (documentat in reference/function.md)
- [ ] SDK: `Boxty.Function.update_autoscaler()` (documentat in reference/function.md)
- [ ] SDK: `Boxty.Function.get_current_stats()` (documentat in reference/function.md)
- [ ] SDK: `@app.function()` decorator (documentat in reference/function.md)
- [ ] SDK: `@app.cls()` decorator (documentat in reference/function.md)
- [ ] SDK: `@app.server()` decorator (documentat in reference/function.md)
- [ ] SDK: `@boxty.concurrent()` decorator (documentat in reference/function.md)
- [ ] SDK: `@boxty.batched()` decorator (documentat in reference/function.md)

## 6. SANDBOXES
- [x] Backend: POST /v1/sandbox-sessions
- [x] Backend: GET /v1/sandbox-sessions/verify
- [x] SDK: `Boxty.create_sandbox_session()` exists (client.py:158)
- [ ] SDK: `Boxty.Sandbox.create()` (documentat in reference/sandbox.md)
- [ ] SDK: `Boxty.Sandbox.from_name()` (documentat in reference/sandbox.md)
- [ ] SDK: `Boxty.Sandbox.from_id()` (documentat in reference/sandbox.md)
- [ ] SDK: `Boxty.Sandbox.wait()` (documentat in reference/sandbox.md)
- [ ] SDK: `Boxty.Sandbox.wait_until_ready()` (documentat in reference/sandbox.md)
- [ ] SDK: `Boxty.Sandbox.terminate()` (documentat in reference/sandbox.md)
- [ ] SDK: `Boxty.Sandbox.poll()` (documentat in reference/sandbox.md)
- [ ] SDK: `Boxty.Sandbox.exec()` (documentat in reference/sandbox.md)
- [ ] SDK: `Boxty.Sandbox.tunnels()` (documentat in reference/sandbox.md)
- [ ] SDK: `Boxty.Sandbox.create_connect_token()` (documentat in reference/sandbox.md)
- [ ] SDK: `Boxty.Sandbox.snapshot_filesystem()` (documentat in reference/sandbox.md)
- [ ] SDK: `Boxty.Sandbox.snapshot_directory()` (documentat in reference/sandbox.md)
- [ ] SDK: `Boxty.Sandbox.mount_image()` (documentat in reference/sandbox.md)
- [ ] SDK: `Boxty.Sandbox.unmount_image()` (documentat in reference/sandbox.md)
- [ ] SDK: `Boxty.Sandbox.filesystem.copy_from_local()` (documentat in reference/sandbox.md)
- [ ] SDK: `Boxty.Sandbox.filesystem.copy_to_local()` (documentat in reference/sandbox.md)

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
- [x] SDK: `VolumesClient.put_entry()` exists (volumes.py)
- [x] SDK: `VolumesClient.delete_entry()` exists (volumes.py)
- [x] SDK: `VolumesClient.put_blob()` exists (volumes.py)
- [x] SDK: `VolumesClient.object_url()` exists (volumes.py)
- [ ] SDK: `boxty.Volume.from_name()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.from_id()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.ephemeral()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.objects.create/list/delete()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.commit()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.reload()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.listdir()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.read_file()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.remove_file()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.copy_files()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.batch_upload()` (documentat in reference/volume.md)
- [ ] SDK: `boxty.Volume.rename()` (documentat in reference/volume.md)

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
- [ ] SDK: `boxty.Secret.update()` (documentat in reference/secret.md)
- [ ] SDK: `boxty.Secret.info()` (documentat in reference/secret.md)

## 9. API KEYS / TOKENS
- [x] Backend: GET /v1/api-keys
- [x] Backend: POST /v1/api-keys
- [x] Backend: DELETE /v1/api-keys/{id}
- [x] SDK: `Boxty.api_keys()` exists (client.py:86)
- [x] SDK: `Boxty.create_api_key()` exists (client.py:91)
- [x] SDK: `Boxty.delete_api_key()` exists (client.py:219)
- [x] SDK: `Boxty.get_api_key()` exists (client.py:224)

## 10. IMAGES
- [x] Backend: GET /v1/images
- [x] Backend: POST /v1/images/build
- [x] SDK: `Boxty.list_images()` exists (client.py:321)
- [x] SDK: `Boxty.build_image()` exists (client.py:326)
- [x] SDK: `Boxty.get_image()` exists (client.py:331)
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

## 11. BILLING
- [x] Backend: GET /v1/pricing
- [x] Backend: GET /v1/billing/balance
- [x] Backend: GET /v1/billing/usage
- [x] Backend: POST /v1/billing/credits
- [x] SDK: `Boxty.balance()` exists (client.py:61)
- [x] SDK: `Boxty.pricing()` exists (client.py:104)
- [x] SDK: `Boxty.billing_balance()` exists (client.py:346)
- [x] SDK: `Boxty.billing_usage()` exists (client.py:351)
- [x] SDK: `Boxty.add_credits()` exists (client.py:356)
- [x] SDK: `Boxty.list_usage()` exists (client.py:361)
- [ ] SDK: `boxty.billing.workspace_billing_report()` (documentat in reference/billing.md)
- [ ] SDK: `boxty.Workspace.billing.report()` (documentat in reference/billing.md)
- [ ] SDK: `boxty.Environment.billing.report()` (documentat in reference/billing.md)

## 12. DASHBOARD
- [x] Backend: GET /v1/dashboard/{ws}/{env}
- [x] Backend: GET /v1/dashboard/{ws}/{env}/summary
- [x] SDK: `Boxty.dashboard()` exists (client.py:336)
- [x] SDK: `Boxty.dashboard_summary()` exists (client.py:341)

## 13. ROUTES / ENDPOINTS
- [x] Backend: POST /v1/routes
- [x] Backend: GET /v1/routes
- [x] Backend: DELETE /v1/routes/{id}
- [x] SDK: `Boxty.list_routes()` exists (client.py:264)
- [x] SDK: `Boxty.create_route()` exists (client.py:274)
- [x] SDK: `Boxty.delete_route()` exists (client.py:279)

## 14. SCHEDULES / CRON
- [x] Backend: GET /v1/schedules
- [x] Backend: POST /v1/schedules
- [x] Backend: PATCH /v1/schedules/{id}
- [x] Backend: DELETE /v1/schedules/{id}
- [x] Backend: POST /v1/schedules/{id}/trigger
- [x] SDK: `Boxty.list_schedules()` exists (client.py:284)
- [x] SDK: `Boxty.create_schedule()` exists (client.py:290)
- [x] SDK: `Boxty.update_schedule()` exists (client.py:306)
- [x] SDK: `Boxty.delete_schedule()` exists (client.py:311)
- [x] SDK: `Boxty.trigger_schedule()` exists (client.py:316)
- [ ] SDK: `boxty.Period()` (documentat in reference/schedule.md)
- [ ] SDK: `boxty.Cron()` (documentat in reference/schedule.md)

## 15. INVITES / TEAM
- [x] Backend: GET /v1/invites
- [x] Backend: POST /v1/invites
- [x] SDK: `Boxty.list_invites()` exists (client.py:371)
- [x] SDK: `Boxty.create_invite()` exists (client.py:377)
- [x] SDK: `Boxty.accept_invite()` exists (client.py:382)

## 16. PROVIDERS (Admin)
- [x] Backend: GET /v1/providers
- [x] Backend: POST /v1/providers/register
- [x] Backend: POST /v1/providers/{id}/heartbeat
- [x] Backend: DELETE /v1/providers/{id}
- [x] SDK: `Boxty.list_providers()` exists (client.py:387)
- [x] SDK: `Boxty.register_provider()` exists (client.py:392)
- [x] SDK: `Boxty.delete_provider()` exists (client.py:397)

## 17. CONFIG & CONTEXT
- [ ] SDK: `Boxty.config` (not implemented)
- [ ] SDK: `Boxty.context` (not implemented)
- [ ] SDK: `Boxty.Client.from_env()` (not implemented)
- [ ] SDK: `Boxty.Client.from_credentials()` (not implemented)

## 18. DEPLOY / RUN
- [ ] SDK: `Boxty.deploy()` (not implemented)
- [ ] SDK: `Boxty.run()` (not implemented)
- [ ] SDK: `Boxty.serve()` (not implemented)
- [ ] SDK: `Boxty.App.run()` (not implemented)
- [ ] SDK: `Boxty.App.deploy()` (not implemented)
- [ ] SDK: `Boxty.enable_output()` (not implemented)

## 19. NETWORK / PROXY
- [ ] SDK: `Boxty.Proxy` class (not implemented)
- [ ] SDK: `Boxty.Probe` class (not implemented)
- [ ] SDK: `Boxty.NetworkFileSystem` class (not implemented)
- [ ] SDK: `Boxty.CloudBucketMount` class (not implemented)

## 20. DATABASES (SDK-only feature, not in backend)
- [x] SDK: `Boxty.databases` sub-client exists (client.py:37)
- [x] SDK: `DatabasesClient.list/create/delete/list_items/put_item/delete_item/query` exists
- [ ] Backend: Databases endpoints — NOT IMPLEMENTED

## 21. INFRASTRUCTURE
- [x] SDK: Python project structure (sdk/python/)
- [x] SDK: HTTP client layer (httpx in deps)
- [x] SDK: Models (models.py)
- [x] SDK: Exceptions (exceptions.py)
- [ ] SDK: Token storage and reuse
- [ ] SDK: Auto-refresh token
- [ ] SDK: Progress bars for long operations
- [ ] SDK: Error handling with helpful messages

## 22. CRITICAL PATH (ce trebuie implementat PRIMA)
- [x] `Boxty.login()` + token storage
- [x] `Boxty.workspaces()` list/create/switch
- [x] `Boxty.environments()` list/create/switch
- [x] `Boxty.create_workload()` / `Boxty.list_workloads()`
- [x] `Boxty.volumes` list/create/delete
- [x] `Boxty.secrets` list/create/delete
- [x] `Boxty.billing_balance()` / `Boxty.billing_usage()`
- [x] `Boxty.dashboard()` / `Boxty.dashboard_summary()`
- [x] `Boxty.list_routes()` / `Boxty.create_route()`
- [x] `Boxty.list_schedules()` / `Boxty.create_schedule()`
- [x] `Boxty.list_images()` / `Boxty.build_image()`
- [x] `Boxty.list_invites()` / `Boxty.create_invite()`
- [x] `Boxty.list_providers()` / `Boxty.register_provider()`
