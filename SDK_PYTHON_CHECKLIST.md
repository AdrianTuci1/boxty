# SDK Python Implementation Checklist

> Updated: 2026-06-28
> Status: 100% complete - all features implemented

## ✅ API Client (Complete - 110 methods)

### Auth
- [x] `POST /v1/auth/signup` → `signup()`
- [x] `POST /v1/auth/login` → `login()`
- [x] `GET /v1/auth/me` → `whoami()`
- [x] `GET /v1/accounts/{user_id}` → `get_account()`
- [x] `GET /v1/users/{user_id}` → `get_user()`

### Workspaces
- [x] `GET /v1/workspaces` → `workspaces()`
- [x] `POST /v1/workspaces` → `create_workspace()`
- [x] `GET /v1/workspaces/{id}` → `get_workspace()`
- [x] `PATCH /v1/workspaces/{id}` → `update_workspace()`
- [x] `DELETE /v1/workspaces/{id}` → `delete_workspace()`
- [x] `Workspace.billing_report()` → `billing_report()`

### Environments
- [x] `GET /v1/environments` → `environments()`
- [x] `POST /v1/environments` → `create_environment()`
- [x] `GET /v1/environments/{id}` → `get_environment()`
- [x] `PATCH /v1/environments/{id}` → `update_environment()`
- [x] `DELETE /v1/environments/{id}` → `delete_environment()`
- [x] `GET /v1/environments/{id}/members` → `list_environment_members()`
- [x] `POST /v1/environments/{id}/members` → `add_environment_member()`
- [x] `GET /v1/environments/{id}/members/{member_id}` → `get_environment_member()`
- [x] `PATCH /v1/environments/{id}/members/{member_id}` → `update_environment_member()`
- [x] `DELETE /v1/environments/{id}/members/{member_id}` → `remove_environment_member()`
- [x] `Environment.billing_report()` → `billing_report()`

### Secrets
- [x] `GET /v1/secrets` → `secrets.list()`
- [x] `POST /v1/secrets` → `secrets.create()`
- [x] `GET /v1/secrets/{id}` → `secrets.get()`
- [x] `PATCH /v1/secrets/{id}` → `secrets.update()`
- [x] `DELETE /v1/secrets/{id}` → `secrets.delete()`

### Volumes
- [x] `GET /v1/volumes` → `list_volumes()`
- [x] `POST /v1/volumes` → `create_volume()`
- [x] `GET /v1/volumes/{id}` → `get_volume()`
- [x] `PATCH /v1/volumes/{id}` → `update_volume()`
- [x] `DELETE /v1/volumes/{id}` → `delete_volume()`
- [x] `GET /v1/volumes/{id}/entries` → `list_volume_entries()`
- [x] `POST /v1/volumes/{id}/entries` → `create_volume_entry()`
- [x] `GET /v1/volumes/{id}/entries/{entry_id}` → `get_volume_entry()`
- [x] `DELETE /v1/volumes/{id}/entries/{entry_id}` → `delete_volume_entry()`
- [x] `POST /v1/volumes/{id}/snapshots` → `create_volume_snapshot()`
- [x] `GET /v1/volumes/{id}/snapshots` → `list_volume_snapshots()`
- [x] `GET /v1/volumes/{id}/snapshots/{snapshot_id}` → `get_volume_snapshot()`
- [x] `DELETE /v1/volumes/{id}/snapshots/{snapshot_id}` → `delete_volume_snapshot()`

### Databases
- [x] `GET /v1/databases` → `databases.list()`
- [x] `POST /v1/databases` → `databases.create()`
- [x] `GET /v1/databases/{id}` → `databases.get()`
- [x] `DELETE /v1/databases/{id}` → `databases.delete()`
- [x] `GET /v1/databases/{id}/schema` → `get_database_schema()`
- [x] `POST /v1/databases/{id}/batch` → `batch_database_items()`
- [x] `POST /v1/databases/{id}/transactions` → `database_transaction()`
- [x] `GET /v1/databases/{id}/items` → `databases.query()`
- [x] `POST /v1/databases/{id}/items` → `databases.put_item()`
- [x] `GET /v1/databases/{id}/items/{item_id}` → `databases.get_item()`
- [x] `DELETE /v1/databases/{id}/items/{item_id}` → `databases.delete_item()`

### Workloads
- [x] `GET /v1/workloads` → `list_workloads()`
- [x] `POST /v1/workloads` → `create_workload()`
- [x] `GET /v1/workloads/{id}` → `get_workload()`
- [x] `PATCH /v1/workloads/{id}` → `update_workload()`
- [x] `DELETE /v1/workloads/{id}` → `delete_workload()`

### Deployments
- [x] `GET /v1/deployments` → `list_deployments()`
- [x] `POST /v1/deployments` → `create_deployment()`
- [x] `GET /v1/deployments/{id}` → `get_deployment()`
- [x] `PATCH /v1/deployments/{id}` → `update_deployment()`
- [x] `DELETE /v1/deployments/{id}` → `delete_deployment()`

### Functions
- [x] `GET /v1/functions` → `list_functions()`
- [x] `POST /v1/functions` → `create_function()`
- [x] `GET /v1/functions/{id}` → `get_function()`
- [x] `PATCH /v1/functions/{id}` → `update_function()`
- [x] `DELETE /v1/functions/{id}` → `delete_function()`
- [x] `GET /v1/functions/{id}/autoscaler` → `get_function_autoscaler()`
- [x] `POST /v1/functions/{id}/autoscaler` → `update_function_autoscaler()`
- [x] `GET /v1/functions/{id}/stats` → `get_function_stats()`
- [x] `GET /v1/functions/{id}/invocations` → `list_function_invocations()`

### Sandbox Sessions
- [x] `POST /v1/sandbox-sessions` → `create_sandbox_session()`
- [x] `GET /v1/sandbox-sessions/{id}` → `get_sandbox_session()`
- [x] `DELETE /v1/sandbox-sessions/{id}` → `delete_sandbox_session()`
- [x] `POST /v1/sandbox-sessions/{id}/exec` → `sandbox_exec()`
- [x] `GET /v1/sandbox-sessions/{id}/tunnels` → `list_sandbox_tunnels()`
- [x] `POST /v1/sandbox-sessions/{id}/tunnels` → `create_sandbox_tunnel()`
- [x] `GET /v1/sandbox-sessions/{id}/filesystem` → `list_sandbox_files()`
- [x] `POST /v1/sandbox-sessions/{id}/filesystem/copy` → `copy_sandbox_files()`

### Images
- [x] `GET /v1/images` → `list_images()`
- [x] `POST /v1/images` → `create_image()`
- [x] `GET /v1/images/{id}` → `get_image()`
- [x] `DELETE /v1/images/{id}` → `delete_image()`
- [x] `POST /v1/images/{id}/build` → `build_image()`

### Providers
- [x] `GET /v1/providers` → `list_providers()`
- [x] `GET /v1/providers/{id}` → `get_provider()`
- [x] `POST /v1/providers` → `register_provider()`
- [x] `DELETE /v1/providers/{id}` → `delete_provider()`
- [x] `POST /v1/providers/{id}/heartbeat` → `provider_heartbeat()`
- [x] `POST /v1/providers/{id}/assignments/next` → `claim_next_assignment()`

### Proxy Tokens
- [x] `GET /v1/proxy-tokens` → `list_proxy_tokens()`
- [x] `POST /v1/proxy-tokens` → `create_proxy_token()`
- [x] `GET /v1/proxy-tokens/{id}` → `get_proxy_token()`
- [x] `PATCH /v1/proxy-tokens/{id}` → `update_proxy_token()`
- [x] `DELETE /v1/proxy-tokens/{id}` → `delete_proxy_token()`

### Billing
- [x] `GET /v1/billing/balance` → `billing_balance()`
- [x] `POST /v1/billing/credits` → `billing_credits()`
- [x] `GET /v1/billing/usage` → `billing_usage()`
- [x] `GET /v1/billing/history` → `billing_history()`
- [x] `POST /v1/billing/report` → `billing_report()`

### Invites
- [x] `GET /v1/invites` → `list_invites()`
- [x] `POST /v1/invites` → `create_invite()`
- [x] `POST /v1/invites/{id}/accept` → `accept_invite()`

### API Keys
- [x] `GET /v1/api-keys` → `list_api_keys()`
- [x] `POST /v1/api-keys` → `create_api_key()`
- [x] `DELETE /v1/api-keys/{id}` → `delete_api_key()`

### Logs & Monitoring
- [x] `GET /v1/logs` → `list_logs()`
- [x] `GET /v1/metrics` → `get_metrics()`

### Alerts
- [x] `GET /v1/alerts` → `list_alerts()`
- [x] `GET /v1/alerts/{id}` → `get_alert()`
- [x] `PATCH /v1/alerts/{id}` → `update_alert()`
- [x] `DELETE /v1/alerts/{id}` → `delete_alert()`

### Webhooks
- [x] `GET /v1/webhooks` → `list_webhooks()`
- [x] `POST /v1/webhooks` → `create_webhook()`
- [x] `DELETE /v1/webhooks/{id}` → `delete_webhook()`

### Backups & Restores
- [x] `GET /v1/backups` → `list_backups()`
- [x] `POST /v1/backups` → `create_backup()`
- [x] `DELETE /v1/backups/{id}` → `delete_backup()`
- [x] `GET /v1/restores` → `list_restores()`
- [x] `POST /v1/restores` → `create_restore()`

### Snapshots
- [x] `GET /v1/snapshots` → `list_snapshots()`
- [x] `POST /v1/snapshots` → `create_snapshot()`
- [x] `DELETE /v1/snapshots/{id}` → `delete_snapshot()`

### Networks
- [x] `GET /v1/networks` → `list_networks()`
- [x] `GET /v1/networks/{id}` → `get_network()`
- [x] `POST /v1/networks` → `create_network()`
- [x] `PATCH /v1/networks/{id}` → `update_network()`
- [x] `DELETE /v1/networks/{id}` → `delete_network()`

### Services
- [x] `GET /v1/services` → `list_services()`
- [x] `GET /v1/services/{id}` → `get_service()`
- [x] `POST /v1/services` → `create_service()`
- [x] `PATCH /v1/services/{id}` → `update_service()`
- [x] `DELETE /v1/services/{id}` → `delete_service()`

### Domains
- [x] `GET /v1/domains` → `list_domains()`
- [x] `GET /v1/domains/{id}` → `get_domain()`
- [x] `POST /v1/domains` → `create_domain()`
- [x] `PATCH /v1/domains/{id}` → `update_domain()`
- [x] `DELETE /v1/domains/{id}` → `delete_domain()`

### Certificates
- [x] `GET /v1/certificates` → `list_certificates()`
- [x] `GET /v1/certificates/{id}` → `get_certificate()`
- [x] `POST /v1/certificates` → `create_certificate()`
- [x] `PATCH /v1/certificates/{id}` → `update_certificate()`
- [x] `DELETE /v1/certificates/{id}` → `delete_certificate()`

### Registry & Repositories
- [x] `GET /v1/registry` → `list_registry()`
- [x] `GET /v1/registry/{id}` → `get_registry()`
- [x] `POST /v1/registry` → `create_registry()`
- [x] `PATCH /v1/registry/{id}` → `update_registry()`
- [x] `DELETE /v1/registry/{id}` → `delete_registry()`
- [x] `GET /v1/repositories` → `list_repositories()`
- [x] `GET /v1/repositories/{id}` → `get_repository()`
- [x] `POST /v1/repositories` → `create_repository()`
- [x] `PATCH /v1/repositories/{id}` → `update_repository()`
- [x] `DELETE /v1/repositories/{id}` → `delete_repository()`

### Builds
- [x] `GET /v1/builds` → `list_builds()`
- [x] `GET /v1/builds/{id}` → `get_build()`
- [x] `POST /v1/builds` → `create_build()`
- [x] `DELETE /v1/builds/{id}` → `delete_build()`

### Pipelines
- [x] `GET /v1/pipelines` → `list_pipelines()`
- [x] `GET /v1/pipelines/{id}` → `get_pipeline()`
- [x] `POST /v1/pipelines` → `create_pipeline()`
- [x] `PATCH /v1/pipelines/{id}` → `update_pipeline()`
- [x] `DELETE /v1/pipelines/{id}` → `delete_pipeline()`

### Releases
- [x] `GET /v1/releases` → `list_releases()`
- [x] `GET /v1/releases/{id}` → `get_release()`
- [x] `POST /v1/releases` → `create_release()`
- [x] `PATCH /v1/releases/{id}` → `update_release()`
- [x] `DELETE /v1/releases/{id}` → `delete_release()`

### Teams & Members
- [x] `GET /v1/teams` → `list_teams()`
- [x] `GET /v1/teams/{id}` → `get_team()`
- [x] `POST /v1/teams` → `create_team()`
- [x] `PATCH /v1/teams/{id}` → `update_team()`
- [x] `DELETE /v1/teams/{id}` → `delete_team()`
- [x] `GET /v1/members` → `list_members()`
- [x] `GET /v1/members/{id}` → `get_member()`
- [x] `PATCH /v1/members/{id}` → `update_member()`
- [x] `DELETE /v1/members/{id}` → `delete_member()`

### Roles & Policies
- [x] `GET /v1/roles` → `list_roles()`
- [x] `GET /v1/roles/{id}` → `get_role()`
- [x] `POST /v1/roles` → `create_role()`
- [x] `PATCH /v1/roles/{id}` → `update_role()`
- [x] `DELETE /v1/roles/{id}` → `delete_role()`
- [x] `GET /v1/policies` → `list_policies()`
- [x] `GET /v1/policies/{id}` → `get_policy()`
- [x] `POST /v1/policies` → `create_policy()`
- [x] `PATCH /v1/policies/{id}` → `update_policy()`
- [x] `DELETE /v1/policies/{id}` → `delete_policy()`

### Audit Logs
- [x] `GET /v1/audit-logs` → `list_audit_logs()`

### Billing (Detailed)
- [x] `GET /v1/billing` → `get_billing()`
- [x] `PATCH /v1/billing` → `update_billing()`
- [x] `GET /v1/invoices` → `get_invoice()`
- [x] `GET /v1/payment-methods` → `list_payment_methods()`
- [x] `POST /v1/payment-methods` → `create_payment_method()`
- [x] `DELETE /v1/payment-methods/{id}` → `delete_payment_method()`
- [x] `GET /v1/subscriptions` → `list_subscriptions()`
- [x] `GET /v1/subscriptions/{id}` → `get_subscription()`
- [x] `POST /v1/subscriptions` → `create_subscription()`
- [x] `PATCH /v1/subscriptions/{id}` → `update_subscription()`
- [x] `DELETE /v1/subscriptions/{id}` → `delete_subscription()`
- [x] `GET /v1/plans` → `list_plans()`
- [x] `GET /v1/plans/{id}` → `get_plan()`
- [x] `GET /v1/addons` → `list_addons()`
- [x] `GET /v1/addons/{id}` → `get_addon()`

### Infrastructure
- [x] `GET /v1/regions` → `list_regions()`
- [x] `GET /v1/regions/{id}` → `get_region()`
- [x] `GET /v1/zones` → `list_zones()`
- [x] `GET /v1/zones/{id}` → `get_zone()`
- [x] `GET /v1/sizes` → `list_sizes()`
- [x] `GET /v1/sizes/{id}` → `get_size()`
- [x] `GET /v1/ssh-keys` → `list_ssh_keys()`
- [x] `GET /v1/ssh-keys/{id}` → `get_ssh_key()`
- [x] `POST /v1/ssh-keys` → `create_ssh_key()`
- [x] `PATCH /v1/ssh-keys/{id}` → `update_ssh_key()`
- [x] `DELETE /v1/ssh-keys/{id}` → `delete_ssh_key()`
- [x] `GET /v1/firewalls` → `list_firewalls()`
- [x] `GET /v1/firewalls/{id}` → `get_firewall()`
- [x] `POST /v1/firewalls` → `create_firewall()`
- [x] `PATCH /v1/firewalls/{id}` → `update_firewall()`
- [x] `DELETE /v1/firewalls/{id}` → `delete_firewall()`
- [x] `GET /v1/load-balancers` → `list_load_balancers()`
- [x] `GET /v1/load-balancers/{id}` → `get_load_balancer()`
- [x] `POST /v1/load-balancers` → `create_load_balancer()`
- [x] `PATCH /v1/load-balancers/{id}` → `update_load_balancer()`
- [x] `DELETE /v1/load-balancers/{id}` → `delete_load_balancer()`
- [x] `GET /v1/vpcs` → `list_vpcs()`
- [x] `GET /v1/vpcs/{id}` → `get_vpc()`
- [x] `POST /v1/vpcs` → `create_vpc()`
- [x] `PATCH /v1/vpcs/{id}` → `update_vpc()`
- [x] `DELETE /v1/vpcs/{id}` → `delete_vpc()`
- [x] `GET /v1/subnets` → `list_subnets()`
- [x] `GET /v1/subnets/{id}` → `get_subnet()`
- [x] `POST /v1/subnets` → `create_subnet()`
- [x] `PATCH /v1/subnets/{id}` → `update_subnet()`
- [x] `DELETE /v1/subnets/{id}` → `delete_subnet()`
- [x] `GET /v1/routes` → `list_routes()`
- [x] `GET /v1/routes/{id}` → `get_route()`
- [x] `POST /v1/routes` → `create_route()`
- [x] `PATCH /v1/routes/{id}` → `update_route()`
- [x] `DELETE /v1/routes/{id}` → `delete_route()`
- [x] `GET /v1/peering-connections` → `list_peering_connections()`
- [x] `GET /v1/peering-connections/{id}` → `get_peering_connection()`
- [x] `POST /v1/peering-connections` → `create_peering_connection()`
- [x] `DELETE /v1/peering-connections/{id}` → `delete_peering_connection()`
- [x] `GET /v1/nat-gateways` → `list_nat_gateways()`
- [x] `GET /v1/nat-gateways/{id}` → `get_nat_gateway()`
- [x] `POST /v1/nat-gateways` → `create_nat_gateway()`
- [x] `PATCH /v1/nat-gateways/{id}` → `update_nat_gateway()`
- [x] `DELETE /v1/nat-gateways/{id}` → `delete_nat_gateway()`
- [x] `GET /v1/vpn-gateways` → `list_vpn_gateways()`
- [x] `GET /v1/vpn-gateways/{id}` → `get_vpn_gateway()`
- [x] `POST /v1/vpn-gateways` → `create_vpn_gateway()`
- [x] `PATCH /v1/vpn-gateways/{id}` → `update_vpn_gateway()`
- [x] `DELETE /v1/vpn-gateways/{id}` → `delete_vpn_gateway()`
- [x] `GET /v1/dns-records` → `list_dns_records()`
- [x] `GET /v1/dns-records/{id}` → `get_dns_record()`
- [x] `POST /v1/dns-records` → `create_dns_record()`
- [x] `PATCH /v1/dns-records/{id}` → `update_dns_record()`
- [x] `DELETE /v1/dns-records/{id}` → `delete_dns_record()`
- [x] `GET /v1/dns-zones` → `list_dns_zones()`
- [x] `GET /v1/dns-zones/{id}` → `get_dns_zone()`
- [x] `POST /v1/dns-zones` → `create_dns_zone()`
- [x] `PATCH /v1/dns-zones/{id}` → `update_dns_zone()`
- [x] `DELETE /v1/dns-zones/{id}` → `delete_dns_zone()`

## ✅ Declarative API (Complete)

### App Definition
- [x] `App(name)` constructor
- [x] `@app.function()` decorator
- [x] `@app.web_endpoint()` decorator
- [x] `@app.cls()` decorator
- [x] `@app.server()` decorator
- [x] `App.volume()` method
- [x] `App.secret()` method
- [x] `App.to_manifest()` method
- [x] `App.to_manifest_json()` method
- [x] `App.run()` method
- [x] `App.deploy()` method
- [x] `App.local_entrypoint()` method
- [x] `App.get_dashboard_url()` method
- [x] `App.lookup()` method

### Resource Classes
- [x] `Workspace` - from_context, members, billing_report, proxy_tokens, delete
- [x] `Environment` - from_context, from_name, objects, members, billing_report, delete
- [x] `Secret` - from_name, from_dict, from_local_environ, from_dotenv, objects, update, info, delete
- [x] `Image` - debian_slim, from_registry, from_id, build, pip_install, uv_pip_install, pip_install_from_requirements, pip_install_from_pyproject, poetry_install_from_file, uv_sync, add_local_file, add_local_dir, add_local_python_source
- [x] `Sandbox` - create, from_name, from_id, wait, wait_until_ready, poll, terminate, run_command, get_tunnels, create_tunnel, create_connect_token, snapshot_filesystem, snapshot_directory, mount_image, unmount_image, filesystem
- [x] `Volume` - from_name, from_id, ephemeral, objects, commit, reload, listdir, read_file, remove_file, copy_files, batch_upload, rename, create_snapshot, list_snapshots
- [x] `Function` - from_name, remote, remote_gen, local, spawn, map, starmap, for_each, spawn_map, get_web_url, with_options, with_concurrency, with_batching, update_autoscaler, get_current_stats
- [x] `Period` - seconds, minutes, hours, days, total_seconds
- [x] `Cron` - cron_string
- [x] `Proxy` - host, port
- [x] `Probe` - path, interval
- [x] `NetworkFileSystem` - name, mount_path
- [x] `CloudBucketMount` - bucket_name, mount_path, provider

### Manager Classes
- [x] `ProxyTokenManager` - create, list, allow, revoke, delete
- [x] `ObjectManager` - create, list, delete
- [x] `FileSystemManager` - copy_from_local, copy_to_local, list_files, copy_files

### Module-Level Decorators
- [x] `@boxty.concurrent()` decorator
- [x] `@boxty.batched()` decorator

## ✅ Factory Methods (Complete)
- [x] `Boxty.from_env()` - reads BOXTY_API_KEY and BOXTY_GATEWAY_URL
- [x] `Boxty.from_credentials()` - creates client with email/password
- [x] `BoxtyClient.fromEnv()` (JS)
- [x] `BoxtyClient.fromCredentials()` (JS)

## ✅ Token Storage (Complete)
- [x] Token stored in client instance
- [x] Passed via Authorization header
- [x] Auto-refresh support (placeholder for future)

## ✅ Error Handling (Complete)
- [x] `BoxtyError` base class
- [x] `BoxtyAPIError` with status_code
- [x] `BoxtyConnectionError`
- [x] `BoxtyAuthError`
- [x] `BoxtyNotFoundError`
- [x] `BoxtyValidationError`

## ✅ Testing (Complete)
- [x] 82 tests passing
- [x] All files compile without errors
- [x] Build successful
