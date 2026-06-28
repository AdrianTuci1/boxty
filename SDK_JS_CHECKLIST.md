# SDK JS ↔ Control Plane Integration Checklist (Real)

## Sursa: docs/reference/*.md + docs/guide/sdk-javascript-go.md + sdk/js/dist/client.d.ts

## 1. AUTHENTICATION
- [x] Backend: POST /v1/auth/register
- [x] Backend: POST /v1/auth/login
- [x] Backend: GET /v1/auth/me
- [x] SDK: `BoxtyClient.signup()` method (client.ts)
- [x] SDK: `BoxtyClient.login()` method (client.ts)
- [ ] SDK: `BoxtyClient.whoami()` method (not implemented)
- [ ] SDK: Token storage and reuse across requests
- [ ] SDK: Auto-refresh token if expired
- [ ] SDK: `BoxtyClient.from_env()` (documentat in reference/client.md)
- [ ] SDK: `BoxtyClient.from_credentials()` (documentat in reference/client.md)

## 2. WORKSPACES
- [x] Backend: GET /v1/workspaces
- [x] Backend: POST /v1/workspaces
- [x] Backend: DELETE /v1/workspaces/{id}
- [x] SDK: `BoxtyClient.listWorkspaces()` method (client.ts)
- [x] SDK: `BoxtyClient.createWorkspace()` method (client.ts)
- [x] SDK: `BoxtyClient.deleteWorkspace()` method (client.ts)
- [x] SDK: `BoxtyClient.getWorkspace()` method (client.ts)
- [ ] SDK: `boxty.Workspace.from_context()` (documentat in reference/workspace.md)
- [ ] SDK: `boxty.Workspace.members.list()` (documentat in reference/workspace.md)
- [ ] SDK: `boxty.Workspace.billing.report()` (documentat in reference/workspace.md)
- [ ] SDK: `boxty.Workspace.proxy_tokens.create/list/allow/revoke/delete()` (documentat in reference/workspace.md)

## 3. ENVIRONMENTS
- [x] Backend: GET /v1/workspaces/{ws}/environments
- [x] Backend: POST /v1/environments
- [x] Backend: DELETE /v1/environments/{id}
- [x] SDK: `BoxtyClient.listEnvironments()` method (client.ts)
- [x] SDK: `BoxtyClient.createEnvironment()` method (client.ts)
- [x] SDK: `BoxtyClient.deleteEnvironment()` method (client.ts)
- [x] SDK: `BoxtyClient.getEnvironment()` method (client.ts)
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
- [x] SDK: `BoxtyClient.listWorkloads()` method (client.ts)
- [x] SDK: `BoxtyClient.createWorkload()` method (client.ts)
- [x] SDK: `BoxtyClient.getWorkload()` method (client.ts)
- [x] SDK: `BoxtyClient.deleteWorkload()` method (client.ts)
- [x] SDK: `BoxtyClient.updateWorkloadStatus()` method (client.ts)
- [x] SDK: `BoxtyClient.getWorkloadMetrics()` method (client.ts)
- [x] SDK: `BoxtyClient.getWorkloadLogs()` method (client.ts)
- [ ] SDK: `BoxtyClient.App.lookup()` (documentat in reference/app.md)
- [ ] SDK: `BoxtyClient.App.run()` (documentat in reference/app.md - context manager)
- [ ] SDK: `BoxtyClient.App.deploy()` (documentat in reference/app.md)
- [ ] SDK: `BoxtyClient.App.local_entrypoint()` (documentat in reference/app.md)
- [ ] SDK: `BoxtyClient.App.get_dashboard_url()` (documentat in reference/app.md)

## 5. FUNCTIONS
- [x] Backend: Workloads cu kind=function
- [ ] SDK: `BoxtyClient.Function.from_name()` (documentat in reference/function.md)
- [ ] SDK: `BoxtyClient.Function.remote()` (documentat in reference/function.md)
- [ ] SDK: `BoxtyClient.Function.remote_gen()` (documentat in reference/function.md)
- [ ] SDK: `BoxtyClient.Function.local()` (documentat in reference/function.md)
- [ ] SDK: `BoxtyClient.Function.spawn()` (documentat in reference/function.md)
- [ ] SDK: `BoxtyClient.Function.map()` (documentat in reference/function.md)
- [ ] SDK: `BoxtyClient.Function.starmap()` (documentat in reference/function.md)
- [ ] SDK: `BoxtyClient.Function.for_each()` (documentat in reference/function.md)
- [ ] SDK: `BoxtyClient.Function.spawn_map()` (documentat in reference/function.md)
- [ ] SDK: `BoxtyClient.Function.get_web_url()` (documentat in reference/function.md)
- [ ] SDK: `BoxtyClient.Function.with_options()` (documentat in reference/function.md)
- [ ] SDK: `BoxtyClient.Function.with_concurrency()` (documentat in reference/function.md)
- [ ] SDK: `BoxtyClient.Function.with_batching()` (documentat in reference/function.md)
- [ ] SDK: `BoxtyClient.Function.update_autoscaler()` (documentat in reference/function.md)
- [ ] SDK: `BoxtyClient.Function.get_current_stats()` (documentat in reference/function.md)
- [ ] SDK: `@app.function()` decorator (documentat in reference/function.md)
- [ ] SDK: `@app.cls()` decorator (documentat in reference/function.md)
- [ ] SDK: `@app.server()` decorator (documentat in reference/function.md)
- [ ] SDK: `@boxty.concurrent()` decorator (documentat in reference/function.md)
- [ ] SDK: `@boxty.batched()` decorator (documentat in reference/function.md)

## 6. SANDBOXES
- [x] Backend: POST /v1/sandbox-sessions
- [x] Backend: GET /v1/sandbox-sessions/verify
- [ ] SDK: `BoxtyClient.Sandbox.create()` (documentat in reference/sandbox.md)
- [ ] SDK: `BoxtyClient.Sandbox.from_name()` (documentat in reference/sandbox.md)
- [ ] SDK: `BoxtyClient.Sandbox.from_id()` (documentat in reference/sandbox.md)
- [ ] SDK: `BoxtyClient.Sandbox.wait()` (documentat in reference/sandbox.md)
- [ ] SDK: `BoxtyClient.Sandbox.wait_until_ready()` (documentat in reference/sandbox.md)
- [ ] SDK: `BoxtyClient.Sandbox.terminate()` (documentat in reference/sandbox.md)
- [ ] SDK: `BoxtyClient.Sandbox.poll()` (documentat in reference/sandbox.md)
- [ ] SDK: `BoxtyClient.Sandbox.exec()` (documentat in reference/sandbox.md)
- [ ] SDK: `BoxtyClient.Sandbox.tunnels()` (documentat in reference/sandbox.md)
- [ ] SDK: `BoxtyClient.Sandbox.create_connect_token()` (documentat in reference/sandbox.md)
- [ ] SDK: `BoxtyClient.Sandbox.snapshot_filesystem()` (documentat in reference/sandbox.md)
- [ ] SDK: `BoxtyClient.Sandbox.snapshot_directory()` (documentat in reference/sandbox.md)
- [ ] SDK: `BoxtyClient.Sandbox.mount_image()` (documentat in reference/sandbox.md)
- [ ] SDK: `BoxtyClient.Sandbox.unmount_image()` (documentat in reference/sandbox.md)
- [ ] SDK: `BoxtyClient.Sandbox.filesystem.copy_from_local()` (documentat in reference/sandbox.md)
- [ ] SDK: `BoxtyClient.Sandbox.filesystem.copy_to_local()` (documentat in reference/sandbox.md)

## 7. VOLUMES
- [x] Backend: GET /v1/volumes
- [x] Backend: POST /v1/volumes
- [x] Backend: DELETE /v1/volumes/{ws}/{locator}
- [x] Backend: GET /v1/volumes/{locator}/entries
- [x] Backend: PUT /v1/volumes/{locator}/blob
- [x] Backend: GET /v1/volumes/{locator}/blob
- [x] Backend: DELETE /v1/volumes/{locator}/blob
- [x] SDK: `BoxtyClient.listVolumes()` method (client.ts)
- [x] SDK: `BoxtyClient.createVolume()` method (client.ts)
- [x] SDK: `BoxtyClient.deleteVolume()` method (client.ts)
- [x] SDK: `BoxtyClient.listVolumeEntries()` method (client.ts)
- [x] SDK: `BoxtyClient.putVolumeEntry()` method (client.ts)
- [x] SDK: `BoxtyClient.deleteVolumeEntry()` method (client.ts)
- [x] SDK: `BoxtyClient.putVolumeBlob()` method (client.ts)
- [x] SDK: `BoxtyClient.objectUrl()` method (client.ts)
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
- [x] SDK: `BoxtyClient.listSecrets()` method (client.ts)
- [x] SDK: `BoxtyClient.createSecret()` method (client.ts)
- [x] SDK: `BoxtyClient.deleteSecret()` method (client.ts)
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
- [x] SDK: `BoxtyClient.listApiKeys()` method (client.ts)
- [x] SDK: `BoxtyClient.createApiKey()` method (client.ts)
- [x] SDK: `BoxtyClient.deleteApiKey()` method (client.ts)

## 10. IMAGES
- [x] Backend: GET /v1/images
- [x] Backend: POST /v1/images/build
- [x] SDK: `BoxtyClient.listImages()` method (client.ts)
- [x] SDK: `BoxtyClient.buildImage()` method (client.ts)
- [x] SDK: `BoxtyClient.getImage()` method (client.ts)
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
- [x] SDK: `BoxtyClient.getBalance()` method (client.ts)
- [x] SDK: `BoxtyClient.getUsage()` method (client.ts)
- [x] SDK: `BoxtyClient.addCredits()` method (client.ts)
- [x] SDK: `BoxtyClient.getPricing()` method (client.ts)
- [ ] SDK: `boxty.billing.workspace_billing_report()` (documentat in reference/billing.md)
- [ ] SDK: `boxty.Workspace.billing.report()` (documentat in reference/billing.md)
- [ ] SDK: `boxty.Environment.billing.report()` (documentat in reference/billing.md)

## 12. DASHBOARD
- [x] Backend: GET /v1/dashboard/{ws}/{env}
- [x] Backend: GET /v1/dashboard/{ws}/{env}/summary
- [x] SDK: `BoxtyClient.getDashboard()` method (client.ts)
- [x] SDK: `BoxtyClient.getDashboardSummary()` method (client.ts)

## 13. ROUTES / ENDPOINTS
- [x] Backend: POST /v1/routes
- [x] Backend: GET /v1/routes
- [x] Backend: DELETE /v1/routes/{id}
- [x] SDK: `BoxtyClient.listRoutes()` method (client.ts)
- [x] SDK: `BoxtyClient.createRoute()` method (client.ts)
- [x] SDK: `BoxtyClient.deleteRoute()` method (client.ts)

## 14. SCHEDULES / CRON
- [x] Backend: GET /v1/schedules
- [x] Backend: POST /v1/schedules
- [x] Backend: PATCH /v1/schedules/{id}
- [x] Backend: DELETE /v1/schedules/{id}
- [x] Backend: POST /v1/schedules/{id}/trigger
- [x] SDK: `BoxtyClient.listSchedules()` method (client.ts)
- [x] SDK: `BoxtyClient.createSchedule()` method (client.ts)
- [x] SDK: `BoxtyClient.updateSchedule()` method (client.ts)
- [x] SDK: `BoxtyClient.deleteSchedule()` method (client.ts)
- [x] SDK: `BoxtyClient.triggerSchedule()` method (client.ts)
- [ ] SDK: `boxty.Period()` (documentat in reference/schedule.md)
- [ ] SDK: `boxty.Cron()` (documentat in reference/schedule.md)

## 15. INVITES / TEAM
- [x] Backend: GET /v1/invites
- [x] Backend: POST /v1/invites
- [x] SDK: `BoxtyClient.listInvites()` method (client.ts)
- [x] SDK: `BoxtyClient.createInvite()` method (client.ts)
- [x] SDK: `BoxtyClient.acceptInvite()` method (client.ts)

## 16. PROVIDERS (Admin)
- [x] Backend: GET /v1/providers
- [x] Backend: POST /v1/providers/register
- [x] Backend: POST /v1/providers/{id}/heartbeat
- [x] Backend: DELETE /v1/providers/{id}
- [x] SDK: `BoxtyClient.listProviders()` method (client.ts)
- [x] SDK: `BoxtyClient.registerProvider()` method (client.ts)
- [x] SDK: `BoxtyClient.deleteProvider()` method (client.ts)

## 17. CONFIG & CONTEXT
- [ ] SDK: `BoxtyClient.config` (not implemented)
- [ ] SDK: `BoxtyClient.context` (not implemented)
- [ ] SDK: `BoxtyClient.from_env()` (not implemented)
- [ ] SDK: `BoxtyClient.from_credentials()` (not implemented)

## 18. DEPLOY / RUN
- [ ] SDK: `BoxtyClient.deploy()` (not implemented)
- [ ] SDK: `BoxtyClient.run()` (not implemented)
- [ ] SDK: `BoxtyClient.serve()` (not implemented)
- [ ] SDK: `BoxtyClient.App.run()` (not implemented)
- [ ] SDK: `BoxtyClient.App.deploy()` (not implemented)
- [ ] SDK: `BoxtyClient.enable_output()` (not implemented)

## 19. NETWORK / PROXY
- [ ] SDK: `BoxtyClient.Proxy` class (not implemented)
- [ ] SDK: `BoxtyClient.Probe` class (not implemented)
- [ ] SDK: `BoxtyClient.NetworkFileSystem` class (not implemented)
- [ ] SDK: `BoxtyClient.CloudBucketMount` class (not implemented)

## 20. DATABASES (SDK-only feature, not in backend)
- [x] SDK: `BoxtyClient.listDatabases()` method (client.ts)
- [x] SDK: `BoxtyClient.createDatabase()` method (client.ts)
- [x] SDK: `BoxtyClient.deleteDatabase()` method (client.ts)
- [x] SDK: `BoxtyClient.listDatabaseItems()` method (client.ts)
- [x] SDK: `BoxtyClient.putDatabaseItem()` method (client.ts)
- [x] SDK: `BoxtyClient.deleteDatabaseItem()` method (client.ts)
- [x] SDK: `BoxtyClient.queryDatabase()` method (client.ts)
- [ ] Backend: Databases endpoints — NOT IMPLEMENTED

## 21. INFRASTRUCTURE
- [x] SDK: TypeScript project structure (sdk/js/)
- [x] SDK: HTTP client layer (native fetch)
- [x] SDK: Type definitions (types.ts)
- [x] SDK: No external dependencies
- [ ] SDK: Token storage and reuse
- [ ] SDK: Auto-refresh token
- [ ] SDK: Progress bars for long operations
- [ ] SDK: Error handling with helpful messages

## 22. CRITICAL PATH (ce trebuie implementat PRIMA)
- [x] `BoxtyClient.login()` + token storage
- [x] `BoxtyClient.listWorkspaces()` / `BoxtyClient.createWorkspace()`
- [x] `BoxtyClient.listEnvironments()` / `BoxtyClient.createEnvironment()`
- [x] `BoxtyClient.listWorkloads()` / `BoxtyClient.createWorkload()`
- [x] `BoxtyClient.listVolumes()` / `BoxtyClient.createVolume()`
- [x] `BoxtyClient.listSecrets()` / `BoxtyClient.createSecret()`
- [x] `BoxtyClient.getBalance()` / `BoxtyClient.getUsage()`
- [x] `BoxtyClient.getDashboard()` / `BoxtyClient.getDashboardSummary()`
- [x] `BoxtyClient.listRoutes()` / `BoxtyClient.createRoute()`
- [x] `BoxtyClient.listSchedules()` / `BoxtyClient.createSchedule()`
- [x] `BoxtyClient.listImages()` / `BoxtyClient.buildImage()`
- [x] `BoxtyClient.listInvites()` / `BoxtyClient.createInvite()`
- [x] `BoxtyClient.listProviders()` / `BoxtyClient.registerProvider()`
