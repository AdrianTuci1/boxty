# Control Plane Backend API Checklist

## Sursa: control_plane/app/main.py + control_plane/app/store.py

## 1. AUTHENTICATION
- [x] POST /v1/auth/register
- [x] POST /v1/auth/login
- [x] GET /v1/auth/me

## 2. WORKSPACES
- [x] GET /v1/workspaces
- [x] POST /v1/workspaces
- [x] DELETE /v1/workspaces/{workspace_id}
- [x] GET /v1/workspaces/{workspace_id}/environments

## 3. ENVIRONMENTS
- [x] GET /v1/workspaces/{workspace_id}/environments
- [x] POST /v1/environments
- [x] DELETE /v1/environments/{environment_id}

## 4. API KEYS
- [x] GET /v1/api-keys
- [x] POST /v1/api-keys
- [x] DELETE /v1/api-keys/{api_key_id}

## 5. SECRETS
- [x] GET /v1/secrets
- [x] POST /v1/secrets
- [x] DELETE /v1/secrets/{workspace_id}/{secret_name}

## 6. VOLUMES
- [x] GET /v1/volumes
- [x] POST /v1/volumes
- [x] DELETE /v1/volumes/{workspace_id}/{locator}
- [x] GET /v1/volumes/{locator}/entries
- [x] PUT /v1/volumes/{locator}/blob
- [x] GET /v1/volumes/{locator}/blob
- [x] DELETE /v1/volumes/{locator}/blob

## 7. INVITES
- [x] GET /v1/invites
- [x] POST /v1/invites

## 8. PROVIDERS
- [x] GET /v1/providers
- [x] POST /v1/providers/register
- [x] POST /v1/providers/{provider_id}/heartbeat
- [x] DELETE /v1/providers/{provider_id}
- [x] POST /v1/providers/{provider_id}/assignments/next

## 9. WORKLOADS
- [x] GET /v1/workloads
- [x] POST /v1/workloads
- [x] GET /v1/workloads/{workload_id}
- [x] GET /v1/workloads/{workload_id}/launch-spec
- [x] POST /v1/workloads/{workload_id}/status
- [x] DELETE /v1/workloads/{workload_id}
- [x] GET /v1/workloads/{workload_id}/metrics
- [x] GET /v1/workloads/{workload_id}/logs

## 10. ROUTES
- [x] GET /v1/routes
- [x] POST /v1/routes
- [x] DELETE /v1/routes/{route_id}

## 11. SANDBOX
- [x] POST /v1/sandbox-sessions
- [x] GET /v1/sandbox-sessions/verify

## 12. RUNPOD
- [x] POST /v1/runpod/dispatch

## 13. USAGE
- [x] POST /v1/usage/meter
- [x] GET /v1/usage

## 14. BILLING
- [x] GET /v1/pricing
- [x] GET /v1/billing/balance
- [x] GET /v1/billing/usage
- [x] POST /v1/billing/credits

## 15. DASHBOARD
- [x] GET /v1/dashboard/{workspace_id}/{environment_id}
- [x] GET /v1/dashboard/{workspace_id}/{environment_id}/summary

## 16. SCHEDULES
- [x] GET /v1/schedules
- [x] POST /v1/schedules
- [x] PATCH /v1/schedules/{schedule_id}
- [x] DELETE /v1/schedules/{schedule_id}
- [x] POST /v1/schedules/{schedule_id}/trigger

## 17. IMAGES
- [x] GET /v1/images
- [x] POST /v1/images/build
- [x] GET /v1/images/{image_id}
- [x] DELETE /v1/images/{image_id}

## 18. ADMIN
- [x] GET /v1/admin/dynamodb-items

## 19. WEBSOCKET
- [x] WS /v1/providers/{provider_id}/tunnel

## 20. PROXY
- [x] ALL /r/{endpoint_name}

## 21. HEALTH
- [x] GET /healthz

## Total: 55 endpointuri implementate
