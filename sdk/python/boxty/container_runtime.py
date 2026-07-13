"""Boxty container runtime shim.

This module is baked into deployed images. It exposes two HTTP endpoints on
port 8000:

* POST /invoke/{function_name}   - invoke a function with a JSON payload
* GET  /health                   - readiness probe
* any other method               - proxied to the user-defined web endpoint

When the container starts, BOXTY_APP_MODULE and BOXTY_FUNCTION_NAME or
BOXTY_ENDPOINT_NAME determine what to run.
"""
from __future__ import annotations

import importlib.util
import inspect
import json
import os
import socket
import sys
import threading
import time
import traceback
from typing import Any

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse, PlainTextResponse


app = FastAPI()

MODULE_PATH = os.environ.get("BOXTY_APP_MODULE", "/app/user_app.py")
FUNCTION_NAME = os.environ.get("BOXTY_FUNCTION_NAME", "")
ENDPOINT_NAME = os.environ.get("BOXTY_ENDPOINT_NAME", "")


def _load_module(path: str):
    sys.path.insert(0, os.path.dirname(path))
    spec = importlib.util.spec_from_file_location("boxty_user_app", path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Could not load module from {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _find_app(module):
    from boxty import App

    for _, obj in inspect.getmembers(module, lambda x: isinstance(x, App)):
        return obj
    return None


def _execute_function(fn_def, payload: Any) -> dict[str, Any]:
    try:
        sig = inspect.signature(fn_def.func)
        if payload is None or payload == {}:
            result = fn_def.func()
        elif len(sig.parameters) == 1 and isinstance(payload, dict):
            result = fn_def.func(**payload)
        elif len(sig.parameters) == 1:
            result = fn_def.func(payload)
        else:
            result = fn_def.func(**payload)
        return {"return_code": 0, "stdout": json.dumps(result, default=str), "stderr": ""}
    except Exception as exc:
        return {
            "return_code": 1,
            "stdout": "",
            "stderr": f"{exc}\n{traceback.format_exc()}",
        }


@app.post("/invoke/{function_name}")
async def invoke_function(function_name: str, request: Request):
    payload = await request.json()
    module = _load_module(MODULE_PATH)
    boxty_app = _find_app(module)
    if boxty_app is None:
        return JSONResponse(
            status_code=500,
            content={"return_code": 1, "stderr": "No boxty.App found in module"},
        )
    fn_def = None
    for f in boxty_app._functions:
        if f.name == function_name:
            fn_def = f
            break
    if fn_def is None:
        return JSONResponse(
            status_code=404,
            content={"return_code": 1, "stderr": f"Function {function_name} not found"},
        )
    return JSONResponse(_execute_function(fn_def, payload.get("payload")))


@app.get("/health")
async def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Web endpoint reverse proxy
# ---------------------------------------------------------------------------


def _start_user_endpoint(boxty_app, endpoint_name: str) -> int:
    """Start the user-defined endpoint in a background thread and return its port."""
    ep_def = None
    for ep in boxty_app._endpoints:
        if ep.name == endpoint_name:
            ep_def = ep
            break
    if ep_def is None:
        raise RuntimeError(f"Endpoint {endpoint_name} not found in app")

    # Bind a local port for the user server
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()

    # Inject an environment variable so the user's server can listen on the chosen port
    os.environ["BOXTY_ENDPOINT_PORT"] = str(port)

    def run():
        try:
            ep_def.func()
        except Exception as exc:
            print(f"User endpoint {endpoint_name} crashed: {exc}", file=sys.stderr)

    t = threading.Thread(target=run, daemon=True, name=f"boxty-ep-{endpoint_name}")
    t.start()

    # Wait for the user server to accept connections
    deadline = time.time() + 30
    while time.time() < deadline:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=1):
                return port
        except Exception:
            time.sleep(0.2)
    raise RuntimeError(f"Timeout waiting for endpoint {endpoint_name} to start on port {port}")


_USER_ENDPOINT_PORT: int | None = None


@app.on_event("startup")
async def startup_event():
    global _USER_ENDPOINT_PORT
    if ENDPOINT_NAME:
        module = _load_module(MODULE_PATH)
        boxty_app = _find_app(module)
        if boxty_app is None:
            raise RuntimeError("No boxty.App found in module")
        _USER_ENDPOINT_PORT = _start_user_endpoint(boxty_app, ENDPOINT_NAME)


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
async def proxy_to_endpoint(request: Request, path: str):
    if not _USER_ENDPOINT_PORT:
        return PlainTextResponse("No endpoint configured", status_code=500)

    target_url = f"http://127.0.0.1:{_USER_ENDPOINT_PORT}/{path}"
    method = request.method
    headers = dict(request.headers)
    headers.pop("host", None)

    body = await request.body()
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            upstream = await client.request(method, target_url, headers=headers, content=body, params=request.query_params)
            content = await upstream.aread()
    except Exception as exc:
        return PlainTextResponse(f"Upstream error: {exc}", status_code=502)

    response_headers = dict(upstream.headers)
    response_headers.pop("content-encoding", None)
    response_headers.pop("transfer-encoding", None)
    response_headers.pop("content-length", None)
    return Response(
        content=content,
        status_code=upstream.status_code,
        headers=response_headers,
        media_type=upstream.headers.get("content-type"),
    )


def main():
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
