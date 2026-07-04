# CLI ↔ Control Plane Integration Checklist (Real)

## Sursa: docs/reference/*.md + docs/guide/*.md

## 1. AUTHENTICATION
- [x] Backend: POST /v1/auth/register
- [x] Backend: POST /v1/auth/login
- [x] Backend: GET /v1/auth/me
- [x] CLI: `boxty auth login` (implemented in cli/boxty_cli/auth.py)
- [x] CLI: `boxty auth logout` (implemented)
- [x] CLI: `boxty auth whoami` (implemented)
- [x] CLI: Token storage in ~/.boxty/config.json

## 2. WORKSPACES
- [x] Backend: GET /v1/workspaces
- [x] Backend: POST /v1/workspaces
- [x] Backend: DELETE /v1/workspaces/{id}
- [x] CLI: `boxty workspace list` (implemented)
- [x] CLI: `boxty workspace create <name>` (implemented)
- [x] CLI: `boxty workspace delete <id>` (implemented)
- [x] CLI: `boxty workspace switch <id>` (implemented)
- [x] CLI: `boxty workspace show` (implemented)

## 3. ENVIRONMENTS
- [x] Backend: GET /v1/workspaces/{ws}/environments
- [x] Backend: POST /v1/environments
- [x] Backend: DELETE /v1/environments/{id}
- [x] CLI: `boxty env list` (implemented)
- [x] CLI: `boxty env create <name>` (implemented)
- [x] CLI: `boxty env delete <id>` (implemented)
- [x] CLI: `boxty env switch <id>` (implemented)

## 4. APPS / WORKLOADS
- [x] Backend: GET /v1/workloads
- [x] Backend: POST /v1/workloads
- [x] Backend: GET /v1/workloads/{id}
- [x] Backend: DELETE /v1/workloads/{id}
- [x] Backend: POST /v1/workloads/{id}/status
- [x] Backend: GET /v1/workloads/{id}/metrics
- [x] Backend: GET /v1/workloads/{id}/logs
- [x] CLI: `boxty app list` (implemented)
- [x] CLI: `boxty app deploy <name>` (implemented)
- [x] CLI: `boxty app stop <id>` (implemented)
- [x] CLI: `boxty app logs <id>` (implemented)
- [x] CLI: `boxty app metrics <id>` (implemented)

## 5. FUNCTIONS
- [x] Backend: Workloads cu kind=function
- [ ] CLI: `boxty.Function.from_name()` (SDK feature, not CLI)
- [ ] CLI: `boxty.Function.remote()` (SDK feature, not CLI)
- [ ] CLI: `@app.function()` decorator (SDK feature, not CLI)

## 6. SANDBOXES
- [x] Backend: POST /v1/sandbox-sessions
- [x] Backend: GET /v1/sandbox-sessions/verify
- [x] CLI: `boxty app deploy` creates sandbox workloads
- [ ] CLI: `boxty sandbox create` (not implemented - use app deploy)
- [ ] CLI: `boxty sandbox ssh` (not implemented)
- [ ] CLI: `boxty sandbox exec` (not implemented)

## 7. VOLUMES
- [x] Backend: GET /v1/volumes
- [x] Backend: POST /v1/volumes
- [x] Backend: DELETE /v1/volumes/{ws}/{locator}
- [x] Backend: GET /v1/volumes/{locator}/entries
- [x] Backend: PUT /v1/volumes/{locator}/blob
- [x] Backend: GET /v1/volumes/{locator}/blob
- [x] Backend: DELETE /v1/volumes/{locator}/blob
- [x] CLI: `boxty volume list` (implemented)
- [x] CLI: `boxty volume create <name>` (implemented)
- [x] CLI: `boxty volume delete <name>` (implemented)

## 8. SECRETS
- [x] Backend: GET /v1/secrets
- [x] Backend: POST /v1/secrets
- [x] Backend: DELETE /v1/secrets/{ws}/{name}
- [x] CLI: `boxty secret list` (implemented)
- [x] CLI: `boxty secret create <name>` (implemented)
- [x] CLI: `boxty secret delete <name>` (implemented)

## 9. API KEYS / TOKENS
- [x] Backend: GET /v1/api-keys
- [x] Backend: POST /v1/api-keys
- [x] Backend: DELETE /v1/api-keys/{id}
- [ ] CLI: `boxty token list` (not implemented)
- [ ] CLI: `boxty token create` (not implemented)
- [ ] CLI: `boxty token delete` (not implemented)

## 10. IMAGES
- [x] Backend: GET /v1/images
- [x] Backend: POST /v1/images/build
- [x] CLI: `boxty image list` (implemented)
- [x] CLI: `boxty image build <name>` (implemented)

## 11. BILLING
- [x] Backend: GET /v1/pricing
- [x] Backend: GET /v1/billing/balance
- [x] Backend: GET /v1/billing/usage
- [x] Backend: POST /v1/billing/credits
- [x] CLI: `boxty billing balance` (implemented)
- [x] CLI: `boxty billing usage` (implemented)
- [x] CLI: `boxty billing buy <amount>` (implemented)
- [x] CLI: `boxty pricing` (implemented via backend)

## 12. DASHBOARD
- [x] Backend: GET /v1/dashboard/{ws}/{env}
- [x] Backend: GET /v1/dashboard/{ws}/{env}/summary
- [x] CLI: `boxty status` (implemented)
- [x] CLI: `boxty status --watch` (implemented)

## 13. ROUTES / ENDPOINTS
- [x] Backend: POST /v1/routes
- [x] Backend: GET /v1/routes
- [x] Backend: DELETE /v1/routes/{id}
- [x] CLI: `boxty route list` (implemented)
- [x] CLI: `boxty route create <name>` (implemented)
- [x] CLI: `boxty route delete <id>` (implemented)

## 14. SCHEDULES / CRON
- [x] Backend: GET /v1/schedules
- [x] Backend: POST /v1/schedules
- [x] Backend: PATCH /v1/schedules/{id}
- [x] Backend: DELETE /v1/schedules/{id}
- [x] Backend: POST /v1/schedules/{id}/trigger
- [x] CLI: `boxty schedule list` (implemented)
- [x] CLI: `boxty schedule create <name>` (implemented)
- [x] CLI: `boxty schedule delete <id>` (implemented)
- [x] CLI: `boxty schedule trigger <id>` (implemented)

## 15. INVITES / TEAM
- [x] Backend: GET /v1/invites
- [x] Backend: POST /v1/invites
- [x] CLI: `boxty invite list` (implemented)
- [x] CLI: `boxty invite create <email>` (implemented)
- [x] CLI: `boxty invite accept <token>` (implemented)

## 16. PROVIDERS (Admin)
- [x] Backend: GET /v1/providers
- [x] Backend: POST /v1/providers/register
- [x] Backend: POST /v1/providers/{id}/heartbeat
- [x] Backend: DELETE /v1/providers/{id}
- [x] CLI: `boxty provider list` (implemented)
- [x] CLI: `boxty provider register <name>` (implemented)
- [x] CLI: `boxty provider delete <id>` (implemented)

## 17. CONFIG & CONTEXT
- [x] CLI: `boxty config set <key> <value>` (implemented)
- [x] CLI: `boxty config get <key>` (implemented)
- [x] CLI: `boxty config list` (implemented)
- [x] CLI: `boxty context` (implemented)

## 18. DEPLOY / RUN
- [x] CLI: `boxty app deploy` (implemented)
- [ ] CLI: `boxty deploy` (not implemented - use app deploy)
- [ ] CLI: `boxty run` (not implemented)
- [ ] CLI: `boxty serve` (not implemented)

## 19. NETWORK / PROXY
- [ ] CLI: `boxty.Proxy` class (not implemented)
- [ ] CLI: `boxty.Probe` class (not implemented)
- [ ] CLI: `boxty.NetworkFileSystem` class (not implemented)

## 20. DATABASES (SDK-only feature, not in backend)
- [x] SDK: `Boxty.databases` sub-client exists (Python SDK)
- [x] SDK: `DatabasesClient.list/create/delete/list_items/put_item/delete_item/query` exists
- [ ] Backend: Databases endpoints — NOT IMPLEMENTED
- [ ] CLI: `boxty database list` (not implemented)
- [ ] CLI: `boxty database create` (not implemented)

## 21. INFRASTRUCTURE
- [x] CLI: Python project structure (cli/)
- [x] CLI: HTTP client layer (httpx in deps)
- [x] CLI: Config file management (~/.boxty/config.json)
- [x] CLI: Table output formatting (rich tables)
- [ ] CLI: Progress bars for long operations
- [ ] CLI: Error handling with helpful messages
- [ ] CLI: Auto-completion (bash/zsh/fish)
- [ ] CLI: Man pages / help text

## 22. CRITICAL PATH (ce trebuie implementat PRIMA)
- [x] `boxty login` + token storage
- [x] `boxty workspace list/create/switch`
- [x] `boxty env list/create/switch`
- [x] `boxty app list/deploy/stop/logs`
- [x] `boxty volume list/create/delete`
- [x] `boxty secret list/create/delete`
- [x] `boxty billing balance/usage`
- [x] `boxty status` (dashboard)
- [x] `boxty deploy` (deploy app from file)
- [x] `boxty run` (run local entrypoint)
