from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, Response, WebSocket, WebSocketDisconnect

from .config import settings
from .models import (
    ApiKeyCreateRequest,
    BillingCreditsRequest,
    EnvironmentCreateRequest,
    ImageCreateRequest,
    InviteCreateRequest,
    LoginRequest,
    ProviderHeartbeatRequest,
    ProviderRegistrationRequest,
    RoutePublishRequest,
    RunPodDispatchRequest,
    SandboxSessionRequest,
    ScheduleCreateRequest,
    SecretCreateRequest,
    UsageMeterRequest,
    UserRegistrationRequest,
    UserRegistrationResponse,
    WorkloadCreateRequest,
    WorkloadStatusUpdateRequest,
    WorkspaceCreateRequest,
    VolumeCreateRequest,
    generated_id,
)
from .runpod import runpod_adapter
import asyncio
import base64
import json
from typing import Any
import uuid

from .store import issued_access_token, store
from .scheduler import start_scheduler, stop_scheduler

app = FastAPI(title=settings.app_name)


@app.on_event("startup")
async def startup_event():
    start_scheduler()


@app.on_event("shutdown")
async def shutdown_event():
    stop_scheduler()


def provider_public_dict(provider) -> dict:
    payload = provider.model_dump(mode="json")
    payload.pop("auth_token_hash", None)
    return payload


def require_provider_registration_auth(authorization: str | None = Header(default=None)) -> None:
    expected = settings.provider_shared_token.strip()
    if not expected:
        return
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing provider bearer token")
    token = authorization.split(" ", 1)[1].strip()
    if token != expected:
        raise HTTPException(status_code=403, detail="invalid provider bearer token")


def require_provider_runtime_auth(
    x_provider_id: str = Header(default=""),
    authorization: str | None = Header(default=None),
) -> str:
    if not x_provider_id:
        raise HTTPException(status_code=401, detail="missing provider id header")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing provider bearer token")
    token = authorization.split(" ", 1)[1].strip()
    if not store.verify_provider_token(x_provider_id, token):
        raise HTTPException(status_code=403, detail="invalid provider runtime token")
    return x_provider_id


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok", "environment": settings.environment}


@app.post(f"{settings.api_prefix}/auth/register", response_model=UserRegistrationResponse)
def register_user(request: UserRegistrationRequest) -> UserRegistrationResponse:
    user_id = generated_id("usr")
    user, account, workspace, environment = store.register_user(
        user_id=user_id,
        external_user_id=request.external_user_id,
        email=request.email,
        organization_id=request.organization_id,
    )
    return UserRegistrationResponse(
        user_id=user.user_id,
        access_token=issued_access_token(request.external_user_id),
        bootstrap_credit_usd=account.credit_grants_usd,
        balance_usd=account.balance_usd,
        default_workspace_id=workspace.workspace_id,
        default_environment_id=environment.environment_id,
    )


@app.get(f"{settings.api_prefix}/pricing")
def get_pricing() -> dict:
    return store.pricing().model_dump(mode="json")


@app.get(f"{settings.api_prefix}/accounts/{{user_id}}")
def get_account(user_id: str) -> dict:
    try:
        account = store.get_account(user_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="account not found") from exc
    return account.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/users/{{user_id}}")
def get_user(user_id: str) -> dict:
    try:
        user = store.get_user(user_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="user not found") from exc
    return user.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/workspaces")
def list_workspaces(owner_id: str | None = None) -> list[dict]:
    return [workspace.model_dump(mode="json") for workspace in store.list_workspaces(owner_id)]


@app.post(f"{settings.api_prefix}/workspaces")
def create_workspace(request: WorkspaceCreateRequest) -> dict:
    try:
        workspace = store.create_workspace(request)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return workspace.model_dump(mode="json")


@app.delete(f"{settings.api_prefix}/workspaces/{{workspace_id}}")
def delete_workspace(workspace_id: str) -> dict:
    try:
        deleted = store.delete_workspace(workspace_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="workspace not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"deleted": deleted}


@app.get(f"{settings.api_prefix}/workspaces/{{workspace_id}}/environments")
def list_environments(workspace_id: str) -> list[dict]:
    return [environment.model_dump(mode="json") for environment in store.list_environments(workspace_id)]


@app.post(f"{settings.api_prefix}/environments")
def create_environment(request: EnvironmentCreateRequest) -> dict:
    try:
        environment = store.create_environment(request)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return environment.model_dump(mode="json")


@app.delete(f"{settings.api_prefix}/environments/{{environment_id}}")
def delete_environment(environment_id: str) -> dict:
    try:
        deleted = store.delete_environment(environment_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="environment not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"deleted": deleted}


@app.get(f"{settings.api_prefix}/api-keys")
def list_api_keys(workspace_id: str | None = None) -> list[dict]:
    return [api_key.model_dump(mode="json") for api_key in store.list_api_keys(workspace_id)]


@app.post(f"{settings.api_prefix}/api-keys")
def create_api_key(request: ApiKeyCreateRequest) -> dict:
    try:
        api_key = store.create_api_key(request)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return api_key.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/secrets")
def list_secrets(workspace_id: str | None = None) -> list[dict]:
    return [secret.model_dump(mode="json") for secret in store.list_secrets(workspace_id)]


@app.post(f"{settings.api_prefix}/secrets")
def create_secret(request: SecretCreateRequest) -> dict:
    try:
        secret = store.create_secret(request)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return secret.model_dump(mode="json")


@app.delete(f"{settings.api_prefix}/secrets/{{workspace_id}}/{{secret_name}}")
def delete_secret(workspace_id: str, secret_name: str) -> dict:
    deleted = store.delete_secret(workspace_id, secret_name)
    if not deleted:
        raise HTTPException(status_code=404, detail="secret not found")
    return {"deleted": True}


@app.get(f"{settings.api_prefix}/volumes")
def list_volumes(workspace_id: str | None = None) -> list[dict]:
    return [volume.model_dump(mode="json") for volume in store.list_volumes(workspace_id)]


@app.post(f"{settings.api_prefix}/volumes")
def create_volume(request: VolumeCreateRequest) -> dict:
    try:
        volume = store.create_volume(request)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return volume.model_dump(mode="json")


@app.delete(f"{settings.api_prefix}/volumes/{{workspace_id}}/{{locator}}")
def delete_volume(workspace_id: str, locator: str) -> dict:
    if not store.delete_volume(workspace_id, locator):
        raise HTTPException(status_code=404, detail="volume not found")
    return {"deleted": True}


@app.get(f"{settings.api_prefix}/volumes/{{locator}}/entries")
def list_volume_entries(locator: str, prefix: str = "") -> list[dict]:
    try:
        return [entry.model_dump(mode="json") for entry in store.list_volume_entries(locator, prefix)]
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="volume not found") from exc


@app.put(f"{settings.api_prefix}/volumes/{{locator}}/blob")
async def put_volume_blob(locator: str, request: Request, path: str = Query(...)) -> dict:
    body = await request.body()
    try:
        entry = store.write_volume_blob(locator, path, body)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="volume not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return entry.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/volumes/{{locator}}/blob")
def get_volume_blob(locator: str, path: str = Query(...)) -> Response:
    try:
        data = store.read_volume_blob(locator, path)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="volume not found") from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="blob not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return Response(content=data, media_type="application/octet-stream")


@app.delete(f"{settings.api_prefix}/volumes/{{locator}}/blob")
def delete_volume_blob(locator: str, path: str = Query(...)) -> dict:
    try:
        deleted = store.delete_volume_blob(locator, path)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="volume not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"deleted": deleted}


@app.get(f"{settings.api_prefix}/invites")
def list_invites(workspace_id: str | None = None) -> list[dict]:
    return [invite.model_dump(mode="json") for invite in store.list_invites(workspace_id)]


@app.post(f"{settings.api_prefix}/invites")
def create_invite(request: InviteCreateRequest) -> dict:
    try:
        invite = store.create_invite(request)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return invite.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/providers")
def list_providers() -> list[dict]:
    store.expire_stale_providers()
    return [provider_public_dict(provider) for provider in store.providers.values()]


@app.post(f"{settings.api_prefix}/providers/register")
def register_provider(request: ProviderRegistrationRequest, _: None = Depends(require_provider_registration_auth)) -> dict:
    provider = store.register_provider(request)
    return provider.model_dump(mode="json")


@app.post(f"{settings.api_prefix}/providers/{{provider_id}}/heartbeat")
def provider_heartbeat(
    provider_id: str,
    request: ProviderHeartbeatRequest,
    auth_provider_id: str = Depends(require_provider_runtime_auth),
) -> dict:
    if auth_provider_id != provider_id:
        raise HTTPException(status_code=403, detail="provider id mismatch")
    try:
        provider = store.heartbeat_provider(provider_id, request)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="provider not found") from exc
    return provider.model_dump(mode="json")


@app.delete(f"{settings.api_prefix}/providers/{{provider_id}}")
def unregister_provider(
    provider_id: str,
    auth_provider_id: str = Depends(require_provider_runtime_auth),
) -> dict:
    if auth_provider_id != provider_id:
        raise HTTPException(status_code=403, detail="provider id mismatch")
    store.unregister_provider(provider_id)
    active_tunnels.pop(provider_id, None)
    return {"unregistered": True}


@app.post(f"{settings.api_prefix}/providers/{{provider_id}}/assignments/next")
def claim_next_assignment(provider_id: str, auth_provider_id: str = Depends(require_provider_runtime_auth)) -> dict | None:
    if auth_provider_id != provider_id:
        raise HTTPException(status_code=403, detail="provider id mismatch")
    try:
        assignment = store.claim_next_assignment(provider_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="provider not found") from exc
    return assignment.model_dump(mode="json") if assignment else None


@app.get(f"{settings.api_prefix}/workloads")
def list_workloads(workspace_id: str | None = None, environment_id: str | None = None) -> list[dict]:
    if workspace_id or environment_id:
        return [workload.model_dump(mode="json") for workload in store.list_workloads_filtered(workspace_id, environment_id)]
    return [workload.model_dump(mode="json") for workload in store.workloads.values()]


@app.post(f"{settings.api_prefix}/workloads")
def create_workload(request: WorkloadCreateRequest) -> dict:
    try:
        workload = store.create_workload(request)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return workload.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/workloads/{{workload_id}}")
def get_workload(workload_id: str) -> dict:
    workload = store.workloads.get(workload_id)
    if not workload:
        raise HTTPException(status_code=404, detail="workload not found")
    return workload.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/workloads/{{workload_id}}/launch-spec")
def get_workload_launch_spec(workload_id: str, _: str = Depends(require_provider_runtime_auth)) -> dict:
    try:
        spec = store.workload_launch_spec(workload_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="workload not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return spec.model_dump(mode="json")


@app.post(f"{settings.api_prefix}/workloads/{{workload_id}}/status")
def update_workload_status(
    workload_id: str,
    request: WorkloadStatusUpdateRequest,
    _: str = Depends(require_provider_runtime_auth),
) -> dict:
    try:
        workload = store.update_workload_status(workload_id, request)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="workload not found") from exc
    return workload.model_dump(mode="json")


@app.post(f"{settings.api_prefix}/routes")
def publish_route(request: RoutePublishRequest) -> dict:
    try:
        route = store.publish_route(request)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="workload not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return route.model_dump(mode="json")


@app.post(f"{settings.api_prefix}/sandbox-sessions")
def create_sandbox_session(request: SandboxSessionRequest) -> dict:
    try:
        session = store.create_sandbox_session(request)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="workload not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return session.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/sandbox-sessions/verify")
def verify_sandbox_session(token: str, _: str = Depends(require_provider_runtime_auth)) -> dict:
    session = store.get_sandbox_session_by_token(token)
    if not session:
        raise HTTPException(status_code=404, detail="sandbox session not found or expired")
    return session.model_dump(mode="json")


@app.post(f"{settings.api_prefix}/runpod/dispatch")
def dispatch_runpod(request: RunPodDispatchRequest) -> dict:
    if request.workload_id not in store.workloads:
        raise HTTPException(status_code=404, detail="workload not found")
    response = runpod_adapter.dispatch(request)
    workload = store.attach_runpod_backend(request.workload_id, response.external_id)
    return {
        "dispatch": response.model_dump(mode="json"),
        "workload": workload.model_dump(mode="json"),
    }


@app.post(f"{settings.api_prefix}/usage/meter")
def meter_usage(request: UsageMeterRequest, _: str = Depends(require_provider_runtime_auth)) -> dict:
    try:
        result = store.meter_usage(request)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="workload or account not found") from exc
    return result.model_dump(mode="json")


@app.post(f"{settings.api_prefix}/auth/login")
def login(request: LoginRequest) -> dict:
    try:
        result = store.login(request.external_user_id, request.email)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="user not found") from exc
    return result.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/auth/me")
def whoami(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    # Find user by token - token format is "boxty_{external_user_id}_{random}"
    # We can extract external_user_id from token prefix
    parts = token.split("_")
    if len(parts) >= 3 and parts[0] == "boxty":
        external_user_id = parts[1]
        for user in store.users.values():
            if user.external_user_id == external_user_id:
                return {
                    "user_id": user.user_id,
                    "external_user_id": user.external_user_id,
                    "email": user.email,
                    "created_at": user.created_at,
                }
    raise HTTPException(status_code=401, detail="invalid token")


@app.delete(f"{settings.api_prefix}/api-keys/{{api_key_id}}")
def delete_api_key(api_key_id: str) -> dict:
    deleted = store.delete_api_key(api_key_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="api key not found")
    return {"deleted": True}


@app.delete(f"{settings.api_prefix}/workloads/{{workload_id}}")
def delete_workload(workload_id: str) -> dict:
    deleted = store.delete_workload(workload_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="workload not found")
    return {"deleted": True}


@app.get(f"{settings.api_prefix}/routes")
def list_routes(workspace_id: str | None = None, environment_id: str | None = None) -> list[dict]:
    return [route.model_dump(mode="json") for route in store.list_routes(workspace_id, environment_id)]


@app.delete(f"{settings.api_prefix}/routes/{{route_id}}")
def delete_route(route_id: str) -> dict:
    deleted = store.delete_route(route_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="route not found")
    return {"deleted": True}


@app.get(f"{settings.api_prefix}/usage")
def list_usage(workload_id: str | None = None, owner_id: str | None = None) -> list[dict]:
    return [usage.model_dump(mode="json") for usage in store.list_usage(workload_id, owner_id)]


@app.get(f"{settings.api_prefix}/billing/balance")
def get_billing_balance(user_id: str) -> dict:
    try:
        result = store.billing_balance(user_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="account not found") from exc
    return result.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/billing/usage")
def get_billing_usage(user_id: str) -> dict:
    try:
        result = store.billing_usage(user_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="account not found") from exc
    return result.model_dump(mode="json")


@app.post(f"{settings.api_prefix}/billing/credits")
def add_billing_credits(request: BillingCreditsRequest) -> dict:
    try:
        result = store.add_credits(request.user_id, request.amount_usd)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="account not found") from exc
    return result.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/dashboard/{{workspace_id}}/{{environment_id}}")
def get_dashboard(workspace_id: str, environment_id: str) -> dict:
    return store.dashboard_summary(workspace_id, environment_id).model_dump(mode="json")


@app.get(f"{settings.api_prefix}/dashboard/{{workspace_id}}/{{environment_id}}/summary")
def get_dashboard_summary(workspace_id: str, environment_id: str) -> dict:
    return store.dashboard_summary(workspace_id, environment_id).model_dump(mode="json")


@app.get(f"{settings.api_prefix}/workloads/{{workload_id}}/metrics")
def get_workload_metrics(workload_id: str) -> dict:
    try:
        result = store.workload_metrics(workload_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="workload not found") from exc
    return result.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/workloads/{{workload_id}}/logs")
def get_workload_logs(workload_id: str) -> list[dict]:
    if workload_id not in store.workloads:
        raise HTTPException(status_code=404, detail="workload not found")
    return [log.model_dump(mode="json") for log in store.workload_logs(workload_id)]


@app.get(f"{settings.api_prefix}/admin/dynamodb-items")
def list_dynamodb_items() -> list[dict]:
    return [item.model_dump(mode="json") for item in store.export_single_table_items()]


active_tunnels: dict[str, WebSocket] = {}
pending_responses: dict[str, asyncio.Future] = {}


@app.websocket(f"{settings.api_prefix}/providers/{{provider_id}}/tunnel")
async def provider_tunnel(websocket: WebSocket, provider_id: str, token: str = Query(...)):
    if not store.verify_provider_token(provider_id, token):
        await websocket.close(code=1008, reason="invalid token")
        return
    await websocket.accept()
    active_tunnels[provider_id] = websocket
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            if message.get("type") == "response":
                request_id = message.get("request_id")
                future = pending_responses.pop(request_id, None)
                if future and not future.done():
                    future.set_result(message)
    except WebSocketDisconnect:
        pass
    finally:
        active_tunnels.pop(provider_id, None)


@app.api_route("/r/{endpoint_name}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def proxy_endpoint(request: Request, endpoint_name: str) -> Response:
    workload = None
    for w in store.workloads.values():
        if w.endpoint_name == endpoint_name:
            workload = w
            break

    if not workload:
        raise HTTPException(status_code=404, detail="endpoint not found")

    provider_id = workload.assigned_provider_id
    if not provider_id:
        raise HTTPException(status_code=503, detail="endpoint not assigned to a provider")

    websocket = active_tunnels.get(provider_id)
    if not websocket:
        raise HTTPException(status_code=503, detail="endpoint provider not connected")

    body = await request.body()
    request_id = str(uuid.uuid4())

    headers = {}
    for key, value in request.headers.items():
        if key.lower() not in {"host", "connection", "content-length"}:
            headers[key] = value

    path = request.url.path.removeprefix(f"/r/{endpoint_name}")
    if not path:
        path = "/"
    query = str(request.query_params)
    if query:
        path = f"{path}?{query}"

    message = {
        "type": "request",
        "request_id": request_id,
        "endpoint_name": endpoint_name,
        "method": request.method,
        "path": path,
        "headers": headers,
        "body": base64.b64encode(body).decode() if body else "",
    }

    future = asyncio.get_event_loop().create_future()
    pending_responses[request_id] = future

    try:
        await websocket.send_text(json.dumps(message))
        response_data = await asyncio.wait_for(future, timeout=30.0)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="gateway timeout")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"tunnel error: {exc}") from exc
    finally:
        pending_responses.pop(request_id, None)

    status_code = response_data.get("status", 502)
    response_headers = response_data.get("headers", {})
    response_body = base64.b64decode(response_data.get("body", "")) if response_data.get("body") else b""

    return Response(
        content=response_body,
        status_code=status_code,
        headers={
            k: v
            for k, v in response_headers.items()
            if k.lower() not in {"content-length", "transfer-encoding"}
        },
    )


@app.get(f"{settings.api_prefix}/schedules")
def list_schedules(
    workspace_id: str | None = Query(default=None),
    environment_id: str | None = Query(default=None),
) -> list[dict]:
    return [s.model_dump(mode="json") for s in store.list_schedules(workspace_id, environment_id)]


@app.post(f"{settings.api_prefix}/schedules")
def create_schedule(request: ScheduleCreateRequest) -> dict:
    schedule = store.create_schedule(request)
    return schedule.model_dump(mode="json")


@app.patch(f"{settings.api_prefix}/schedules/{{schedule_id}}")
def update_schedule(schedule_id: str, payload: dict[str, Any]) -> dict:
    try:
        schedule = store.update_schedule(schedule_id, payload)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return schedule.model_dump(mode="json")


@app.delete(f"{settings.api_prefix}/schedules/{{schedule_id}}")
def delete_schedule(schedule_id: str) -> dict:
    if store.delete_schedule(schedule_id):
        return {"deleted": True}
    raise HTTPException(status_code=404, detail="schedule not found")


@app.post(f"{settings.api_prefix}/schedules/{{schedule_id}}/trigger")
def trigger_schedule(schedule_id: str) -> dict:
    try:
        schedule = store.trigger_schedule(schedule_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return schedule.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/images")
def list_images(workspace_id: str | None = Query(default=None)) -> list[dict]:
    return [i.model_dump(mode="json") for i in store.list_images(workspace_id)]


@app.post(f"{settings.api_prefix}/images/build")
def build_image(request: ImageCreateRequest) -> dict:
    image = store.create_image(request)
    image.status = "building"
    image.build_log = "Build started..."
    return image.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/images/{{image_id}}")
def get_image(image_id: str) -> dict:
    try:
        image = store.get_image(image_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return image.model_dump(mode="json")


@app.delete(f"{settings.api_prefix}/images/{{image_id}}")
def delete_image(image_id: str) -> dict:
    if store.delete_image(image_id):
        return {"deleted": True}
    raise HTTPException(status_code=404, detail="image not found")
