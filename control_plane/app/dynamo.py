from __future__ import annotations

from .models import (
    AccountRecord,
    ApiKeyRecord,
    BillingHistoryRecord,
    EnvironmentRecord,
    InviteRecord,
    PaymentRecord,
    ProviderRecord,
    VolumeRecord,
    RouteRecord,
    SecretRecord,
    SingleTableItem,
    UserRecord,
    WorkloadRecord,
    WorkspaceRecord,
)


def user_item(user: UserRecord) -> SingleTableItem:
    return SingleTableItem(
        pk=f"USER#{user.user_id}",
        sk="PROFILE",
        entity_type="User",
        attributes=user.model_dump(mode="json"),
    )


def account_item(account: AccountRecord) -> SingleTableItem:
    return SingleTableItem(
        pk=f"USER#{account.user_id}",
        sk="ACCOUNT",
        entity_type="Account",
        attributes=account.model_dump(mode="json"),
    )


def workspace_item(workspace: WorkspaceRecord) -> SingleTableItem:
    return SingleTableItem(
        pk=f"WORKSPACE#{workspace.workspace_id}",
        sk="PROFILE",
        entity_type="Workspace",
        attributes=workspace.model_dump(mode="json"),
    )


def environment_item(environment: EnvironmentRecord) -> SingleTableItem:
    return SingleTableItem(
        pk=f"WORKSPACE#{environment.workspace_id}",
        sk=f"ENVIRONMENT#{environment.environment_id}",
        entity_type="Environment",
        attributes=environment.model_dump(mode="json"),
    )


def api_key_item(api_key: ApiKeyRecord) -> SingleTableItem:
    return SingleTableItem(
        pk=f"WORKSPACE#{api_key.workspace_id}",
        sk=f"APIKEY#{api_key.api_key_id}",
        entity_type="ApiKey",
        attributes=api_key.model_dump(mode="json"),
    )


def secret_item(secret: SecretRecord) -> SingleTableItem:
    return SingleTableItem(
        pk=f"WORKSPACE#{secret.workspace_id}",
        sk=f"SECRET#{secret.secret_id}",
        entity_type="Secret",
        attributes=secret.model_dump(mode="json"),
    )


def invite_item(invite: InviteRecord) -> SingleTableItem:
    return SingleTableItem(
        pk=f"WORKSPACE#{invite.workspace_id}",
        sk=f"INVITE#{invite.invite_id}",
        entity_type="Invite",
        attributes=invite.model_dump(mode="json"),
    )


def provider_item(provider: ProviderRecord) -> SingleTableItem:
    return SingleTableItem(
        pk=f"PROVIDER#{provider.provider_id}",
        sk="PROFILE",
        entity_type="Provider",
        attributes=provider.model_dump(mode="json"),
    )


def volume_item(volume: VolumeRecord) -> SingleTableItem:
    return SingleTableItem(
        pk=f"WORKSPACE#{volume.workspace_id}",
        sk=f"VOLUME#{volume.volume_id}",
        entity_type="Volume",
        attributes=volume.model_dump(mode="json"),
    )


def workload_item(workload: WorkloadRecord) -> SingleTableItem:
    return SingleTableItem(
        pk=f"WORKSPACE#{workload.workspace_id}",
        sk=f"WORKLOAD#{workload.workload_id}",
        entity_type="Workload",
        attributes=workload.model_dump(mode="json"),
    )


def route_item(route: RouteRecord) -> SingleTableItem:
    return SingleTableItem(
        pk=f"ROUTE#{route.route_id}",
        sk="PROFILE",
        entity_type="Route",
        attributes=route.model_dump(mode="json"),
    )


def payment_item(payment: PaymentRecord) -> SingleTableItem:
    return SingleTableItem(
        pk=f"USER#{payment.user_id}",
        sk=f"PAYMENT#{payment.payment_id}",
        entity_type="Payment",
        attributes=payment.model_dump(mode="json"),
    )


def billing_history_item(history: BillingHistoryRecord) -> SingleTableItem:
    return SingleTableItem(
        pk=f"USER#{history.user_id}",
        sk=f"BILLING_HISTORY#{history.history_id}",
        entity_type="BillingHistory",
        attributes=history.model_dump(mode="json"),
    )
