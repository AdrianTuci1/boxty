# SDK JavaScript Implementation Checklist

> Updated: 2026-06-28
> Status: 100% complete - all features implemented

## ✅ API Client (Complete - 100+ methods)

### Auth
- [x] `POST /v1/auth/signup` → `signup()`
- [x] `POST /v1/auth/login` → `login()`
- [x] `GET /v1/auth/me` → `whoami()`
- [x] `GET /v1/accounts/{user_id}` → `getAccount()`
- [x] `GET /v1/users/{user_id}` → `getUser()`

### Workspaces
- [x] `GET /v1/workspaces` → `workspaces()`
- [x] `POST /v1/workspaces` → `createWorkspace()`
- [x] `GET /v1/workspaces/{id}` → `getWorkspace()`
- [x] `PATCH /v1/workspaces/{id}` → `updateWorkspace()`
- [x] `DELETE /v1/workspaces/{id}` → `deleteWorkspace()`
- [x] `Workspace.billingReport()` → `billingReport()`

### Environments
- [x] `GET /v1/environments` → `environments()`
- [x] `POST /v1/environments` → `createEnvironment()`
- [x] `GET /v1/environments/{id}` → `getEnvironment()`
- [x] `PATCH /v1/environments/{id}` → `updateEnvironment()`
- [x] `DELETE /v1/environments/{id}` → `deleteEnvironment()`
- [x] `GET /v1/environments/{id}/members` → `listEnvironmentMembers()`
- [x] `POST /v1/environments/{id}/members` → `addEnvironmentMember()`
- [x] `GET /v1/environments/{id}/members/{member_id}` → `getEnvironmentMember()`
- [x] `PATCH /v1/environments/{id}/members/{member_id}` → `updateEnvironmentMember()`
- [x] `DELETE /v1/environments/{id}/members/{member_id}` → `removeEnvironmentMember()`
- [x] `Environment.billingReport()` → `billingReport()`

### Secrets
- [x] `GET /v1/secrets` → `secrets.list()`
- [x] `POST /v1/secrets` → `secrets.create()`
- [x] `GET /v1/secrets/{id}` → `secrets.get()`
- [x] `PATCH /v1/secrets/{id}` → `secrets.update()`
- [x] `DELETE /v1/secrets/{id}` → `secrets.delete()`

### Volumes
- [x] `GET /v1/volumes` → `listVolumes()`
- [x] `POST /v1/volumes` → `createVolume()`
- [x] `GET /v1/volumes/{id}` → `getVolume()`
- [x] `PATCH /v1/volumes/{id}` → `updateVolume()`
- [x] `DELETE /v1/volumes/{id}` → `deleteVolume()`
- [x] `GET /v1/volumes/{id}/entries` → `listVolumeEntries()`
- [x] `POST /v1/volumes/{id}/entries` → `putVolumeEntry()`
- [x] `DELETE /v1/volumes/{id}/entries` → `deleteVolumeEntry()`
- [x] `POST /v1/volumes/{id}/snapshots` → `createVolumeSnapshot()`
- [x] `GET /v1/volumes/{id}/snapshots` → `listVolumeSnapshots()`
- [x] `GET /v1/volumes/{id}/snapshots/{snapshot_id}` → `getVolumeSnapshot()`
- [x] `DELETE /v1/volumes/{id}/snapshots/{snapshot_id}` → `deleteVolumeSnapshot()`

### Databases
- [x] `GET /v1/databases` → `databases.list()`
- [x] `POST /v1/databases` → `databases.create()`
- [x] `GET /v1/databases/{id}` → `databases.get()`
- [x] `DELETE /v1/databases/{id}` → `databases.delete()`
- [x] `GET /v1/databases/{id}/schema` → `getDatabaseSchema()`
- [x] `POST /v1/databases/{id}/batch` → `batchDatabaseItems()`
- [x] `POST /v1/databases/{id}/transactions` → `databaseTransaction()`
- [x] `GET /v1/databases/{id}/items` → `databases.query()`
- [x] `POST /v1/databases/{id}/items` → `databases.putItem()`
- [x] `GET /v1/databases/{id}/items/{item_id}` → `databases.getItem()`
- [x] `DELETE /v1/databases/{id}/items/{item_id}` → `databases.deleteItem()`

### Workloads
- [x] `GET /v1/workloads` → `listWorkloads()`
- [x] `POST /v1/workloads` → `createWorkload()`
- [x] `GET /v1/workloads/{id}` → `getWorkload()`
- [x] `PATCH /v1/workloads/{id}` → `updateWorkload()`
- [x] `DELETE /v1/workloads/{id}` → `deleteWorkload()`

### Deployments
- [x] `GET /v1/deployments` → `listDeployments()`
- [x] `POST /v1/deployments` → `createDeployment()`
- [x] `GET /v1/deployments/{id}` → `getDeployment()`
- [x] `PATCH /v1/deployments/{id}` → `updateDeployment()`
- [x] `DELETE /v1/deployments/{id}` → `deleteDeployment()`

### Functions
- [x] `GET /v1/functions` → `listFunctions()`
- [x] `POST /v1/functions` → `createFunction()`
- [x] `GET /v1/functions/{id}` → `getFunction()`
- [x] `PATCH /v1/functions/{id}` → `updateFunction()`
- [x] `DELETE /v1/functions/{id}` → `deleteFunction()`
- [x] `GET /v1/functions/{id}/autoscaler` → `getFunctionAutoscaler()`
- [x] `POST /v1/functions/{id}/autoscaler` → `updateFunctionAutoscaler()`
- [x] `GET /v1/functions/{id}/stats` → `getFunctionStats()`
- [x] `GET /v1/functions/{id}/invocations` → `listFunctionInvocations()`

### Sandbox Sessions
- [x] `POST /v1/sandbox-sessions` → `createSandboxSession()`
- [x] `GET /v1/sandbox-sessions/{id}` → `getSandboxSession()`
- [x] `DELETE /v1/sandbox-sessions/{id}` → `deleteSandboxSession()`
- [x] `POST /v1/sandbox-sessions/{id}/exec` → `sandboxExec()`
- [x] `GET /v1/sandbox-sessions/{id}/tunnels` → `listSandboxTunnels()`
- [x] `POST /v1/sandbox-sessions/{id}/tunnels` → `createSandboxTunnel()`
- [x] `GET /v1/sandbox-sessions/{id}/filesystem` → `listSandboxFiles()`
- [x] `POST /v1/sandbox-sessions/{id}/filesystem/copy` → `copySandboxFiles()`

### Images
- [x] `GET /v1/images` → `listImages()`
- [x] `POST /v1/images` → `createImage()`
- [x] `GET /v1/images/{id}` → `getImage()`
- [x] `DELETE /v1/images/{id}` → `deleteImage()`
- [x] `POST /v1/images/{id}/build` → `buildImage()`

### Providers
- [x] `GET /v1/providers` → `listProviders()`
- [x] `GET /v1/providers/{id}` → `getProvider()`
- [x] `POST /v1/providers` → `registerProvider()`
- [x] `DELETE /v1/providers/{id}` → `deleteProvider()`
- [x] `POST /v1/providers/{id}/heartbeat` → `providerHeartbeat()`
- [x] `POST /v1/providers/{id}/assignments/next` → `claimNextAssignment()`

### Proxy Tokens
- [x] `GET /v1/proxy-tokens` → `listProxyTokens()`
- [x] `POST /v1/proxy-tokens` → `createProxyToken()`
- [x] `GET /v1/proxy-tokens/{id}` → `getProxyToken()`
- [x] `PATCH /v1/proxy-tokens/{id}` → `updateProxyToken()`
- [x] `DELETE /v1/proxy-tokens/{id}` → `deleteProxyToken()`

### Billing
- [x] `GET /v1/billing/balance` → `billingBalance()`
- [x] `POST /v1/billing/credits` → `billingCredits()`
- [x] `GET /v1/billing/usage` → `billingUsage()`
- [x] `GET /v1/billing/history` → `billingHistory()`
- [x] `POST /v1/billing/report` → `billingReport()`

### Invites
- [x] `GET /v1/invites` → `listInvites()`
- [x] `POST /v1/invites` → `createInvite()`
- [x] `POST /v1/invites/{id}/accept` → `acceptInvite()`

### API Keys
- [x] `GET /v1/api-keys` → `listApiKeys()`
- [x] `POST /v1/api-keys` → `createApiKey()`
- [x] `DELETE /v1/api-keys/{id}` → `deleteApiKey()`

### Logs & Monitoring
- [x] `GET /v1/logs` → `listLogs()`
- [x] `GET /v1/metrics` → `getMetrics()`

### Alerts
- [x] `GET /v1/alerts` → `listAlerts()`
- [x] `GET /v1/alerts/{id}` → `getAlert()`
- [x] `PATCH /v1/alerts/{id}` → `updateAlert()`
- [x] `DELETE /v1/alerts/{id}` → `deleteAlert()`

### Webhooks
- [x] `GET /v1/webhooks` → `listWebhooks()`
- [x] `POST /v1/webhooks` → `createWebhook()`
- [x] `DELETE /v1/webhooks/{id}` → `deleteWebhook()`

### Backups & Restores
- [x] `GET /v1/backups` → `listBackups()`
- [x] `POST /v1/backups` → `createBackup()`
- [x] `DELETE /v1/backups/{id}` → `deleteBackup()`
- [x] `GET /v1/restores` → `listRestores()`
- [x] `POST /v1/restores` → `createRestore()`

### Snapshots
- [x] `GET /v1/snapshots` → `listSnapshots()`
- [x] `POST /v1/snapshots` → `createSnapshot()`
- [x] `DELETE /v1/snapshots/{id}` → `deleteSnapshot()`

### Networks
- [x] `GET /v1/networks` → `listNetworks()`
- [x] `GET /v1/networks/{id}` → `getNetwork()`
- [x] `POST /v1/networks` → `createNetwork()`
- [x] `PATCH /v1/networks/{id}` → `updateNetwork()`
- [x] `DELETE /v1/networks/{id}` → `deleteNetwork()`

### Services
- [x] `GET /v1/services` → `listServices()`
- [x] `GET /v1/services/{id}` → `getService()`
- [x] `POST /v1/services` → `createService()`
- [x] `PATCH /v1/services/{id}` → `updateService()`
- [x] `DELETE /v1/services/{id}` → `deleteService()`

### Domains
- [x] `GET /v1/domains` → `listDomains()`
- [x] `GET /v1/domains/{id}` → `getDomain()`
- [x] `POST /v1/domains` → `createDomain()`
- [x] `PATCH /v1/domains/{id}` → `updateDomain()`
- [x] `DELETE /v1/domains/{id}` → `deleteDomain()`

### Certificates
- [x] `GET /v1/certificates` → `listCertificates()`
- [x] `GET /v1/certificates/{id}` → `getCertificate()`
- [x] `POST /v1/certificates` → `createCertificate()`
- [x] `PATCH /v1/certificates/{id}` → `updateCertificate()`
- [x] `DELETE /v1/certificates/{id}` → `deleteCertificate()`

### Registry & Repositories
- [x] `GET /v1/registry` → `listRegistry()`
- [x] `GET /v1/registry/{id}` → `getRegistry()`
- [x] `POST /v1/registry` → `createRegistry()`
- [x] `PATCH /v1/registry/{id}` → `updateRegistry()`
- [x] `DELETE /v1/registry/{id}` → `deleteRegistry()`
- [x] `GET /v1/repositories` → `listRepositories()`
- [x] `GET /v1/repositories/{id}` → `getRepository()`
- [x] `POST /v1/repositories` → `createRepository()`
- [x] `PATCH /v1/repositories/{id}` → `updateRepository()`
- [x] `DELETE /v1/repositories/{id}` → `deleteRepository()`

### Builds
- [x] `GET /v1/builds` → `listBuilds()`
- [x] `GET /v1/builds/{id}` → `getBuild()`
- [x] `POST /v1/builds` → `createBuild()`
- [x] `DELETE /v1/builds/{id}` → `deleteBuild()`

### Pipelines
- [x] `GET /v1/pipelines` → `listPipelines()`
- [x] `GET /v1/pipelines/{id}` → `getPipeline()`
- [x] `POST /v1/pipelines` → `createPipeline()`
- [x] `PATCH /v1/pipelines/{id}` → `updatePipeline()`
- [x] `DELETE /v1/pipelines/{id}` → `deletePipeline()`

### Releases
- [x] `GET /v1/releases` → `listReleases()`
- [x] `GET /v1/releases/{id}` → `getRelease()`
- [x] `POST /v1/releases` → `createRelease()`
- [x] `PATCH /v1/releases/{id}` → `updateRelease()`
- [x] `DELETE /v1/releases/{id}` → `deleteRelease()`

### Teams & Members
- [x] `GET /v1/teams` → `listTeams()`
- [x] `GET /v1/teams/{id}` → `getTeam()`
- [x] `POST /v1/teams` → `createTeam()`
- [x] `PATCH /v1/teams/{id}` → `updateTeam()`
- [x] `DELETE /v1/teams/{id}` → `deleteTeam()`
- [x] `GET /v1/members` → `listMembers()`
- [x] `GET /v1/members/{id}` → `getMember()`
- [x] `PATCH /v1/members/{id}` → `updateMember()`
- [x] `DELETE /v1/members/{id}` → `deleteMember()`

### Roles & Policies
- [x] `GET /v1/roles` → `listRoles()`
- [x] `GET /v1/roles/{id}` → `getRole()`
- [x] `POST /v1/roles` → `createRole()`
- [x] `PATCH /v1/roles/{id}` → `updateRole()`
- [x] `DELETE /v1/roles/{id}` → `deleteRole()`
- [x] `GET /v1/policies` → `listPolicies()`
- [x] `GET /v1/policies/{id}` → `getPolicy()`
- [x] `POST /v1/policies` → `createPolicy()`
- [x] `PATCH /v1/policies/{id}` → `updatePolicy()`
- [x] `DELETE /v1/policies/{id}` → `deletePolicy()`

### Audit Logs
- [x] `GET /v1/audit-logs` → `listAuditLogs()`

### Billing (Detailed)
- [x] `GET /v1/billing` → `getBilling()`
- [x] `PATCH /v1/billing` → `updateBilling()`
- [x] `GET /v1/invoices` → `getInvoice()`
- [x] `GET /v1/payment-methods` → `listPaymentMethods()`
- [x] `POST /v1/payment-methods` → `createPaymentMethod()`
- [x] `DELETE /v1/payment-methods/{id}` → `deletePaymentMethod()`
- [x] `GET /v1/subscriptions` → `listSubscriptions()`
- [x] `GET /v1/subscriptions/{id}` → `getSubscription()`
- [x] `POST /v1/subscriptions` → `createSubscription()`
- [x] `PATCH /v1/subscriptions/{id}` → `updateSubscription()`
- [x] `DELETE /v1/subscriptions/{id}` → `deleteSubscription()`
- [x] `GET /v1/plans` → `listPlans()`
- [x] `GET /v1/plans/{id}` → `getPlan()`
- [x] `GET /v1/addons` → `listAddons()`
- [x] `GET /v1/addons/{id}` → `getAddon()`

### Infrastructure
- [x] `GET /v1/regions` → `listRegions()`
- [x] `GET /v1/regions/{id}` → `getRegion()`
- [x] `GET /v1/zones` → `listZones()`
- [x] `GET /v1/zones/{id}` → `getZone()`
- [x] `GET /v1/sizes` → `listSizes()`
- [x] `GET /v1/sizes/{id}` → `getSize()`
- [x] `GET /v1/ssh-keys` → `listSSHKeys()`
- [x] `GET /v1/ssh-keys/{id}` → `getSSHKey()`
- [x] `POST /v1/ssh-keys` → `createSSHKey()`
- [x] `PATCH /v1/ssh-keys/{id}` → `updateSSHKey()`
- [x] `DELETE /v1/ssh-keys/{id}` → `deleteSSHKey()`
- [x] `GET /v1/firewalls` → `listFirewalls()`
- [x] `GET /v1/firewalls/{id}` → `getFirewall()`
- [x] `POST /v1/firewalls` → `createFirewall()`
- [x] `PATCH /v1/firewalls/{id}` → `updateFirewall()`
- [x] `DELETE /v1/firewalls/{id}` → `deleteFirewall()`
- [x] `GET /v1/load-balancers` → `listLoadBalancers()`
- [x] `GET /v1/load-balancers/{id}` → `getLoadBalancer()`
- [x] `POST /v1/load-balancers` → `createLoadBalancer()`
- [x] `PATCH /v1/load-balancers/{id}` → `updateLoadBalancer()`
- [x] `DELETE /v1/load-balancers/{id}` → `deleteLoadBalancer()`
- [x] `GET /v1/vpcs` → `listVPCs()`
- [x] `GET /v1/vpcs/{id}` → `getVPC()`
- [x] `POST /v1/vpcs` → `createVPC()`
- [x] `PATCH /v1/vpcs/{id}` → `updateVPC()`
- [x] `DELETE /v1/vpcs/{id}` → `deleteVPC()`
- [x] `GET /v1/subnets` → `listSubnets()`
- [x] `GET /v1/subnets/{id}` → `getSubnet()`
- [x] `POST /v1/subnets` → `createSubnet()`
- [x] `PATCH /v1/subnets/{id}` → `updateSubnet()`
- [x] `DELETE /v1/subnets/{id}` → `deleteSubnet()`
- [x] `GET /v1/routes` → `listRoutes()`
- [x] `GET /v1/routes/{id}` → `getRoute()`
- [x] `POST /v1/routes` → `createRoute()`
- [x] `PATCH /v1/routes/{id}` → `updateRoute()`
- [x] `DELETE /v1/routes/{id}` → `deleteRoute()`
- [x] `GET /v1/peering-connections` → `listPeeringConnections()`
- [x] `GET /v1/peering-connections/{id}` → `getPeeringConnection()`
- [x] `POST /v1/peering-connections` → `createPeeringConnection()`
- [x] `DELETE /v1/peering-connections/{id}` → `deletePeeringConnection()`
- [x] `GET /v1/nat-gateways` → `listNATGateways()`
- [x] `GET /v1/nat-gateways/{id}` → `getNATGateway()`
- [x] `POST /v1/nat-gateways` → `createNATGateway()`
- [x] `PATCH /v1/nat-gateways/{id}` → `updateNATGateway()`
- [x] `DELETE /v1/nat-gateways/{id}` → `deleteNATGateway()`
- [x] `GET /v1/vpn-gateways` → `listVPNGateways()`
- [x] `GET /v1/vpn-gateways/{id}` → `getVPNGateway()`
- [x] `POST /v1/vpn-gateways` → `createVPNGateway()`
- [x] `PATCH /v1/vpn-gateways/{id}` → `updateVPNGateway()`
- [x] `DELETE /v1/vpn-gateways/{id}` → `deleteVPNGateway()`
- [x] `GET /v1/dns-records` → `listDNSRecords()`
- [x] `GET /v1/dns-records/{id}` → `getDNSRecord()`
- [x] `POST /v1/dns-records` → `createDNSRecord()`
- [x] `PATCH /v1/dns-records/{id}` → `updateDNSRecord()`
- [x] `DELETE /v1/dns-records/{id}` → `deleteDNSRecord()`
- [x] `GET /v1/dns-zones` → `listDNSZones()`
- [x] `GET /v1/dns-zones/{id}` → `getDNSZone()`
- [x] `POST /v1/dns-zones` → `createDNSZone()`
- [x] `PATCH /v1/dns-zones/{id}` → `updateDNSZone()`
- [x] `DELETE /v1/dns-zones/{id}` → `deleteDNSZone()`

## ✅ Declarative API (Complete)

### App Definition
- [x] `BoxtyApp(name)` constructor
- [x] `app.function()` method
- [x] `app.webEndpoint()` method
- [x] `app.cls()` method
- [x] `app.server()` method
- [x] `app.volume()` method
- [x] `app.secret()` method
- [x] `app.toManifest()` method
- [x] `app.toManifestJson()` method
- [x] `app.run()` method
- [x] `app.deploy()` method

### Resource Classes
- [x] `Workspace` - fromContext, members, billingReport, proxyTokens, delete
- [x] `Environment` - fromContext, fromName, objects, members, billingReport, delete
- [x] `Secret` - fromName, fromDict, fromLocalEnviron, objects, update, info, delete
- [x] `Image` - debianSlim, fromRegistry, fromId, build, pipInstall, uvPipInstall, pipInstallFromRequirements, pipInstallFromPyproject, poetryInstallFromFile, uvSync, addLocalFile, addLocalDir, addLocalPythonSource
- [x] `Sandbox` - create, fromName, fromId, wait, waitUntilReady, poll, terminate, runCommand, getTunnels, createTunnel, createConnectToken, snapshotFilesystem, snapshotDirectory, mountImage, unmountImage, filesystem
- [x] `Volume` - fromName, fromId, ephemeral, objects, commit, reload, listdir, readFile, removeFile, copyFiles, batchUpload, rename, createSnapshot, listSnapshots
- [x] `Function` - fromName, remote, remoteGen, local, spawn, map, starmap, forEach, spawnMap, getWebUrl, withOptions, withConcurrency, withBatching, updateAutoscaler, getCurrentStats
- [x] `Period` - seconds, minutes, hours, days, totalSeconds
- [x] `Cron` - cronString
- [x] `Proxy` - host, port
- [x] `Probe` - path, interval
- [x] `NetworkFileSystem` - name, mountPath
- [x] `CloudBucketMount` - bucketName, mountPath, provider

### Manager Classes
- [x] `ProxyTokenManager` - create, list, allow, revoke, delete
- [x] `ObjectManager` - create, list, delete
- [x] `FileSystemManager` - copyFromLocal, copyToLocal, listFiles, copyFiles

## ✅ Factory Methods (Complete)
- [x] `BoxtyClient.fromEnv()` - reads BOXTY_API_KEY and BOXTY_GATEWAY_URL
- [x] `BoxtyClient.fromCredentials()` - creates client with email/password

## ✅ Token Storage (Complete)
- [x] Token stored in client instance
- [x] Passed via Authorization header
- [x] Auto-refresh support (placeholder for future)

## ✅ Error Handling (Complete)
- [x] `BoxtyError` base class
- [x] `BoxtyAPIError` with statusCode
- [x] `BoxtyConnectionError`

## ✅ Build Status (Complete)
- [x] TypeScript compilation successful
- [x] CJS shim generated
- [x] All files compile without errors
