# Control Plane ↔ Web Integration Checklist

## 1. AUTHENTICATION & USER MANAGEMENT
- [x] Backend: POST /v1/auth/register (returns user_id, access_token, workspace, environment)
- [x] Web: Register page calls real backend (folosește /v1/auth/register cu external_user_id)
- [x] Web: Login page calls real backend (folosește /v1/auth/login cu external_user_id)
- [x] Backend: POST /v1/auth/login (există — returnează access_token)
- [x] Web: Token storage & refresh logic (localStorage 'boxty_token')
- [x] Web: Logout clears token properly
- [x] Backend: GET /v1/users/{user_id} (există)
- [ ] Web: Profile page fetches real user data
- [x] Backend: GET /v1/accounts/{user_id} (există)
- [ ] Web: Billing/usage page fetches real account data

## 2. WORKSPACES
- [x] Backend: GET /v1/workspaces (există, cu owner_id filter)
- [x] Backend: POST /v1/workspaces (există)
- [x] Backend: DELETE /v1/workspaces/{workspace_id} (există)
- [x] Web: WorkspacesPage calls real GET /v1/workspaces
- [x] Web: WorkspaceDetailPage calls real GET /v1/workspaces/{id}
- [x] Web: Create workspace calls real POST /v1/workspaces
- [x] Web: Delete workspace calls real DELETE /v1/workspaces/{id}

## 3. ENVIRONMENTS
- [x] Backend: GET /v1/workspaces/{workspace_id}/environments (există)
- [x] Backend: POST /v1/environments (există)
- [x] Backend: DELETE /v1/environments/{environment_id} (există)
- [x] Web: listEnvironments calls real GET /v1/workspaces/{workspace_id}/environments
- [x] Web: createEnvironment calls real POST /v1/environments
- [x] Web: deleteEnvironment calls real DELETE /v1/environments/{id}

## 4. API KEYS
- [x] Backend: GET /v1/api-keys (există, cu workspace_id filter)
- [x] Backend: POST /v1/api-keys (există)
- [ ] Backend: DELETE /v1/api-keys/{api_key_id} (LIPSEȘTE — nu există endpoint de delete)
- [x] Web: APITokensPage calls real GET /v1/api-keys
- [x] Web: Create API key calls real POST /v1/api-keys
- [ ] Web: Delete API key calls real DELETE /v1/api-keys/{id} (blocat — endpoint lipsește)

## 5. SECRETS
- [x] Backend: GET /v1/secrets (există, cu workspace_id filter)
- [x] Backend: POST /v1/secrets (există)
- [x] Backend: DELETE /v1/secrets/{workspace_id}/{secret_name} (există)
- [x] Web: SecretsPage calls real GET /v1/secrets
- [x] Web: CreateSecretPage calls real POST /v1/secrets
- [x] Web: Delete secret calls real DELETE /v1/secrets/{workspace_id}/{name}

## 6. VOLUMES
- [x] Backend: GET /v1/volumes (există, cu workspace_id filter)
- [x] Backend: POST /v1/volumes (există)
- [x] Backend: DELETE /v1/volumes/{workspace_id}/{locator} (există)
- [x] Backend: GET /v1/volumes/{locator}/entries (există)
- [x] Backend: PUT /v1/volumes/{locator}/blob (există)
- [x] Backend: GET /v1/volumes/{locator}/blob (există)
- [x] Backend: DELETE /v1/volumes/{locator}/blob (există)
- [x] Web: StoragePage calls real GET /v1/volumes
- [ ] Web: VolumeDetailPage calls real GET /v1/volumes/{locator}/entries (nu există pagină)
- [x] Web: Create volume calls real POST /v1/volumes
- [x] Web: Delete volume calls real DELETE /v1/volumes/{workspace_id}/{locator}
- [ ] Web: Volume blob operations (read/write/delete) — nu există UI

## 7. WORKLOADS (Apps / Functions / Sandboxes / Endpoints / Builds)
- [x] Backend: GET /v1/workloads (există — list all)
- [x] Backend: POST /v1/workloads (există — create)
- [x] Backend: GET /v1/workloads/{workload_id} (există)
- [x] Backend: POST /v1/workloads/{workload_id}/status (există — update status)
- [x] Backend: GET /v1/workloads/{workload_id}/launch-spec (există — pentru provider)
- [ ] Backend: DELETE /v1/workloads/{workload_id} (LIPSEȘTE)
- [x] Web: DashboardPage fetches real workloads via GET /v1/workloads
- [x] Web: AppDetailPage fetches real workload via GET /v1/workloads/{id}
- [ ] Web: Stop/Delete app calls real DELETE /v1/workloads/{id} (blocat — endpoint lipsește)
- [x] Web: Create workload calls real POST /v1/workloads
- [x] Web: SandboxDetailPage fetches real workload via GET /v1/workloads/{id}

## 8. PROVIDERS (Admin/Ops)
- [x] Backend: GET /v1/providers (există)
- [x] Backend: POST /v1/providers/register (există)
- [x] Backend: POST /v1/providers/{id}/heartbeat (există)
- [x] Backend: DELETE /v1/providers/{id} (există)
- [x] Backend: POST /v1/providers/{id}/assignments/next (există)
- [x] Backend: WebSocket /v1/providers/{id}/tunnel (există)
- [ ] Web: Providers page — NU EXISTĂ în web

## 9. ROUTES / ENDPOINTS
- [x] Backend: POST /v1/routes (există — publish route)
- [ ] Backend: GET /v1/routes (LIPSEȘTE)
- [ ] Backend: DELETE /v1/routes/{route_id} (LIPSEȘTE)
- [ ] Web: Endpoint management page — NU EXISTĂ în web

## 10. SANDBOX SESSIONS
- [x] Backend: POST /v1/sandbox-sessions (există)
- [x] Backend: GET /v1/sandbox-sessions/verify (există)
- [ ] Web: Sandbox SSH session creation — NU EXISTĂ UI

## 11. BILLING & USAGE
- [x] Backend: GET /v1/pricing (există)
- [x] Backend: POST /v1/usage/meter (există — provider calls this)
- [ ] Backend: GET /v1/usage (LIPSEȘTE)
- [ ] Backend: GET /v1/billing/balance (LIPSEȘTE)
- [ ] Backend: GET /v1/billing/usage (LIPSEȘTE)
- [ ] Backend: POST /v1/billing/credits (LIPSEȘTE)
- [x] Web: BillingPage calls real endpoints (mock fallback activ)
- [ ] Web: UsagePage calls real endpoints (nu există pagină dedicată)

## 12. INVITES / TEAM
- [x] Backend: GET /v1/invites (există, cu workspace_id filter)
- [x] Backend: POST /v1/invites (există)
- [ ] Web: Team/Invites page — NU EXISTĂ în web

## 13. RUNPOD INTEGRATION
- [x] Backend: POST /v1/runpod/dispatch (există)
- [ ] Web: RunPod dispatch UI — NU EXISTĂ în web

## 14. ADMIN
- [x] Backend: GET /v1/admin/dynamodb-items (există)
- [ ] Web: Admin panel — NU EXISTĂ în web

## 15. PROXY / ROUTING
- [x] Backend: /r/{endpoint_name} (există)
- [ ] Web: Endpoint testing UI — NU EXISTĂ

## 16. DOCS (Guide + Reference)
- [x] Web: DocsLayout + DocsPage există
- [x] Web: Guide .md files în src/docs/guide/ (92 fișiere)
- [x] Web: Reference .md files în src/docs/reference/ (55 fișiere)
- [x] Web: DocsPage loads .md via import.meta.glob
- [ ] Web: Search în docs — NU EXISTĂ
- [ ] Web: Docs sidebar navigation generată dinamic

## 17. INFRASTRUCTURE / CONFIG
- [x] Web: API_BASE folosește /v1 prefix corect
- [x] Web: client.ts injectează /v1 prefix automat
- [x] Web: Mock decider service — păstrat isMockMode = devMode || demoMode
- [ ] Backend: CORS configurat pentru web origin
- [x] Backend: Health check endpoint /healthz (există)
- [ ] Web: Error handling global (404, 500, network errors)
- [ ] Web: Loading states pentru toate paginile

## 18. MISSING WEB PAGES (need creation)
- [ ] Providers management page
- [ ] Routes/Endpoints management page
- [ ] Team/Invites page
- [ ] Admin/DynamoDB items viewer
- [ ] Workload creation page (generic)
- [ ] Image build page (ImagesPage există dar nu e cablat la backend)
- [ ] Schedule creation/management (SchedulesPage există dar nu e cablat)
- [ ] Sandbox session / SSH terminal UI
- [ ] Endpoint tester / playground

## 19. MISSING BACKEND ENDPOINTS (need creation)
- [ ] DELETE /v1/api-keys/{api_key_id}
- [ ] DELETE /v1/workloads/{workload_id}
- [ ] GET /v1/routes
- [ ] DELETE /v1/routes/{route_id}
- [ ] GET /v1/usage
- [ ] GET /v1/billing/balance
- [ ] GET /v1/billing/usage
- [ ] POST /v1/billing/credits
- [ ] GET /v1/workloads/{workspace_id}/{environment_id} (filter by env)
- [ ] PATCH /v1/workloads/{workload_id}
- [ ] GET /v1/images
- [ ] POST /v1/images/build
- [ ] GET /v1/schedules
- [ ] POST /v1/schedules
- [ ] PATCH /v1/schedules/{id}
- [ ] DELETE /v1/schedules/{id}
- [ ] POST /v1/schedules/{id}/trigger
- [ ] GET /v1/dashboard/{workspace_id}/{environment_id}
- [ ] GET /v1/dashboard/{workspace_id}/{environment_id}/summary
- [ ] GET /v1/workloads/{workload_id}/metrics
- [ ] GET /v1/workloads/{workload_id}/logs
- [ ] GET /v1/workloads/{workload_id}/deployments
- [ ] POST /v1/workloads/{workload_id}/deploy
- [ ] POST /v1/workloads/{workload_id}/snapshot
- [ ] POST /v1/workloads/{workload_id}/exec
- [ ] POST /v1/workloads/{workload_id}/forward

## 20. DATA MODEL ALIGNMENT
- [x] Web App model → Backend WorkloadRecord (workload_id + id alias, kind field)
- [x] Web Sandbox model → Backend WorkloadRecord (kind=sandbox, workload_id + id alias)
- [x] Web Volume model → Backend VolumeRecord (volume_id + id alias)
- [x] Web Secret model → Backend SecretRecord (secret_id, key_names, env_vars)
- [x] Web Workspace model → Backend WorkspaceRecord (workspace_id + id alias)
- [x] Web Environment model → Backend EnvironmentRecord (environment_id + id alias)
- [x] Web API Key model → Backend ApiKeyRecord (api_key_id + id alias)
- [ ] Web Schedule model → Backend — nu există ScheduleRecord
- [ ] Web Image model → Backend — nu există ImageRecord
- [ ] Web Billing/Usage model → Backend — nu există UsageRecord/BillingRecord

## 21. CRITICAL FIXES DONE
- [x] Unify API prefix: toate requesturile web folosesc /v1
- [x] client.ts injectează /v1 automat
- [x] Auth: login endpoint pe backend există (POST /v1/auth/login)
- [x] Auth: JWT validation middleware pe backend (bearer token)
- [x] Web: TypeScript build curat (0 erori)
- [x] Web: npm run build reușit
- [ ] Web: toate paginile trebuie să folosească workspace_id și environment_id reali din URL
- [ ] Web: DashboardPage trebuie să filtreze workloads după workspace+environment
- [ ] Web: toate API call-urile trebuie să trimită workspace_id și environment_id corecte
