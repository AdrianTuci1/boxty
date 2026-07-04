# Boxty SDK Testing Checklist

This checklist maps the public API documented in `web/src/docs` to the actual SDK implementations in `sdk/python/` and `sdk/js/`. Each item should be verified either by import/usage test or by a runnable script.

## Python SDK (`sdk/python/boxty`)

### Core public API availability
- [ ] `import boxty` succeeds.
- [ ] `boxty.App` exists and can be instantiated with a name.
- [ ] `boxty.App` supports decorators: `.function()`, `.web_endpoint()`, `.local_entrypoint()`, `.cls()`, `.server()`.
- [ ] `boxty.Image` exists and supports documented helpers (`debian_slim`, `from_registry`, `pip_install`, `run_commands`, etc.).
- [ ] `boxty.Volume` exists with `from_name` and `persisted` constructors.
- [ ] `boxty.Secret` exists with `from_name` and `.set_env()` / `.set_value()` helpers.
- [ ] `boxty.Mount` exists with `from_local_dir` constructor.
- [ ] `boxty.Database` exists (exported in `__init__.py`).
- [ ] `boxty.Client` alias for `Boxty` works.

### Boxty client (HTTP)
- [ ] `boxty.Boxty(base_url=...)` instantiates and creates an `httpx.Client`.
- [ ] Sub-clients are accessible: `client.secrets`, `client.volumes`, `client.databases`.
- [ ] Auth/workspace methods work: `signup`, `balance`, `workspaces`, `create_workspace`, `create_environment`, `environments`, `api_keys`, `create_api_key`.
- [ ] Workload creation: `create_workload`, `create_sandbox`, `list_workloads`, `create_sandbox_session`.
- [ ] Utility: `state()`, `pricing()`, `meter_usage()`.

### Secrets client (`sdk/python/boxty/secrets.py`)
- [ ] `client.secrets.create(workspace_id, name, values)` works.
- [ ] `client.secrets.list(workspace_id)` works.
- [ ] `client.secrets.get(name)` works.
- [ ] `client.secrets.delete(name)` works.
- [ ] `client.secrets.set_env(name, env_var)` works.

### Volumes client (`sdk/python/boxty/volumes.py`)
- [ ] `client.volumes.create(workspace_id, name, size_gb, ...)` works.
- [ ] `client.volumes.list(workspace_id)` works.
- [ ] `client.volumes.get(name)` works.
- [ ] `client.volumes.delete(name)` works.
- [ ] `client.volumes.upload_file`, `download_file`, `list_files`, `delete_file` work.

### Databases client (`sdk/python/boxty/databases.py`)
- [ ] `client.databases.create(...)` works.
- [ ] `client.databases.list(...)` works.
- [ ] `client.databases.get(name)` works.
- [ ] `client.databases.delete(name)` works.

### App decorators and manifest
- [ ] `@app.function()` registers a function with no args.
- [ ] `@app.function(image=..., volumes=..., secrets=..., mounts=..., cpu=..., memory=..., timeout=..., retries=...)` registers with options.
- [ ] `@app.web_endpoint(method=..., port=...)` registers a web endpoint.
- [ ] `@app.local_entrypoint()` registers a local entrypoint.
- [ ] `@app.cls()` registers a class with methods.
- [ ] `@app.server()` registers a server workload.
- [ ] `App.to_manifest()` produces a serializable deployment manifest.
- [ ] `App.lookup_function()` and `App.lookup_class()` resolve names.
- [ ] `App.run()` context manager works for ephemeral execution.
- [ ] `Function.remote(...)` and `Function.spawn(...)` helpers work.
- [ ] `Image.debian_slim().pip_install(...)` chains correctly.
- [ ] `Volume` and `Mount` `to_manifest()` produce expected keys.
- [ ] `Secret` `set_env`/`set_value` produce expected manifest keys.

### Python SDK packaging
- [ ] `pip install -e sdk/python` succeeds.
- [ ] `python -c "import boxty; print(boxty.__version__)"` succeeds.
- [ ] `python -m pytest sdk/python/tests` passes (if tests exist).
- [ ] `python -m build sdk/python` succeeds.
- [ ] No import errors or undefined names in the package.

## JavaScript SDK (`sdk/js`)

### Package availability
- [ ] `sdk/js/package.json` exists and is valid JSON.
- [ ] `npm install` (or `npm ci`) succeeds in `sdk/js`.
- [ ] `import { Boxty } from '@boxty/sdk'` or equivalent entry point works.
- [ ] TypeScript declarations (`index.d.ts`) match exported symbols.

### Public API
- [ ] `Boxty` client class can be instantiated with `baseURL` and `apiKey`.
- [ ] `boxty.secrets.create/list/get/delete` work.
- [ ] `boxty.volumes.create/list/get/delete` work.
- [ ] `boxty.workspaces.create/list` work.
- [ ] `boxty.createWorkload(...)` / `boxty.createSandbox(...)` work.
- [ ] `boxty.listWorkloads()` works.
- [ ] `boxty.state()` works.

### JS SDK packaging
- [ ] `npm run build` succeeds (if script defined).
- [ ] `tsc --noEmit` passes (if tsconfig exists).
- [ ] No stale references to non-existent modules.

## Cross-SDK consistency
- [ ] Python and JS SDKs use the same endpoint paths (`/v1/*`).
- [ ] Both honor `BOXTY_API_URL` / `BOXTY_TOKEN` environment variables.
- [ ] Both expose sub-clients with matching names (`secrets`, `volumes`, `databases`).
- [ ] Manifest keys in `App.to_manifest()` match the control plane API contract.

## Documentation parity
- [ ] Every class/function referenced in `web/src/docs/reference/*.md` has a corresponding implementation in Python SDK or JS SDK.
- [ ] No documented symbols are missing from `sdk/python/boxty/__init__.py` exports.
- [ ] `web/src/docs/test.md` examples can be executed or verified syntactically.
