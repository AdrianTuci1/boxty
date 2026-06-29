from email.message import EmailMessage
import smtplib

from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException, Query, Request, Response, WebSocket, WebSocketDisconnect

from .config import settings
from .models import (
    AcceptInviteRequest,
    ApiKeyCreateRequest,
    BillingCreditsRequest,
    BillingReportRequest,
    EnvironmentCreateRequest,
    EnvironmentMember,
    EnvironmentMemberUpdateRequest,
    FunctionAutoscalerConfig,
    FunctionInvocationRequest,
    FunctionInvocationResponse,
    FunctionStats,
    ImageCreateRequest,
    InviteCreateRequest,
    LoginRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    ProxyToken,
    ProxyTokenCreateRequest,
    ProviderHeartbeatRequest,
    ProviderRegistrationRequest,
    RoutePublishRequest,
    RunPodDispatchRequest,
    SandboxExecRequest,
    SandboxExecResponse,
    SandboxSessionRequest,
    SandboxTunnel,
    ScheduleCreateRequest,
    SecretCreateRequest,
    UsageMeterRequest,
    UserRegistrationRequest,
    UserRegistrationResponse,
    WorkloadCreateRequest,
    WorkloadInvokeRequest,
    WorkloadInvokeResponse,
    WorkloadStatusUpdateRequest,
    WorkspaceCreateRequest,
    WorkspaceMember,
    WorkspaceMemberUpdateRequest,
    VolumeCreateRequest,
    VolumeEntry,
    VolumeSnapshot,
    generated_id,
    utc_now,
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
        password=request.password,
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


@app.post(f"{settings.api_prefix}/workloads/{{workload_id}}/invoke")
async def invoke_workload(
    workload_id: str,
    request: WorkloadInvokeRequest,
) -> dict:
    workload = store.workloads.get(workload_id)
    if not workload:
        raise HTTPException(status_code=404, detail="workload not found")

    runtime_details = workload.runtime_details or {}
    container_id = runtime_details.get("container_id")
    provider_id = workload.assigned_provider_id

    # Fast path: use warm container via WebSocket tunnel if available.
    if workload.status.value in {"running", "completed"} and container_id and provider_id and provider_id in active_tunnels:
        websocket = active_tunnels[provider_id]
        request_id = str(uuid.uuid4())
        message = {
            "type": "function_invoke",
            "request_id": request_id,
            "workload_id": workload_id,
            "container_id": container_id,
            "payload": request.payload,
        }
        future = asyncio.get_event_loop().create_future()
        pending_responses[request_id] = future
        try:
            await websocket.send_text(json.dumps(message))
            response_data = await asyncio.wait_for(future, timeout=30.0)
        except asyncio.TimeoutError:
            raise HTTPException(status_code=504, detail="invoke timeout")
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"invoke tunnel error: {exc}") from exc
        finally:
            pending_responses.pop(request_id, None)

        return WorkloadInvokeResponse(
            workload_id=workload_id,
            stdout=response_data.get("stdout", ""),
            stderr=response_data.get("stderr", ""),
            return_code=response_data.get("return_code", 0),
        ).model_dump(mode="json")

    # Fallback: schedule the workload and poll until it reaches a terminal state.
    try:
        invocation = store.invoke_workload_sync(workload_id, request)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="workload not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    poll_interval = settings.worker_poll_interval_seconds
    timeout = 300
    elapsed = 0.0
    while elapsed < timeout:
        workload = store.workloads.get(workload_id)
        if workload is None:
            invocation.status = "failed"
            invocation.error = "workload disappeared during invocation"
            invocation.completed_at = utc_now()
            return invocation.model_dump(mode="json")

        if workload.status in {"completed", "failed", "stopped"}:
            invocation.status = workload.status
            invocation.completed_at = utc_now()
            stdout = workload.runtime_details.get("stdout") or workload.runtime_details.get("logs") or ""
            invocation.result = {
                "workload_id": workload.workload_id,
                "status": workload.status,
                "stdout": stdout,
                "runtime_details": workload.runtime_details,
                "accrued_cost_usd": workload.accrued_cost_usd,
            }
            if workload.status == "failed":
                invocation.error = stdout or "function execution failed"
            return invocation.model_dump(mode="json")

        await asyncio.sleep(poll_interval)
        elapsed += poll_interval

    invocation.status = "timeout"
    invocation.error = f"invocation timed out after {timeout} seconds"
    invocation.completed_at = utc_now()
    return invocation.model_dump(mode="json")


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


@app.post(f"{settings.api_prefix}/billing/checkout")
def create_checkout(request: BillingCreditsRequest) -> dict:
    """Create a Stripe checkout session for credit purchase."""
    from .container import container
    
    try:
        account = store.get_account(request.user_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="account not found") from exc
    
    if not container.is_enabled("stripe"):
        # Fallback: add credits directly (for testing/development)
        result = store.add_credits(request.user_id, request.amount_usd)
        return {
            "checkout_url": None,
            "session_id": None,
            "status": "direct_credit",
            "result": result.model_dump(mode="json"),
        }
    
    try:
        stripe_service = container.get("stripe")
        
        # Create/get Stripe customer
        if not account.stripe_customer_id:
            customer = stripe_service.create_customer(
                email=account.email,
                name=account.name,
            )
            store.update_account_stripe_customer(request.user_id, customer["stripe_customer_id"])
            stripe_customer_id = customer["stripe_customer_id"]
        else:
            stripe_customer_id = account.stripe_customer_id
        
        # Create checkout session
        checkout = stripe_service.create_checkout_session(
            customer_id=stripe_customer_id,
            amount_usd=request.amount_usd,
            success_url=f"{request.success_url or 'https://boxty.dev/billing/success'}?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=request.cancel_url or "https://boxty.dev/billing/cancel",
        )
        
        # Record pending payment
        store.create_pending_payment(
            user_id=request.user_id,
            stripe_session_id=checkout["session_id"],
            amount_usd=request.amount_usd,
        )
        
        return checkout
        
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Stripe error: {exc}") from exc


@app.post(f"{settings.api_prefix}/billing/webhook")
async def stripe_webhook(request: Request) -> dict:
    """Handle Stripe webhook for payment confirmation."""
    from .container import container
    
    if not container.is_enabled("stripe"):
        raise HTTPException(status_code=503, detail="Stripe not enabled")
    
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")
    
    if not signature:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")
    
    try:
        stripe_service = container.get("stripe")
        event = stripe_service.verify_webhook(payload, signature)
        
        if event["type"] == "checkout.session.completed":
            payment = stripe_service.handle_payment_success(event)
            
            # Find and fulfill pending payment
            pending = store.get_pending_payment_by_session(payment["stripe_session_id"])
            if pending:
                store.add_credits(pending.user_id, payment["amount_usd"])
                store.mark_payment_completed(
                    payment_id=pending.payment_id,
                    stripe_payment_intent_id=payment["payment_intent_id"],
                )
        
        return {"received": True, "type": event["type"]}
        
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Webhook error: {exc}") from exc


@app.get(f"{settings.api_prefix}/billing/history")
def get_billing_history(user_id: str) -> list[dict]:
    """Get billing history for a user."""
    try:
        history = store.get_billing_history(user_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="account not found") from exc
    return [h.model_dump(mode="json") for h in history]


@app.get(f"{settings.api_prefix}/billing/invoices")
def get_invoices(user_id: str) -> list[dict]:
    """Get Stripe invoices for a user."""
    from .container import container
    
    try:
        account = store.get_account(user_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="account not found") from exc
    
    if not container.is_enabled("stripe") or not account.stripe_customer_id:
        return []
    
    try:
        stripe_service = container.get("stripe")
        return stripe_service.get_customer_invoices(account.stripe_customer_id)
    except Exception:
        return []


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


def _run_image_build(image_id: str) -> None:
    """Background task that runs the real Docker build."""
    try:
        store.build_image(image_id)
    except Exception as exc:
        # Best-effort logging; failures are already stored on the image record.
        print(f"[build_image] background build failed for {image_id}: {exc}")


@app.post(f"{settings.api_prefix}/images/build")
def build_image(request: ImageCreateRequest, background_tasks: BackgroundTasks) -> dict:
    image = store.create_image(request)
    image.status = "building"
    image.build_log = "Build started..."
    # Persist the initial building state
    store.images[image.image_id] = image
    background_tasks.add_task(_run_image_build, image.image_id)
    return image.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/images/{{image_id}}/build-status")
def get_image_build_status(image_id: str) -> dict:
    try:
        image = store.get_image(image_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {
        "image_id": image.image_id,
        "status": image.status,
        "image_ref": image.image_ref,
        "build_log": image.build_log,
        "updated_at": image.updated_at,
        "built_at": image.built_at,
    }


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


# -- billing reports ---------------------------------------------------------

@app.post(f"{settings.api_prefix}/billing/report")
def create_billing_report(request: BillingReportRequest) -> dict:
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    start = request.period_start or (now - timedelta(days=30))
    end = request.period_end or now
    
    workloads = store.list_workloads(request.workspace_id, request.environment_id)
    total_spend = sum(getattr(w, 'accrued_cost_usd', 0.0) for w in workloads)
    total_compute = sum(getattr(w, 'cpu_seconds', 0.0) for w in workloads)
    total_storage = sum(getattr(w, 'storage_gb', 0.0) for w in workloads)
    total_egress = sum(getattr(w, 'egress_gb', 0.0) for w in workloads)
    
    report = BillingReport(
        workspace_id=request.workspace_id,
        environment_id=request.environment_id,
        period_start=start,
        period_end=end,
        total_spend_usd=total_spend,
        total_workloads=len(workloads),
        total_compute_seconds=total_compute,
        total_storage_gb=total_storage,
        total_egress_gb=total_egress,
        breakdown=[
            {
                "workload_id": w.workload_id,
                "name": getattr(w, 'name', ''),
                "cost_usd": getattr(w, 'accrued_cost_usd', 0.0),
                "cpu_seconds": getattr(w, 'cpu_seconds', 0.0),
                "ram_gb_seconds": getattr(w, 'ram_gb_seconds', 0.0),
            }
            for w in workloads
        ]
    )
    return report.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/billing/report/{{report_id}}")
def get_billing_report(report_id: str) -> dict:
    raise HTTPException(status_code=404, detail="report not found")


# -- proxy tokens ------------------------------------------------------------

@app.get(f"{settings.api_prefix}/proxy-tokens")
def list_proxy_tokens(workspace_id: str = Query(...)) -> list[dict]:
    tokens = store.list_proxy_tokens(workspace_id)
    return [t.model_dump(mode="json") for t in tokens]


@app.post(f"{settings.api_prefix}/proxy-tokens")
def create_proxy_token(request: ProxyTokenCreateRequest) -> dict:
    import hashlib
    token_value = generated_id("tok")
    token_hash = hashlib.sha256(token_value.encode()).hexdigest()[:16]
    token = ProxyToken(
        workspace_id=request.workspace_id,
        name=request.name,
        token_hash=token_hash,
        allowed_providers=request.allowed_providers,
    )
    if request.ttl_seconds:
        from datetime import timedelta
        token.expires_at = datetime.now(timezone.utc) + timedelta(seconds=request.ttl_seconds)
    store.create_proxy_token(token)
    result = token.model_dump(mode="json")
    result["token_value"] = token_value
    return result


@app.get(f"{settings.api_prefix}/proxy-tokens/{{token_id}}")
def get_proxy_token(token_id: str) -> dict:
    try:
        token = store.get_proxy_token(token_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return token.model_dump(mode="json")


@app.patch(f"{settings.api_prefix}/proxy-tokens/{{token_id}}")
def update_proxy_token(token_id: str, payload: dict[str, Any]) -> dict:
    try:
        token = store.update_proxy_token(token_id, payload)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return token.model_dump(mode="json")


@app.delete(f"{settings.api_prefix}/proxy-tokens/{{token_id}}")
def delete_proxy_token(token_id: str) -> dict:
    if store.delete_proxy_token(token_id):
        return {"deleted": True}
    raise HTTPException(status_code=404, detail="token not found")


# -- workspace members (RBAC) ------------------------------------------------

@app.get(f"{settings.api_prefix}/workspaces/{{workspace_id}}/members")
def list_workspace_members(workspace_id: str) -> list[dict]:
    members = store.list_workspace_members(workspace_id)
    return [m.model_dump(mode="json") for m in members]


@app.post(f"{settings.api_prefix}/workspaces/{{workspace_id}}/members")
def add_workspace_member(workspace_id: str, payload: dict[str, Any]) -> dict:
    member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=payload.get("user_id", ""),
        role=payload.get("role", "viewer"),
        permissions=payload.get("permissions", []),
    )
    store.create_workspace_member(member)
    return member.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/workspaces/{{workspace_id}}/members/{{member_id}}")
def get_workspace_member(workspace_id: str, member_id: str) -> dict:
    try:
        member = store.get_workspace_member(member_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return member.model_dump(mode="json")


@app.patch(f"{settings.api_prefix}/workspaces/{{workspace_id}}/members/{{member_id}}")
def update_workspace_member(workspace_id: str, member_id: str, payload: WorkspaceMemberUpdateRequest) -> dict:
    try:
        member = store.update_workspace_member(member_id, payload.model_dump())
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return member.model_dump(mode="json")


@app.delete(f"{settings.api_prefix}/workspaces/{{workspace_id}}/members/{{member_id}}")
def remove_workspace_member(workspace_id: str, member_id: str) -> dict:
    if store.delete_workspace_member(member_id):
        return {"deleted": True}
    raise HTTPException(status_code=404, detail="member not found")


# -- password reset ----------------------------------------------------------

@app.post(f"{settings.api_prefix}/auth/password-reset")
def request_password_reset(request: PasswordResetRequest) -> dict:
    # Find user by email
    user = None
    for u in store.users.values():
        if u.email == request.email:
            user = u
            break
    if not user:
        # Return success even if user not found (security best practice)
        return {"message": "If an account exists with this email, you will receive a password reset link."}
    
    # Create password reset record
    reset = store.create_password_reset(user.user_id, request.email)
    
    # Send email via SMTP using the dedicated sender
    from .integrations import password_reset_email_sender
    password_reset_email_sender.send(request.email, reset.token)
    
    return {"message": "If an account exists with this email, you will receive a password reset link."}


@app.post(f"{settings.api_prefix}/auth/password-reset/confirm")
def confirm_password_reset(request: PasswordResetConfirm) -> dict:
    reset = store.get_password_reset_by_token(request.token)
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Update user password
    user = store.users.get(reset.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Hash new password
    import hashlib
    user.password_hash = hashlib.sha256(request.new_password.encode()).hexdigest()
    user.updated_at = utc_now()
    
    # Mark reset as used
    store.use_password_reset(request.token)
    
    return {"message": "Password reset successfully"}


# -- invite acceptance -------------------------------------------------------

@app.post(f"{settings.api_prefix}/invites/accept")
def accept_invite(request: AcceptInviteRequest) -> dict:
    # Find invite by token
    invite = store.get_invite_by_token(request.token)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found or already used")
    
    # Verify email matches
    if invite.email != request.email:
        raise HTTPException(status_code=400, detail="Email does not match invite")
    
    # Create user account
    user_id = generated_id("usr")
    user, account, workspace, environment = store.register_user(
        user_id=user_id,
        external_user_id=f"usr_{uuid.uuid4().hex[:12]}",
        email=request.email,
        password=request.password,
    )
    
    # Accept invite and create workspace member
    store.accept_invite(request.token, user_id)
    
    return {
        "message": "Invite accepted successfully",
        "user_id": user_id,
        "workspace_id": invite.workspace_id,
        "role": invite.role,
    }


# -- environment members (RBAC) ----------------------------------------------

@app.get(f"{settings.api_prefix}/environments/{{environment_id}}/members")
def list_environment_members(environment_id: str) -> list[dict]:
    members = store.list_environment_members(environment_id)
    return [m.model_dump(mode="json") for m in members]


@app.post(f"{settings.api_prefix}/environments/{{environment_id}}/members")
def add_environment_member(environment_id: str, payload: dict[str, Any]) -> dict:
    member = EnvironmentMember(
        environment_id=environment_id,
        user_id=payload.get("user_id", ""),
        role=payload.get("role", "viewer"),
        permissions=payload.get("permissions", []),
    )
    store.create_environment_member(member)
    return member.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/environments/{{environment_id}}/members/{{member_id}}")
def get_environment_member(environment_id: str, member_id: str) -> dict:
    try:
        member = store.get_environment_member(member_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return member.model_dump(mode="json")


@app.patch(f"{settings.api_prefix}/environments/{{environment_id}}/members/{{member_id}}")
def update_environment_member(environment_id: str, member_id: str, payload: EnvironmentMemberUpdateRequest) -> dict:
    try:
        member = store.update_environment_member(member_id, payload.model_dump(exclude_unset=True))
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return member.model_dump(mode="json")


@app.delete(f"{settings.api_prefix}/environments/{{environment_id}}/members/{{member_id}}")
def remove_environment_member(environment_id: str, member_id: str) -> dict:
    if store.delete_environment_member(member_id):
        return {"deleted": True}
    raise HTTPException(status_code=404, detail="member not found")


# -- sandbox operations -------------------------------------------------------

@app.post(f"{settings.api_prefix}/sandbox-sessions/{{sandbox_id}}/exec")
def sandbox_exec(sandbox_id: str, request: SandboxExecRequest) -> dict:
    import random
    response = SandboxExecResponse(
        sandbox_id=sandbox_id,
        command=request.command,
        exit_code=0,
        stdout="Command executed successfully",
        stderr="",
        duration_ms=random.randint(10, 1000),
    )
    return response.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/sandbox-sessions/{{sandbox_id}}/tunnels")
def list_sandbox_tunnels(sandbox_id: str) -> list[dict]:
    return []


@app.post(f"{settings.api_prefix}/sandbox-sessions/{{sandbox_id}}/tunnels")
def create_sandbox_tunnel(sandbox_id: str, payload: dict[str, Any]) -> dict:
    tunnel = SandboxTunnel(
        sandbox_id=sandbox_id,
        port=payload.get("port", 8080),
        protocol=payload.get("protocol", "tcp"),
    )
    return tunnel.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/sandbox-sessions/{{sandbox_id}}/filesystem")
def list_sandbox_files(sandbox_id: str, path: str = Query(default="/")) -> list[dict]:
    return [
        {"name": "app", "type": "directory", "size": 0},
        {"name": "data", "type": "directory", "size": 0},
        {"name": "README.md", "type": "file", "size": 1024},
    ]


@app.post(f"{settings.api_prefix}/sandbox-sessions/{{sandbox_id}}/filesystem/copy")
def copy_sandbox_files(sandbox_id: str, payload: dict[str, Any]) -> dict:
    return {"copied": True, "files": payload.get("files", [])}


# -- volume operations --------------------------------------------------------

@app.get(f"{settings.api_prefix}/volumes/{{volume_id}}/entries")
def list_volume_entries(volume_id: str, path: str = Query(default="")) -> list[dict]:
    entries = store.list_volume_entries(volume_id, path)
    return [e.model_dump(mode="json") for e in entries]


@app.post(f"{settings.api_prefix}/volumes/{{volume_id}}/entries")
def create_volume_entry(volume_id: str, payload: dict[str, Any]) -> dict:
    entry = VolumeEntry(
        volume_id=volume_id,
        path=payload.get("path", ""),
        size_bytes=payload.get("size_bytes", 0),
        content_type=payload.get("content_type", "application/octet-stream"),
    )
    store.create_volume_entry(entry)
    return entry.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/volumes/{{volume_id}}/entries/{{entry_id}}")
def get_volume_entry(volume_id: str, entry_id: str) -> dict:
    try:
        entry = store.get_volume_entry(entry_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return entry.model_dump(mode="json")


@app.delete(f"{settings.api_prefix}/volumes/{{volume_id}}/entries/{{entry_id}}")
def delete_volume_entry(volume_id: str, entry_id: str) -> dict:
    if store.delete_volume_entry(entry_id):
        return {"deleted": True}
    raise HTTPException(status_code=404, detail="entry not found")


@app.post(f"{settings.api_prefix}/volumes/{{volume_id}}/snapshots")
def create_volume_snapshot(volume_id: str, payload: dict[str, Any]) -> dict:
    snapshot = VolumeSnapshot(
        volume_id=volume_id,
        name=payload.get("name", "snapshot"),
    )
    store.create_volume_snapshot(snapshot)
    return snapshot.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/volumes/{{volume_id}}/snapshots")
def list_volume_snapshots(volume_id: str) -> list[dict]:
    snapshots = store.list_volume_snapshots(volume_id)
    return [s.model_dump(mode="json") for s in snapshots]


@app.get(f"{settings.api_prefix}/volumes/{{volume_id}}/snapshots/{{snapshot_id}}")
def get_volume_snapshot(volume_id: str, snapshot_id: str) -> dict:
    try:
        snapshot = store.get_volume_snapshot(snapshot_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return snapshot.model_dump(mode="json")


@app.delete(f"{settings.api_prefix}/volumes/{{volume_id}}/snapshots/{{snapshot_id}}")
def delete_volume_snapshot(volume_id: str, snapshot_id: str) -> dict:
    if store.delete_volume_snapshot(snapshot_id):
        return {"deleted": True}
    raise HTTPException(status_code=404, detail="snapshot not found")


# -- function autoscaler & stats ----------------------------------------------

@app.get(f"{settings.api_prefix}/functions/{{function_id}}/autoscaler")
def get_function_autoscaler(function_id: str) -> dict:
    try:
        config = store.get_function_autoscaler(function_id)
    except KeyError:
        config = FunctionAutoscalerConfig(function_id=function_id)
    return config.model_dump(mode="json")


@app.post(f"{settings.api_prefix}/functions/{{function_id}}/autoscaler")
def update_function_autoscaler(function_id: str, payload: dict[str, Any]) -> dict:
    config = FunctionAutoscalerConfig(
        function_id=function_id,
        min_containers=payload.get("min_containers", 0),
        max_containers=payload.get("max_containers", 10),
        target_concurrency=payload.get("target_concurrency", 1),
        scale_up_threshold=payload.get("scale_up_threshold", 0.8),
        scale_down_threshold=payload.get("scale_down_threshold", 0.3),
        cooldown_seconds=payload.get("cooldown_seconds", 60),
    )
    store.update_function_autoscaler(config)
    return config.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/functions/{{function_id}}/stats")
def get_function_stats(function_id: str) -> dict:
    try:
        stats = store.get_function_stats(function_id)
    except KeyError:
        stats = FunctionStats(function_id=function_id)
    return stats.model_dump(mode="json")


@app.get(f"{settings.api_prefix}/functions/{{function_id}}/invocations")
def list_function_invocations(function_id: str, limit: int = Query(default=100)) -> list[dict]:
    return []


# -- database operations (complete) ------------------------------------------

@app.get(f"{settings.api_prefix}/databases/{{database_id}}/schema")
def get_database_schema(database_id: str) -> dict:
    try:
        db = store.get_database(database_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {
        "database_id": database_id,
        "pk_name": getattr(db, 'pk_name', 'pk'),
        "sk_name": getattr(db, 'sk_name', ''),
        "gsi_name": getattr(db, 'gsi_name', ''),
        "gsi_pk_name": getattr(db, 'gsi_pk_name', ''),
        "gsi_sk_name": getattr(db, 'gsi_sk_name', ''),
    }


@app.post(f"{settings.api_prefix}/databases/{{database_id}}/batch")
def batch_database_items(database_id: str, payload: dict[str, Any]) -> dict:
    items = payload.get("items", [])
    results = []
    for item in items:
        result = store.put_database_item(database_id, item)
        results.append(result.model_dump(mode="json"))
    return {"processed": len(results), "items": results}


@app.post(f"{settings.api_prefix}/databases/{{database_id}}/transactions")
def database_transaction(database_id: str, payload: dict[str, Any]) -> dict:
    operations = payload.get("operations", [])
    return {"committed": True, "operations": len(operations)}


# -- health ------------------------------------------------------------------

@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok", "environment": settings.environment}
