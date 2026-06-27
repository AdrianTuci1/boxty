# CLI ↔ Control Plane Integration Checklist (Real)

## Sursa: docs/reference/*.md + docs/guide/*.md

## 1. AUTHENTICATION
- [x] Backend: POST /v1/auth/register
- [x] Backend: POST /v1/auth/login
- [ ] CLI: `boxty login` (documentat in guide, neimplementat)
- [ ] CLI: `boxty logout` (documentat, neimplementat)
- [ ] CLI: `boxty signup` (documentat, neimplementat)
- [ ] CLI: Token storage in ~/.boxty/config
- [ ] CLI: `boxty whoami` (documentat in reference, neimplementat)

## 2. WORKSPACES
- [x] Backend: GET /v1/workspaces
- [x] Backend: POST /v1/workspaces
- [x] Backend: DELETE /v1/workspaces/{id}
- [ ] CLI: `boxty workspace list` (documentat in reference)
- [ ] CLI: `boxty workspace create <name>` (documentat in reference)
- [ ] CLI: `boxty workspace delete <id>` (documentat in reference)
- [ ] CLI: `boxty workspace switch <id>` (documentat in reference)
- [ ] CLI: `boxty workspace show` (documentat in reference)
- [ ] CLI: `boxty.Workspace.from_context()` (documentat in SDK)
- [ ] CLI: `boxty.Workspace.members.list()` (documentat in SDK)
- [ ] CLI: `boxty.Workspace.billing.report()` (documentat in SDK)
- [ ] CLI: `boxty.Workspace.proxy_tokens.create/list/allow/revoke/delete()` (documentat in SDK)

## 3. ENVIRONMENTS
- [x] Backend: GET /v1/workspaces/{ws}/environments
- [x] Backend: POST /v1/environments
- [x] Backend: DELETE /v1/environments/{id}
- [ ] CLI: `boxty env list` (documentat in reference)
- [ ] CLI: `boxty env create <name>` (documentat in reference)
- [ ] CLI: `boxty env delete <id>` (documentat in reference)
- [ ] CLI: `boxty env switch <id>` (documentat in reference)
- [ ] CLI: `boxty env show` (documentat in reference)
- [ ] CLI: `boxty.Environment.from_context()` (documentat in SDK)
- [ ] CLI: `boxty.Environment.from_name()` (documentat in SDK)
- [ ] CLI: `boxty.Environment.members.list/update/remove()` (documentat in SDK - RBAC)
- [ ] CLI: `boxty.Environment.billing.report()` (documentat in SDK)

## 4. APPS / WORKLOADS
- [x] Backend: GET /v1/workloads
- [x] Backend: POST /v1/workloads
- [x] Backend: GET /v1/workloads/{id}
- [x] Backend: DELETE /v1/workloads/{id}
- [x] Backend: POST /v1/workloads/{id}/status
- [x] Backend: GET /v1/workloads/{id}/metrics
- [x] Backend: GET /v1/workloads/{id}/logs
- [ ] CLI: `boxty app list` (documentat in reference)
- [ ] CLI: `boxty app deploy <name>` (documentat in guide - "boxty deploy my_app.py")
- [ ] CLI: `boxty app stop <id>` (documentat in reference)
- [ ] CLI: `boxty app logs <id>` (documentat in reference)
- [ ] CLI: `boxty app metrics <id>` (documentat in reference)
- [ ] CLI: `boxty app show <id>` (documentat in reference)
- [ ] CLI: `boxty app shell <id>` (documentat in reference)
- [ ] CLI: `boxty.App.lookup()` (documentat in SDK)
- [ ] CLI: `boxty.App.run()` (documentat in SDK - context manager)
- [ ] CLI: `boxty.App.deploy()` (documentat in SDK)
- [ ] CLI: `boxty.App.local_entrypoint()` (documentat in SDK)
- [ ] CLI: `boxty.App.get_dashboard_url()` (documentat in SDK)

## 5. FUNCTIONS
- [x] Backend: Workloads cu kind=function
- [ ] CLI: `boxty.Function.from_name()` (documentat in SDK)
- [ ] CLI: `boxty.Function.remote()` (documentat in SDK)
- [ ] CLI: `boxty.Function.remote_gen()` (documentat in SDK)
- [ ] CLI: `boxty.Function.local()` (documentat in SDK)
- [ ] CLI: `boxty.Function.spawn()` (documentat in SDK)
- [ ] CLI: `boxty.Function.map()` (documentat in SDK)
- [ ] CLI: `boxty.Function.starmap()` (documentat in SDK)
- [ ] CLI: `boxty.Function.for_each()` (documentat in SDK)
- [ ] CLI: `boxty.Function.spawn_map()` (documentat in SDK)
- [ ] CLI: `boxty.Function.get_web_url()` (documentat in SDK)
- [ ] CLI: `boxty.Function.with_options()` (documentat in SDK)
- [ ] CLI: `boxty.Function.with_concurrency()` (documentat in SDK)
- [ ] CLI: `boxty.Function.with_batching()` (documentat in SDK)
- [ ] CLI: `boxty.Function.update_autoscaler()` (documentat in SDK)
- [ ] CLI: `boxty.Function.get_current_stats()` (documentat in SDK)
- [ ] CLI: `@app.function()` decorator (documentat in SDK)
- [ ] CLI: `@app.cls()` decorator (documentat in SDK)
- [ ] CLI: `@app.server()` decorator (documentat in SDK)
- [ ] CLI: `@boxty.concurrent()` decorator (documentat in SDK)
- [ ] CLI: `@boxty.batched()` decorator (documentat in SDK)

## 6. SANDBOXES
- [x] Backend: POST /v1/sandbox-sessions
- [x] Backend: GET /v1/sandbox-sessions/verify
- [ ] CLI: `boxty sandbox create <name>` (documentat in SDK - boxty.Sandbox.create())
- [ ] CLI: `boxty sandbox list` (documentat in reference)
- [ ] CLI: `boxty sandbox ssh <id>` (documentat in reference)
- [ ] CLI: `boxty sandbox stop <id>` (documentat in reference)
- [ ] CLI: `boxty sandbox exec <id> <command>` (documentat in SDK - sandbox.exec())
- [ ] CLI: `boxty sandbox snapshot <id>` (documentat in SDK - snapshot_filesystem())
- [ ] CLI: `boxty.Sandbox.from_name()` (documentat in SDK)
- [ ] CLI: `boxty.Sandbox.from_id()` (documentat in SDK)
- [ ] CLI: `boxty.Sandbox.wait()` (documentat in SDK)
- [ ] CLI: `boxty.Sandbox.wait_until_ready()` (documentat in SDK)
- [ ] CLI: `boxty.Sandbox.terminate()` (documentat in SDK)
- [ ] CLI: `boxty.Sandbox.poll()` (documentat in SDK)
- [ ] CLI: `boxty.Sandbox.tunnels()` (documentat in SDK)
- [ ] CLI: `boxty.Sandbox.create_connect_token()` (documentat in SDK)
- [ ] CLI: `boxty.Sandbox.snapshot_filesystem()` (documentat in SDK)
- [ ] CLI: `boxty.Sandbox.snapshot_directory()` (documentat in SDK)
- [ ] CLI: `boxty.Sandbox.mount_image()` (documentat in SDK)
- [ ] CLI: `boxty.Sandbox.unmount_image()` (documentat in SDK)
- [ ] CLI: `boxty.Sandbox.filesystem.copy_from_local()` (documentat in SDK)
- [ ] CLI: `boxty.Sandbox.filesystem.copy_to_local()` (documentat in SDK)

## 7. VOLUMES
- [x] Backend: GET /v1/volumes
- [x] Backend: POST /v1/volumes
- [x] Backend: DELETE /v1/volumes/{ws}/{locator}
- [x] Backend: GET /v1/volumes/{locator}/entries
- [x] Backend: PUT /v1/volumes/{locator}/blob
- [x] Backend: GET /v1/volumes/{locator}/blob
- [x] Backend: DELETE /v1/volumes/{locator}/blob
- [ ] CLI: `boxty volume list` (documentat in reference)
- [ ] CLI: `boxty volume create <name> --size <gb>` (documentat in reference)
- [ ] CLI: `boxty volume delete <name>` (documentat in reference)
- [ ] CLI: `boxty volume ls <name>` (documentat in reference)
- [ ] CLI: `boxty volume cat <name> <path>` (documentat in reference)
- [ ] CLI: `boxty volume put <name> <path> <file>` (documentat in reference)
- [ ] CLI: `boxty volume rm <name> <path>` (documentat in reference)
- [ ] CLI: `boxty.Volume.from_name()` (documentat in SDK)
- [ ] CLI: `boxty.Volume.from_id()` (documentat in SDK)
- [ ] CLI: `boxty.Volume.ephemeral()` (documentat in SDK)
- [ ] CLI: `boxty.Volume.objects.create/list/delete()` (documentat in SDK)
- [ ] CLI: `boxty.Volume.commit()` (documentat in SDK)
- [ ] CLI: `boxty.Volume.reload()` (documentat in SDK)
- [ ] CLI: `boxty.Volume.listdir()` (documentat in SDK)
- [ ] CLI: `boxty.Volume.read_file()` (documentat in SDK)
- [ ] CLI: `boxty.Volume.remove_file()` (documentat in SDK)
- [ ] CLI: `boxty.Volume.copy_files()` (documentat in SDK)
- [ ] CLI: `boxty.Volume.batch_upload()` (documentat in SDK)
- [ ] CLI: `boxty.Volume.rename()` (documentat in SDK)

## 8. SECRETS
- [x] Backend: GET /v1/secrets
- [x] Backend: POST /v1/secrets
- [x] Backend: DELETE /v1/secrets/{ws}/{name}
- [ ] CLI: `boxty secret list` (documentat in reference)
- [ ] CLI: `boxty secret create <name> --from-env <file>` (documentat in reference)
- [ ] CLI: `boxty secret delete <name>` (documentat in reference)
- [ ] CLI: `boxty secret show <name>` (documentat in reference)
- [ ] CLI: `boxty.Secret.from_name()` (documentat in SDK)
- [ ] CLI: `boxty.Secret.from_dict()` (documentat in SDK)
- [ ] CLI: `boxty.Secret.from_local_environ()` (documentat in SDK)
- [ ] CLI: `boxty.Secret.from_dotenv()` (documentat in SDK)
- [ ] CLI: `boxty.Secret.objects.create/list/delete()` (documentat in SDK)
- [ ] CLI: `boxty.Secret.update()` (documentat in SDK)
- [ ] CLI: `boxty.Secret.info()` (documentat in SDK)

## 9. API KEYS / TOKENS
- [x] Backend: GET /v1/api-keys
- [x] Backend: POST /v1/api-keys
- [x] Backend: DELETE /v1/api-keys/{id}
- [ ] CLI: `boxty token list` (documentat in reference)
- [ ] CLI: `boxty token create <name>` (documentat in reference)
- [ ] CLI: `boxty token delete <id>` (documentat in reference)
- [ ] CLI: `boxty token rotate <id>` (documentat in reference)

## 10. IMAGES
- [x] Backend: GET /v1/images
- [x] Backend: POST /v1/images/build
- [ ] CLI: `boxty image list` (documentat in reference)
- [ ] CLI: `boxty image build <name> --dockerfile <file>` (documentat in reference)
- [ ] CLI: `boxty.Image.debian_slim()` (documentat in SDK)
- [ ] CLI: `boxty.Image.from_registry()` (documentat in SDK)
- [ ] CLI: `boxty.Image.from_id()` (documentat in SDK)
- [ ] CLI: `boxty.Image.build()` (documentat in SDK)
- [ ] CLI: `boxty.Image.pip_install()` (documentat in SDK)
- [ ] CLI: `boxty.Image.uv_pip_install()` (documentat in SDK)
- [ ] CLI: `boxty.Image.pip_install_from_requirements()` (documentat in SDK)
- [ ] CLI: `boxty.Image.pip_install_from_pyproject()` (documentat in SDK)
- [ ] CLI: `boxty.Image.poetry_install_from_file()` (documentat in SDK)
- [ ] CLI: `boxty.Image.uv_sync()` (documentat in SDK)
- [ ] CLI: `boxty.Image.add_local_file()` (documentat in SDK)
- [ ] CLI: `boxty.Image.add_local_dir()` (documentat in SDK)
- [ ] CLI: `boxty.Image.add_local_python_source()` (documentat in SDK)

## 11. BILLING
- [x] Backend: GET /v1/pricing
- [x] Backend: GET /v1/billing/balance
- [x] Backend: GET /v1/billing/usage
- [x] Backend: POST /v1/billing/credits
- [ ] CLI: `boxty billing balance` (documentat in reference)
- [ ] CLI: `boxty billing usage` (documentat in reference)
- [ ] CLI: `boxty billing buy <amount>` (documentat in reference)
- [ ] CLI: `boxty pricing` (documentat in reference)
- [ ] CLI: `boxty billing report` (documentat in guide + SDK)
- [ ] CLI: `boxty.billing.workspace_billing_report()` (documentat in SDK)
- [ ] CLI: `boxty.Workspace.billing.report()` (documentat in SDK)
- [ ] CLI: `boxty.Environment.billing.report()` (documentat in SDK)

## 12. DASHBOARD
- [x] Backend: GET /v1/dashboard/{ws}/{env}
- [x] Backend: GET /v1/dashboard/{ws}/{env}/summary
- [ ] CLI: `boxty status` (documentat in reference)
- [ ] CLI: `boxty status --watch` (documentat in reference)

## 13. ROUTES / ENDPOINTS
- [x] Backend: POST /v1/routes
- [x] Backend: GET /v1/routes
- [x] Backend: DELETE /v1/routes/{id}
- [ ] CLI: `boxty route list` (documentat in reference)
- [ ] CLI: `boxty route create <name> --workload <id>` (documentat in reference)
- [ ] CLI: `boxty route delete <id>` (documentat in reference)
- [ ] CLI: `boxty route open <name>` (documentat in reference)

## 14. SCHEDULES / CRON
- [x] Backend: GET /v1/schedules
- [x] Backend: POST /v1/schedules
- [x] Backend: PATCH /v1/schedules/{id}
- [x] Backend: DELETE /v1/schedules/{id}
- [x] Backend: POST /v1/schedules/{id}/trigger
- [ ] CLI: `boxty schedule list` (documentat in reference)
- [ ] CLI: `boxty schedule create <name> --cron <expr>` (documentat in reference)
- [ ] CLI: `boxty schedule delete <id>` (documentat in reference)
- [ ] CLI: `boxty schedule trigger <id>` (documentat in reference)
- [ ] CLI: `boxty schedule pause <id>` (documentat in reference)
- [ ] CLI: `boxty schedule resume <id>` (documentat in reference)
- [ ] CLI: `boxty.Period()` (documentat in SDK)
- [ ] CLI: `boxty.Cron()` (documentat in SDK)

## 15. INVITES / TEAM
- [x] Backend: GET /v1/invites
- [x] Backend: POST /v1/invites
- [ ] CLI: `boxty invite list` (documentat in reference)
- [ ] CLI: `boxty invite create <email>` (documentat in reference)
- [ ] CLI: `boxty invite accept <token>` (documentat in reference)

## 16. PROVIDERS (Admin)
- [x] Backend: GET /v1/providers
- [x] Backend: POST /v1/providers/register
- [x] Backend: POST /v1/providers/{id}/heartbeat
- [x] Backend: DELETE /v1/providers/{id}
- [ ] CLI: `boxty provider list` (documentat in reference)
- [ ] CLI: `boxty provider register <name>` (documentat in reference)
- [ ] CLI: `boxty provider delete <id>` (documentat in reference)

## 17. CONFIG & CONTEXT
- [ ] CLI: `boxty config set <key> <value>` (documentat in reference)
- [ ] CLI: `boxty config get <key>` (documentat in reference)
- [ ] CLI: `boxty config list` (documentat in reference)
- [ ] CLI: `boxty context` (documentat in reference)
- [ ] CLI: `boxty.Client.from_env()` (documentat in SDK)
- [ ] CLI: `boxty.Client.from_credentials()` (documentat in SDK)

## 18. DEPLOY / RUN
- [ ] CLI: `boxty deploy` (documentat in guide - "boxty deploy my_app.py")
- [ ] CLI: `boxty deploy --watch` (documentat in reference)
- [ ] CLI: `boxty run` (documentat in guide - "boxty run app_module.py")
- [ ] CLI: `boxty serve` (documentat in reference)
- [ ] CLI: `boxty.App.run()` (documentat in SDK)
- [ ] CLI: `boxty.App.deploy()` (documentat in SDK)
- [ ] CLI: `boxty.enable_output()` (documentat in SDK)

## 19. NETWORK / PROXY
- [ ] CLI: `boxty.Proxy` class (documentat in SDK)
- [ ] CLI: `boxty.Probe` class (documentat in SDK)
- [ ] CLI: `boxty.NetworkFileSystem` class (documentat in SDK)
- [ ] CLI: `boxty.CloudBucketMount` class (documentat in SDK)

## 20. DATABASES (SDK-only feature, not in backend)
- [x] SDK: `Boxty.databases` sub-client exists (Python SDK)
- [x] SDK: `DatabasesClient.list/create/delete/list_items/put_item/delete_item/query` exists
- [ ] Backend: Databases endpoints — NOT IMPLEMENTED
- [ ] CLI: `boxty database list` (documentat in reference)
- [ ] CLI: `boxty database create <name>` (documentat in reference)
- [ ] CLI: `boxty database delete <name>` (documentat in reference)

## 21. INFRASTRUCTURE
- [ ] CLI: Rust project structure (cli/sdk/Cargo.toml exists)
- [ ] CLI: HTTP client layer (reqwest in deps)
- [ ] CLI: Config file management (~/.boxty/)
- [ ] CLI: Table output formatting (ratatui in deps)
- [ ] CLI: Progress bars for long operations
- [ ] CLI: Error handling with helpful messages
- [ ] CLI: Auto-completion (bash/zsh/fish)
- [ ] CLI: Man pages / help text

## 22. CRITICAL PATH (ce trebuie implementat PRIMA)
- [ ] `boxty login` + token storage
- [ ] `boxty workspace list/create/switch`
- [ ] `boxty env list/create/switch`
- [ ] `boxty app list/deploy/stop/logs`
- [ ] `boxty volume list/create/delete`
- [ ] `boxty secret list/create/delete`
- [ ] `boxty billing balance/usage`
- [ ] `boxty status` (dashboard)
- [ ] `boxty deploy` (deploy app from file)
- [ ] `boxty run` (run local entrypoint)
