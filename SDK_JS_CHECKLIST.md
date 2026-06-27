# SDK JS ↔ Control Plane Integration Checklist (Real)

## Sursa: docs/reference/*.md + docs/guide/sdk-javascript-go.md + sdk/js/dist/client.d.ts

## 1. AUTHENTICATION
- [x] Backend: POST /v1/auth/register
- [x] Backend: POST /v1/auth/login
- [ ] SDK: `BoxtyClient.signup()` method (missing)
- [ ] SDK: `BoxtyClient.login()` method (missing)
- [ ] SDK: `BoxtyClient.whoami()` method (documentat in reference)
- [ ] SDK: Token storage and reuse across requests
- [ ] SDK: Auto-refresh token if expired
- [ ] SDK: `BoxtyClient.from_env()` (documentat in reference/client.md)
- [ ] SDK: `BoxtyClient.from_credentials()` (documentat in reference/client.md)

## 2. WORKSPACES
- [x] Backend: GET /v1/workspaces
- [x] Backend: POST /v1/workspaces
- [x] Backend: DELETE /v1/workspaces/{id}
- [ ] SDK: `BoxtyClient.workspaces()` method (missing)
- [ ] SDK: `BoxtyClient.createWorkspace()` method (missing)
- [ ] SDK: `BoxtyClient.deleteWorkspace()` method (missing)
- [ ] SDK: `BoxtyClient.getWorkspace()` method (missing)
- [ ] SDK: `boxty.Workspace.from_context()` (documentat in reference/workspace.md)
- [ ] SDK: `boxty.Workspace.members.list()` (documentat in reference/workspace.md)
- [ ] SDK: `boxty.Workspace.billing.report()` (documentat in reference/workspace.md)
- [ ] SDK: `boxty.Workspace.proxy_tokens.create/list/allow/revoke/delete()` (documentat in reference/workspace.md)

## 3. ENVIRONMENTS
- [x] Backend: GET /v1/workspaces/{ws}/environments
- [x] Backend: POST /v1/environments
- [x] Backend: DELETE /v1/environments/{id}
- [ ] SDK: `BoxtyClient.environments()` method (missing)
- [ ] SDK: `BoxtyClient.createEnvironment()` method (missing)
- [ ] SDK: `BoxtyClient.deleteEnvironment()` method (missing)
- [ ] SDK: `BoxtyClient.getEnvironment()` method (missing)
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
- [ ] SDK: `BoxtyClient.createWorkload()` method (missing)
- [ ] SDK: `BoxtyClient.listWorkloads()` method (missing)
- [ ] SDK: `BoxtyClient.getWorkload()` method (missing)
- [ ] SDK: `BoxtyClient.deleteWorkload()` method (missing)
- [ ] SDK: `BoxtyClient.getWorkloadMetrics()` method (missing)
- [ ] SDK: `BoxtyClient.getWorkloadLogs()` method (missing)
- [ ] SDK: `boxty.App.lookup()` (documentat in reference/app.md)
- [ ] SDK: `boxty.App.run()` (documentat in reference/app.md)
- [ ] SDK: `boxty.App.deploy()` (documentat in reference/app.md)
- [ ] SDK: `boxty.App.local_entrypoint()` (documentat in reference/app.md)
- [ ] SDK: `boxty.App.get_dashboard_url()` (documentat in reference/app.md)
- [ ] SDK: `boxty.App.function()` decorator (documentat in reference/app.md)
- [ ] SDK: `boxty.App.cls()` decorator (documentat in reference/app.md)
- [ ] SDK: `boxty.App.server()` decorator (documentat in reference/app.md)

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

## 6. SANDBOXES
- [x] Backend: POST /v1/sandbox-sessions
- [x] Backend: GET /v1/sandbox-sessions/verify
- [ ] SDK: `BoxtyClient.createSandboxSession()` method (missing)
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

## 7. VOLUMES
- [x] Backend: GET /v1/volumes
- [x] Backend: POST /v1/volumes
- [x] Backend: DELETE /v1/volumes/{ws}/{locator}
- [x] Backend: GET /v1/volumes/{locator}/entries
- [x] Backend: PUT /v1/volumes/{locator}/blob
- [x] Backend: GET /v1/volumes/{locator}/blob
- [x] Backend: DELETE /v1/volumes/{locator}/blob
- [x] SDK: `BoxtyClient.listVolumes()` exists (client.d.ts:17)
- [x] SDK: `BoxtyClient.createVolume()` exists (client.d.ts:18)
- [x] SDK: `BoxtyClient.deleteVolume()` exists (client.d.ts:19)
- [x] SDK: `BoxtyClient.listVolumeEntries()` exists (client.d.ts:20)
- [x] SDK: `BoxtyClient.putVolumeEntry()` exists (client.d.ts:21)
- [x] SDK: `BoxtyClient.deleteVolumeEntry()` exists (client.d.ts:22)
- [x] SDK: `BoxtyClient.putVolumeBlob()` exists (client.d.ts:23)
- [x] SDK: `BoxtyClient.objectUrl()` exists (client.d.ts:24)
- [ ] SDK: `BoxtyClient.getVolumeBlob()` method (missing)
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
- [x] SDK: `BoxtyClient.listSecrets()` exists (client.d.ts:14)
- [x] SDK: `BoxtyClient.createSecret()` exists (client.d.ts:15)
- [x] SDK: `BoxtyClient.deleteSecret()` exists (client.d.ts:16)
- [ ] SDK: `BoxtyClient.getSecret()` method (missing)
- [ ] SDK: `BoxtyClient.updateSecret()` method (missing)
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
- [ ] SDK: `BoxtyClient.listApiKeys()` method (missing)
- [ ] SDK: `BoxtyClient.createApiKey()` method (missing)
- [ ] SDK: `BoxtyClient.deleteApiKey()` method (missing)
- [ ] SDK: API Key type/interface

## 10. IMAGES
- [x] Backend: GET /v1/images
- [x] Backend: POST /v1/images/build
- [ ] SDK: `BoxtyClient.listImages()` method (missing)
- [ ] SDK: `BoxtyClient.buildImage()` method (missing)
- [ ] SDK: `BoxtyClient.getImage()` method (missing)
- [ ] SDK: `boxty.Image.debian_slim()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.from_registry()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.from_id()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.build()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.pip_install()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.uv_pip_install()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.add_local_file()` (documentat in reference/image.md)
- [ ] SDK: `boxty.Image.add_local_dir()` (documentat in reference/image.md)

## 11. BILLING
- [x] Backend: GET /v1/pricing
- [x] Backend: GET /v1/billing/balance
- [x] Backend: GET /v1/billing/usage
- [x] Backend: POST /v1/billing/credits
- [ ] SDK: `BoxtyClient.getBalance()` method (missing)
- [ ] SDK: `BoxtyClient.getUsage()` method (missing)
- [ ] SDK: `BoxtyClient.addCredits()` method (missing)
- [ ] SDK: `BoxtyClient.getPricing()` method (missing)
- [ ] SDK: `boxty.billing.workspace_billing_report()` (documentat in reference/billing.md)
- [ ] SDK: `boxty.Workspace.billing.report()` (documentat in reference/billing.md)
- [ ] SDK: `boxty.Environment.billing.report()` (documentat in reference/billing.md)
- [ ] SDK: Billing/Usage type/interface

## 12. DASHBOARD
- [x] Backend: GET /v1/dashboard/{ws}/{env}
- [x] Backend: GET /v1/dashboard/{ws}/{env}/summary
- [ ] SDK: `BoxtyClient.getDashboard()` method (missing)
- [ ] SDK: `BoxtyClient.getDashboardSummary()` method (missing)
- [ ] SDK: DashboardSummary type/interface

## 13. ROUTES / ENDPOINTS
- [x] Backend: POST /v1/routes
- [x] Backend: GET /v1/routes
- [x] Backend: DELETE /v1/routes/{id}
- [ ] SDK: `BoxtyClient.listRoutes()` method (missing)
- [ ] SDK: `BoxtyClient.createRoute()` method (missing)
- [ ] SDK: `BoxtyClient.deleteRoute()` method (missing)
- [ ] SDK: Route type/interface

## 14. SCHEDULES / CRON
- [x] Backend: GET /v1/schedules
- [x] Backend: POST /v1/schedules
- [x] Backend: PATCH /v1/schedules/{id}
- [x] Backend: DELETE /v1/schedules/{id}
- [x] Backend: POST /v1/schedules/{id}/trigger
- [ ] SDK: `BoxtyClient.listSchedules()` method (missing)
- [ ] SDK: `BoxtyClient.createSchedule()` method (missing)
- [ ] SDK: `BoxtyClient.updateSchedule()` method (missing)
- [ ] SDK: `BoxtyClient.deleteSchedule()` method (missing)
- [ ] SDK: `BoxtyClient.triggerSchedule()` method (missing)
- [ ] SDK: `boxty.Period()` (documentat in reference)
- [ ] SDK: `boxty.Cron()` (documentat in reference)
- [ ] SDK: Schedule type/interface

## 15. INVITES / TEAM
- [x] Backend: GET /v1/invites
- [x] Backend: POST /v1/invites
- [ ] SDK: `BoxtyClient.listInvites()` method (missing)
- [ ] SDK: `BoxtyClient.createInvite()` method (missing)
- [ ] SDK: `BoxtyClient.acceptInvite()` method (missing)
- [ ] SDK: Invite type/interface

## 16. DATABASES (SDK-specific feature)
- [x] SDK: `BoxtyClient.listDatabases()` exists (client.d.ts:25)
- [x] SDK: `BoxtyClient.createDatabase()` exists (client.d.ts:26)
- [x] SDK: `BoxtyClient.deleteDatabase()` exists (client.d.ts:27)
- [x] SDK: `BoxtyClient.listDatabaseItems()` exists (client.d.ts:28)
- [x] SDK: `BoxtyClient.putDatabaseItem()` exists (client.d.ts:29)
- [x] SDK: `BoxtyClient.deleteDatabaseItem()` exists (client.d.ts:30)
- [x] SDK: `BoxtyClient.queryDatabase()` exists (client.d.ts:31)
- [ ] Backend: Databases endpoints — NOT IMPLEMENTED (SDK-only feature)

## 17. APP DECORATOR (SDK-specific)
- [ ] SDK: `@app.function()` decorator wired to control plane
- [ ] SDK: `@app.cls()` decorator wired to control plane
- [ ] SDK: `@app.server()` decorator wired to control plane
- [ ] SDK: `@app.build()` decorator wired to control plane
- [ ] SDK: Local dev server for testing functions
- [ ] SDK: Auto-deploy on file save

## 18. ERROR HANDLING
- [ ] SDK: Custom error classes (BoxtyError, BoxtyAuthError, etc.)
- [ ] SDK: Retry with exponential backoff
- [ ] SDK: Timeout configuration per-request
- [ ] SDK: Detailed error messages from backend
- [ ] SDK: Connection error handling

## 19. TYPES / INTERFACES
- [x] SDK: `CliState` type exists (types.d.ts)
- [x] SDK: `SecretInfo` type exists (types.d.ts)
- [x] SDK: `VolumeInfo` type exists (types.d.ts)
- [x] SDK: `VolumeEntry` type exists (types.d.ts)
- [x] SDK: `DatabaseInfo` type exists (types.d.ts)
- [x] SDK: `DatabaseItem` type exists (types.d.ts)
- [x] SDK: `DatabaseQueryParams` type exists (types.d.ts)
- [ ] SDK: `User` type/interface
- [ ] SDK: `Workspace` type/interface
- [ ] SDK: `Environment` type/interface
- [ ] SDK: `Workload` type/interface
- [ ] SDK: `ApiKey` type/interface
- [ ] SDK: `Route` type/interface
- [ ] SDK: `Schedule` type/interface
- [ ] SDK: `Image` type/interface
- [ ] SDK: `UsageRecord` type/interface
- [ ] SDK: `BillingRecord` type/interface

## 20. TESTING
- [ ] SDK: Unit tests for all client methods
- [ ] SDK: Integration tests against real backend
- [ ] SDK: Mock backend for offline testing
- [ ] SDK: Jest/Vitest setup
- [ ] SDK: Test coverage > 80%

## 21. DOCUMENTATION
- [ ] SDK: API reference docs (auto-generated from .d.ts)
- [ ] SDK: Usage examples for each feature
- [ ] SDK: Quickstart guide
- [ ] SDK: README with installation instructions
- [ ] SDK: Changelog

## 22. BUILD / DISTRIBUTION
- [x] SDK: dist/ folder exists with compiled JS
- [x] SDK: TypeScript declarations (.d.ts) exist
- [x] SDK: ESM + CJS builds exist
- [ ] SDK: npm package published
- [ ] SDK: Source maps included
- [ ] SDK: Tree-shaking friendly

## 23. CRITICAL PATH (ce trebuie implementat PRIMA)
- [ ] Add `BoxtyClient.login()` / `signup()` methods
- [ ] Add `BoxtyClient.listWorkloads()` / `createWorkload()` / `deleteWorkload()`
- [ ] Add `BoxtyClient.listWorkspaces()` / `createWorkspace()` / `deleteWorkspace()`
- [ ] Add `BoxtyClient.listRoutes()` / `createRoute()` / `deleteRoute()`
- [ ] Add `BoxtyClient.listSchedules()` / `createSchedule()` / `deleteSchedule()`
- [ ] Add `BoxtyClient.listImages()` / `buildImage()`
- [ ] Add `BoxtyClient.getBalance()` / `getUsage()` / `addCredits()`
- [ ] Add `BoxtyClient.getDashboard()` method
- [ ] Add typed interfaces for all entities
- [ ] Add proper error handling with custom error classes
- [ ] Add tests
- [ ] Publish to npm
