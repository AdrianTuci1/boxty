# Prompt: End-to-end test of every Boxty guide workflow on the contaboparrot VPS

## Your goal

Test whether the workflows described in the `web/src/docs/guide/` directory of the `AdrianTuci1/boxty` repository can really be executed end-to-end on this VPS. You must create real `.py` files from the guide snippets, run them with the Python SDK and the `boxty` CLI, and produce a clear `TEST_REPORT.md`.

## Inputs you will receive from the user

1. A GitHub Personal Access Token (PAT).
2. The instruction to clone the repo (the user will do this themselves, but if they ask you to do it, use `git clone https://<PAT>@github.com/AdrianTuci1/boxty.git`).

## Working directory

Use `~/boxty` as the project root. Create a test folder at `~/boxty/e2e-tests/`.

## 1. Environment setup

Run all of this before testing the guides:

1. Make sure Python 3.11+ is available (`python3 --version`).
2. Install the control plane:
   ```bash
   cd ~/boxty/control_plane
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -e .
   ```
3. Install the Python SDK:
   ```bash
   cd ~/boxty/sdk/python
   pip install -e .
   ```
4. Install the Python CLI (`boxty`):
   ```bash
   cd ~/boxty/cli
   pip install -e .
   ```
5. Expose these environment variables for every shell/process you use:
   ```bash
   export BOXTY_API_URL=http://127.0.0.1:3000
   export BOXTY_GATEWAY_URL=http://127.0.0.1:3000
   export BOXTY_CONTROL_PLANE_URL=http://127.0.0.1:3000
   ```
6. Start the control plane in the background (in-memory state is fine):
   ```bash
   cd ~/boxty/control_plane
   source .venv/bin/activate
   uvicorn app.main:app --host 127.0.0.1 --port 3000
   ```
   Verify it with:
   ```bash
   curl -fsS http://127.0.0.1:3000/healthz
   ```

## 2. Local worker (optional but strongly recommended)

If Docker is installed and working on the VPS, also start a local provider/worker so function, endpoint, and sandbox workloads can actually execute:

1. Register a provider:
   ```bash
   cd ~/boxty/control_plane
   source .venv/bin/activate
   boxty-worker register \
     --provider-name vps-test \
     --region eu-central \
     --pool general \
     --cpu 4 \
     --memory-mb 8192 \
     --disk-gb 50 \
     --supports-endpoints
   ```
   Save the returned `provider_id` and `provider_token`.

2. In a second persistent shell, run the worker daemon:
   ```bash
   cd ~/boxty/control_plane
   source .venv/bin/activate
   boxty-worker run-daemon \
     --provider-id <provider_id> \
     --provider-token <provider_token> \
     --available-slots 2
   ```

If Docker is missing or the worker cannot start, note this in the report and continue testing only the API/client/CLI workflows that do not require a running provider.

## 3. Authentication

Create a test user once and reuse the token:

```bash
curl -X POST http://127.0.0.1:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"external_user_id":"hermes-test-user","email":"hermes-test@example.com"}'
```

Save the returned `access_token` and the default `workspace_id` / `environment_id`. Configure the CLI:

```bash
boxty config set api_url http://127.0.0.1:3000
boxty config set token <access_token>
boxty workspace switch <workspace_id>
boxty env switch <environment_id>
```

Also keep the token in the environment if you run Python scripts directly:
```bash
export BOXTY_TOKEN=<access_token>
```

## 4. Guide testing loop

For **every** `*.md` file in `~/boxty/web/src/docs/guide/`:

1. Read the file.
2. Extract every code block.
3. For Python SDK/App snippets:
   - Create a standalone, runnable `.py` file under `~/boxty/e2e-tests/guide/<doc-name>/`.
   - Name it `test_<n>.py` where `<n>` is the snippet order in the doc.
   - Make sure the file imports `boxty`, sets an `App` name, and uses the correct `BOXTY_GATEWAY_URL` / `BOXTY_TOKEN`.
   - Run it with `python test_<n>.py`.
4. For CLI command snippets:
   - Run them verbatim after the needed Python files have been deployed.
   - Prefix `BOXTY_API_URL=http://127.0.0.1:3000` if needed.
5. For docs that describe purely UI/dashboard actions (e.g., clicking in Settings), use either:
   - The equivalent API/CLI command, or
   - A headless browser (Playwright / Puppeteer) if available, or
   - Mark the step as `UI_ONLY` and explain what you verified.
6. For docs that require external services (GPU, multi-node training, RunPod, S3/R2, Stripe, custom domains, production DNS, etc.), mark them `SKIPPED` with a short justification. Do not try to provision real cloud resources.
7. For docs that describe APIs or decorators that differ from the current SDK/CLI (e.g., `@app.endpoint()` vs `@app.web_endpoint()`, `boxty run` vs `python app.py`), adapt the snippet to the nearest equivalent implementation and record the adaptation in the report.
8. For each doc record in the report:
   - Doc file path.
   - Number of snippets tested / skipped / failed.
   - Exact commands you ran.
   - Output, errors, or HTTP status codes.
   - Resource IDs created (workloads, volumes, secrets, routes, schedules, etc.).

## 5. Web dashboard sanity check (optional)

If Node.js is available:

1. Install and start the dev frontend:
   ```bash
   cd ~/boxty/web
   npm install
   npm run dev
   ```
2. With a headless browser or `curl`, verify that `http://localhost:5173` loads and that the `/apps/<workspace>/<environment>` route is reachable after you set the token in `localStorage` (or use the dev auth skip if supported).
3. If no headless browser is available, simply capture the output of `curl -I http://localhost:5173` and note it in the report.

## 6. Cleanup

After each doc, delete created resources so the next test starts fresh. Do **not** stop the control plane until the entire report is written.

## 7. Deliverables

At the end you must leave on the VPS:

1. `~/boxty/e2e-tests/TEST_REPORT.md` containing:
   - Executive summary: total docs, snippets, pass/fail/skip counts.
   - Per-doc results with command/output excerpts.
   - Environment details: OS, Python version, Docker availability, backend port, worker status.
   - A final verdict: which workflows are fully achievable, which are blocked, and why.
2. All generated `~/boxty/e2e-tests/guide/**/*.py` files.
3. A short terminal message to the user summarizing the verdict and the path to the report.

## Rules

- Do not push anything to GitHub.
- Do not delete the `~/boxty` repository.
- Do not run tests against a production deployment.
- If something is genuinely impossible on this VPS, document it clearly rather than failing silently.
- Prefer concrete commands and captured output over prose.
