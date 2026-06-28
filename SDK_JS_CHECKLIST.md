# SDK JavaScript Implementation Checklist

> Updated: 2026-06-28
> Status: ~75% complete (API client 100%, declarative API 80%, advanced features 50%)

## ✅ API Client (Complete)

### Auth
- [x] `POST /v1/auth/register` → `BoxtyClient.signup()`
- [x] `POST /v1/auth/login` → `BoxtyClient.login()`
- [x] `GET /v1/auth/me` → `BoxtyClient.whoami()`
- [x] `BoxtyClient.fromEnv()` factory method
- [x] `BoxtyClient.fromCredentials()` factory method
- [x] Token storage in client

### Accounts & Users
- [x] `GET /v1/accounts/{user_id}` → `BoxtyClient.getAccount()`
- [x] `GET /v1/users/{user_id}` → `BoxtyClient.getUser()`

### Workspaces
- [x] `GET /v1/workspaces` → `BoxtyClient.listWorkspaces()`
- [x] `POST /v1/workspaces` → `BoxtyClient.createWorkspace()`
- [x] `GET /v1/workspaces/{id}` → `BoxtyClient.getWorkspace()`
- [x] `PATCH /v1/workspaces/{id}` → `BoxtyClient.updateWorkspace()`
- [x] `DELETE /v1/workspaces/{id}` → `BoxtyClient.deleteWorkspace()`
- [x] `Workspace` class with `members()`, `billingReport()`, `proxyTokens()`
- [x] `ProxyTokenManager` class

### Environments
- [x] `GET /v1/workspaces/{id}/environments` → `BoxtyClient.listEnvironments()`
- [x] `POST /v1/environments` → `BoxtyClient.createEnvironment()`
- [x] `GET /v1/environments/{id}` → `BoxtyClient.getEnvironment()`
- [x] `PATCH /v1/environments/{id}` → `BoxtyClient.updateEnvironment()`
- [x] `DELETE /v1/environments/{id}` → `BoxtyClient.deleteEnvironment()`
- [x] `Environment` class with `fromName()`, `objects()`, `members()`, `billingReport()`
- [x] `ObjectManager` class

### API Keys
- [x] `GET /v1/api-keys` → `BoxtyClient.listApiKeys()`
- [x] `POST /v1/api-keys` → `BoxtyClient.createApiKey()`
- [x] `GET /v1/api-keys/{id}` → `BoxtyClient.getApiKey()`
- [x] `PATCH /v1/api-keys/{id}` → `BoxtyClient.updateApiKey()`
- [x] `DELETE /v1/api-keys/{id}` → `BoxtyClient.deleteApiKey()`

### Workloads
- [x] `GET /v1/workloads` → `BoxtyClient.listWorkloads()`
- [x] `POST /v1/workloads` → `BoxtyClient.createWorkload()`
- [x] `GET /v1/workloads/{id}` → `BoxtyClient.getWorkload()`
- [x] `PATCH /v1/workloads/{id}` → `BoxtyClient.updateWorkload()`
- [x] `POST /v1/workloads/{id}/status` → `BoxtyClient.updateWorkloadStatus()`
- [x] `DELETE /v1/workloads/{id}` → `BoxtyClient.deleteWorkload()`
- [x] `GET /v1/workloads/{id}/metrics` → `BoxtyClient.getWorkloadMetrics()`
- [x] `GET /v1/workloads/{id}/logs` → `BoxtyClient.getWorkloadLogs()`
- [x] `GET /v1/workloads/{id}/launch-spec` → `BoxtyClient.getWorkloadLaunchSpec()`

### Routes
- [x] `GET /v1/routes` → `BoxtyClient.listRoutes()`
- [x] `POST /v1/routes` → `BoxtyClient.createRoute()`
- [x] `GET /v1/routes/{id}` → `BoxtyClient.getRoute()`
- [x] `DELETE /v1/routes/{id}` → `BoxtyClient.deleteRoute()`

### Schedules
- [x] `GET /v1/schedules` → `BoxtyClient.listSchedules()`
- [x] `POST /v1/schedules` → `BoxtyClient.createSchedule()`
- [x] `GET /v1/schedules/{id}` → `BoxtyClient.getSchedule()`
- [x] `PATCH /v1/schedules/{id}` → `BoxtyClient.updateSchedule()`
- [x] `DELETE /v1/schedules/{id}` → `BoxtyClient.deleteSchedule()`
- [x] `POST /v1/schedules/{id}/trigger` → `BoxtyClient.triggerSchedule()`
- [x] `Period` class
- [x] `Cron` class

### Images
- [x] `GET /v1/images` → `BoxtyClient.listImages()`
- [x] `POST /v1/images/build` → `BoxtyClient.buildImage()`
- [x] `GET /v1/images/{id}` → `BoxtyClient.getImage()`
- [x] `DELETE /v1/images/{id}` → `BoxtyClient.deleteImage()`
- [x] `Image` class with `debianSlim()`, `fromRegistry()`, `fromId()`, `build()`, `pipInstall()`, etc.

### Secrets
- [x] `GET /v1/secrets` → `BoxtyClient.listSecrets()`
- [x] `POST /v1/secrets` → `BoxtyClient.createSecret()`
- [x] `GET /v1/secrets/{id}` → `BoxtyClient.getSecret()`
- [x] `PATCH /v1/secrets/{id}` → `BoxtyClient.updateSecret()`
- [x] `DELETE /v1/secrets/{id}` → `BoxtyClient.deleteSecret()`
- [x] `Secret` class with `fromName()`, `fromDict()`, `fromLocalEnviron()`, `update()`, `info()`

### Volumes
- [x] `GET /v1/volumes` → `BoxtyClient.listVolumes()`
- [x] `POST /v1/volumes` → `BoxtyClient.createVolume()`
- [x] `GET /v1/volumes/{id}` → `BoxtyClient.getVolume()`
- [x] `DELETE /v1/volumes/{id}` → `BoxtyClient.deleteVolume()`
- [x] `Volume` class with `fromName()`, `fromId()`, `objects()`, `reload()`, `rename()`

### Databases
- [x] `GET /v1/databases` → `BoxtyClient.listDatabases()`
- [x] `POST /v1/databases` → `BoxtyClient.createDatabase()`
- [x] `GET /v1/databases/{id}` → `BoxtyClient.getDatabase()`
- [x] `DELETE /v1/databases/{id}` → `BoxtyClient.deleteDatabase()`
- [x] `GET /v1/databases/{id}/items` → `BoxtyClient.listDatabaseItems()`
- [x] `GET /v1/databases/{id}/items?pk=` → `BoxtyClient.getDatabaseItem()`
- [x] `POST /v1/databases/{id}/items` → `BoxtyClient.putDatabaseItem()`
- [x] `DELETE /v1/databases/{id}/items` → `BoxtyClient.deleteDatabaseItem()`
- [x] `POST /v1/databases/{id}/query` → `BoxtyClient.queryDatabase()`

### Billing
- [x] `GET /v1/billing/balance` → `BoxtyClient.getBalance()`
- [x] `GET /v1/billing/usage` → `BoxtyClient.getUsage()`
- [x] `POST /v1/billing/credits` → `BoxtyClient.addCredits()`
- [x] `POST /v1/billing/checkout` → `BoxtyClient.createCheckout()`
- [x] `GET /v1/billing/history` → `BoxtyClient.getBillingHistory()`
- [x] `GET /v1/billing/invoices` → `BoxtyClient.getInvoices()`

### Usage
- [x] `GET /v1/usage` → `BoxtyClient.listUsage()`
- [x] `POST /v1/usage/meter` → `BoxtyClient.meterUsage()`

### Invites
- [x] `GET /v1/invites` → `BoxtyClient.listInvites()`
- [x] `POST /v1/invites` → `BoxtyClient.createInvite()`
- [x] `POST /v1/invites/accept` → `BoxtyClient.acceptInvite()`
- [x] `GET /v1/invites/{id}` → `BoxtyClient.getInvite()`
- [x] `DELETE /v1/invites/{id}` → `BoxtyClient.deleteInvite()`

### Providers
- [x] `GET /v1/providers` → `BoxtyClient.listProviders()`
- [x] `GET /v1/providers/{id}` → `BoxtyClient.getProvider()`
- [x] `POST /v1/providers/register` → `BoxtyClient.registerProvider()`
- [x] `DELETE /v1/providers/{id}` → `BoxtyClient.deleteProvider()`
- [x] `POST /v1/providers/{id}/heartbeat` → `BoxtyClient.providerHeartbeat()`
- [x] `POST /v1/providers/{id}/assignments/next` → `BoxtyClient.claimNextAssignment()`

### Sandbox Sessions
- [x] `POST /v1/sandbox-sessions` → `BoxtyClient.createSandboxSession()`
- [x] `GET /v1/sandbox-sessions/verify` → `BoxtyClient.verifySandboxSession()`
- [x] `Sandbox` class with `create()`, `wait()`, `terminate()`, `exec()`, `tunnels()`, etc.
- [x] `FileSystemManager` class

### RunPod
- [x] `POST /v1/runpod/dispatch` → `BoxtyClient.dispatchRunPod()`

### Dashboard
- [x] `GET /v1/dashboard/{ws}/{env}` → `BoxtyClient.dashboard()`
- [x] `GET /v1/dashboard/{ws}/{env}/summary` → `BoxtyClient.dashboardSummary()`

### Pricing
- [x] `GET /v1/pricing` → `BoxtyClient.getPricing()`

## ✅ Declarative API (App)

- [x] `BoxtyApp` class
- [x] `@app.function()` decorator
- [x] `@app.webEndpoint()` decorator
- [x] `App.toManifest()`
- [x] `App.toManifestJson()`
- [x] `App.run()`

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

## ⚠️ Partial / Placeholder

- [ ] `BoxtyClient.App.deploy()` - requires CLI integration
- [ ] `Function.remote()` - requires runtime context
- [ ] `Function.spawn()` - requires runtime context
- [ ] `Function.map()` - requires runtime context
- [ ] `Sandbox.fromName()` - not yet implemented in backend
- [ ] `Sandbox.exec()` - not yet implemented in backend
- [ ] `Volume.listdir()` - not yet implemented in backend
- [ ] `Volume.readFile()` - not yet implemented in backend
- [ ] `Workspace.billingReport()` - not yet implemented in backend
- [ ] `Environment.billingReport()` - not yet implemented in backend
- [ ] `ProxyTokenManager` methods - not yet implemented in backend
- [ ] `Image.pipInstall()` - builder pattern, needs backend integration
- [ ] Auto-refresh token
- [ ] Progress bars for long operations
- [ ] `BoxtyClient.config` / `BoxtyClient.context`
- [ ] `BoxtyClient.deploy()` / `BoxtyClient.run()` / `BoxtyClient.serve()`

## ❌ Not Implemented (Backend Missing)

- [ ] Billing workspace/environment reports
- [ ] RBAC for environment members
- [ ] Proxy tokens API
- [ ] Sandbox filesystem operations (copyFromLocal, copyToLocal)
- [ ] Volume commit/snapshot operations
- [ ] Function autoscaler
- [ ] Function stats
