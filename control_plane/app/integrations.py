from __future__ import annotations

import mimetypes
from pathlib import Path
import smtplib
from email.message import EmailMessage
from typing import Any, Iterable

from .config import settings
from .models import InviteRecord, SingleTableItem


class DynamoSingleTableMirror:
    def __init__(self) -> None:
        self.enabled = (
            settings.state_store == "dynamodb-single-table"
            and bool(settings.dynamodb_table_name)
        )

    def _table(self):
        if not self.enabled:
            return None
        import boto3  # type: ignore

        dynamodb = boto3.resource("dynamodb", region_name=settings.dynamodb_region)
        return dynamodb.Table(settings.dynamodb_table_name)

    def put_item(self, item: SingleTableItem) -> None:
        table = self._table()
        if table is None:
            return
        table.put_item(
            Item={
                "pk": item.pk,
                "sk": item.sk,
                "entity_type": item.entity_type,
                **item.attributes,
            }
        )

    def put_items(self, items: Iterable[SingleTableItem]) -> None:
        table = self._table()
        if table is None:
            return
        with table.batch_writer() as batch:
            for item in items:
                batch.put_item(
                    Item={
                        "pk": item.pk,
                        "sk": item.sk,
                        "entity_type": item.entity_type,
                        **item.attributes,
                    }
                )

    def delete_item(self, pk: str, sk: str) -> None:
        table = self._table()
        if table is None:
            return
        table.delete_item(Key={"pk": pk, "sk": sk})

    def scan_all(self) -> list[dict[str, Any]]:
        table = self._table()
        if table is None:
            return []
        items: list[dict[str, Any]] = []
        response = table.scan()
        items.extend(response.get("Items", []))
        while "LastEvaluatedKey" in response:
            response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
            items.extend(response.get("Items", []))
        return items


class InviteEmailSender:
    def __init__(self) -> None:
        self.provider = settings.invite_email_provider

    def _send_smtp(self, to: str, subject: str, body: str) -> None:
        if not settings.smtp_host:
            return
        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = settings.invite_email_from
        message["To"] = to
        message.set_content(body)
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as smtp:
            smtp.starttls()
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)

    def send(self, invite: InviteRecord, workspace_name: str) -> None:
        subject = f"Invitation to Boxty workspace {workspace_name}"
        body = (
            f"You were invited to join workspace '{workspace_name}'.\n\n"
            f"Click the link below to accept the invitation:\n"
            f"{settings.api_base_url or 'https://boxty.dev'}/accept-invite?token={invite.token}\n\n"
            f"Role: {invite.role}\n"
            f"If you don't have an account yet, you'll be able to create one after clicking the link.\n"
        )
        if self.provider == "smtp" and settings.smtp_host:
            self._send_smtp(invite.email, subject, body)
            return

        print(f"[InviteEmail] to={invite.email} subject={subject}\n{body}")


class PasswordResetEmailSender:
    def __init__(self) -> None:
        self.provider = settings.invite_email_provider

    def _send_smtp(self, to: str, subject: str, body: str) -> None:
        if not settings.smtp_host:
            return
        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = settings.invite_email_from
        message["To"] = to
        message.set_content(body)
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as smtp:
            smtp.starttls()
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)

    def send(self, email: str, token: str) -> None:
        subject = "Reset your Boxty password"
        reset_url = f"{settings.api_base_url or 'https://boxty.dev'}/password-reset?token={token}"
        body = (
            f"You requested a password reset for your Boxty account.\n\n"
            f"Click the link below to reset your password:\n"
            f"{reset_url}\n\n"
            f"This link will expire in 1 hour.\n"
            f"If you did not request this reset, please ignore this email.\n"
        )
        if self.provider == "smtp" and settings.smtp_host:
            self._send_smtp(email, subject, body)
            return

        print(f"[PasswordResetEmail] to={email} subject={subject}\n{body}")


class CloudflareR2StorageClient:
    def __init__(self) -> None:
        self.enabled = (
            settings.object_storage_provider == "cloudflare-r2"
            and bool(settings.r2_bucket)
            and bool(settings.r2_access_key_id)
        )

    def _client(self):
        if not self.enabled:
            return None
        import boto3  # type: ignore

        endpoint = f"https://{settings.r2_account_id}.r2.cloudflarestorage.com"
        return boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            region_name="auto",
        )

    def put_bytes(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> dict[str, str]:
        if settings.object_storage_provider == "filesystem":
            root = Path("/tmp/boxty-object-storage")
            path = root.joinpath(*key.split("/"))
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            return {"key": key, "url": str(path)}

        client = self._client()
        if client is None:
            raise RuntimeError("cloudflare r2 is not configured")
        client.put_object(Bucket=settings.r2_bucket, Key=key, Body=data, ContentType=content_type)
        public_base = settings.r2_public_base_url.rstrip("/")
        return {"key": key, "url": f"{public_base}/{key}" if public_base else key}

    def get_bytes(self, key: str) -> bytes:
        if settings.object_storage_provider == "filesystem":
            root = Path("/tmp/boxty-object-storage")
            path = root.joinpath(*key.split("/"))
            return path.read_bytes()

        client = self._client()
        if client is None:
            raise RuntimeError("cloudflare r2 is not configured")
        response = client.get_object(Bucket=settings.r2_bucket, Key=key)
        return response["Body"].read()

    def delete_key(self, key: str) -> None:
        if settings.object_storage_provider == "filesystem":
            root = Path("/tmp/boxty-object-storage")
            path = root.joinpath(*key.split("/"))
            if path.exists():
                path.unlink()
            return

        client = self._client()
        if client is None:
            raise RuntimeError("cloudflare r2 is not configured")
        client.delete_object(Bucket=settings.r2_bucket, Key=key)

    def list_keys(self, prefix: str) -> list[dict[str, object]]:
        if settings.object_storage_provider == "filesystem":
            root = Path("/tmp/boxty-object-storage")
            start = root.joinpath(*prefix.split("/")) if prefix else root
            if not start.exists():
                return []
            entries: list[dict[str, object]] = []
            for path in start.rglob("*"):
                if path.is_file():
                    rel = path.relative_to(root).as_posix()
                    content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
                    entries.append({"key": rel, "size": path.stat().st_size, "content_type": content_type})
            return sorted(entries, key=lambda item: str(item["key"]))

        client = self._client()
        if client is None:
            raise RuntimeError("cloudflare r2 is not configured")
        response = client.list_objects_v2(Bucket=settings.r2_bucket, Prefix=prefix)
        output = []
        for entry in response.get("Contents", []):
            output.append(
                {
                    "key": entry.get("Key", ""),
                    "size": int(entry.get("Size", 0)),
                    "content_type": mimetypes.guess_type(str(entry.get("Key", "")))[0] or "application/octet-stream",
                }
            )
        return output


dynamo_mirror = DynamoSingleTableMirror()
invite_email_sender = InviteEmailSender()
password_reset_email_sender = PasswordResetEmailSender()
r2_storage_client = CloudflareR2StorageClient()
