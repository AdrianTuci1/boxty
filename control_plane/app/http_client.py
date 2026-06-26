from __future__ import annotations

import json
import os
from typing import Any
from urllib import error, parse, request


def base_url() -> str:
    return os.environ.get("BOXTY_CONTROL_PLANE_URL", "http://127.0.0.1:8000").rstrip("/")


def call_api(
    method: str,
    path: str,
    payload: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
) -> Any:
    body = None
    request_headers = {"Accept": "application/json"}
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        request_headers["Content-Type"] = "application/json"
    if headers:
        request_headers.update(headers)

    req = request.Request(
        f"{base_url()}{path}",
        data=body,
        headers=request_headers,
        method=method.upper(),
    )
    try:
        with request.urlopen(req) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{exc.code} {exc.reason}: {detail}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"failed to reach control plane: {exc.reason}") from exc


def json_dump(data: Any) -> str:
    return json.dumps(data, indent=2, sort_keys=True)
