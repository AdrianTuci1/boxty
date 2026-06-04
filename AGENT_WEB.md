# Agent: Boxty Web UI (Frontend)

## Rol

Dashboard web pentru platforma Boxty — vizualizezi workspace-uri, App-uri, sandbox-uri, metrics, billing, logs. Similar cu Modal Dashboard.

## Director de lucru

`/Users/adriantucicovenco/Proiecte/boxty/web/`

## Tech Stack

- **Framework**: React 18+ (Vite) + TypeScript
- **Routing**: React Router v6
- **HTTP**: `fetch` + `react-query` (sau `@tanstack/react-query`)
- **UI**: Tailwind CSS + component library (shadcn/ui sau Headless UI)
- **Charts**: Recharts (CPU, memory, network, GPU metrics)
- **Auth**: JWT stocat în localStorage, Bearer header la API

## Pagini

### 1. Login/Register (`/login`, `/register`)

Form simplu email + parolă. După login, redirecționează la Dashboard.

### 2. Dashboard (`/dashboard`)

Prima pagină după login. Arată:
- **Active sandbox-uri** (card cu număr)
- **Active App-uri** (card cu număr)
- **Credit balance** (card)
- **CPU/Memory usage** în ultimele 24h (mini chart)
- **Ultimele sandbox-uri** (tabel scurt cu id, status, app, timp)
- **Quick actions**: creează sandbox, creează app, vezi billing

### 3. Workspace View (`/workspaces`, `/workspaces/:id`)

- Listă workspace-uri cu carduri (nume, nr environments, nr apps)
- Click pe workspace → detalii: environments (dev/staging/prod tabs)
- Click pe environment → App-urile din environment-ul respectiv
- Creează workspace (modal/dialog)

### 4. App View (`/apps/:id`)

Pagina principală pentru un App — exact ca Modal:

**Tabs:**
| Tab | Conținut |
|-----|----------|
| **Overview** | Status, URL, aggregated metrics (CPU, memory, network, GPU — Recharts), cost total, sandbox count |
| **Sandboxes** | Listă sandbox-uri din App (tabel: id, status, started_at, duration, CPU, memory, actions) |
| **Deployments** | Deployment history (versiune, image, timp, status, changelog) |
| **Metrics** | Grafice detaliate: CPU over time, Memory over time, Network RX/TX, GPU util |
| **Usage** | CPU hours, GPU hours, total cost per day/week/month |
| **Logs** | Aggregated logs (ultimele N linii din fiecare sandbox, tail în timp real via WebSocket) |

**Actions**:
- **Stop App** — oprește toate sandbox-urile active
- **Deploy** — modal: alege image nou, CPU, memory, GPU
- **Delete App** — șterge tot

### 5. Sandbox Detail (`/sandboxes/:id`)

**Header**: ID sandbox, status badge (running/stopped/snapshotted), URL, App link

**Metrics**:
- started_at, finished_at, boot_duration_ms
- CPU: max_pct, avg_pct (bar chart)
- Memory: max_mb, avg_mb (bar chart)
- Network: rx_bytes, tx_bytes (horizontal bar)
- GPU: util_pct, memory_mb (dacă există)

**Actions**:
- **Stop** — oprește sandbox-ul
- **Exec** — modal cu input de comandă, afișează stdout/stderr live
- **Forward port** — modal cu port number, arată URL-ul generat
- **Snapshot** — crează checkpoint

**Logs**: terminal-style output (stdout/stderr) cu tail în timp real via WebSocket (`wss://api.boxty.dev/ws/:sandboxId`)

### 6. Billing (`/billing`)

- Credit balance (big number)
- Buy credits (Stripe Checkout button)
- Usage history (tabel: dată, CPU hours, GPU hours, storage, cost)
- Usage chart (zile/săptămâni/luni)

### 7. Secrets (`/secrets`)

- Listă secrete (nume, created_at — NU valorile)
- Creează secret (modal: name + value, value e masked input)
- Șterge secret (confirmare)

### 8. Images (`/images`)

- Listă imagini build-ate (id, image_url, status, created_at)
- Build new image (modal: base_image + commands list + name)
- Șterge imagine

### 9. Schedules (`/schedules`)

- Listă scheduled jobs (nume, cron/period, next_run, status)
- Creează / editează / șterge
- Trigger manual

### 10. Volumes (`/volumes`)

- Listă volume (nume, size_gb, status, created_at)
- Creează volum
- Montează / demontează pe sandbox

### 11. Settings (`/settings`)

- Profile (email, generate API key)
- API keys list

## Layout

```
+-------------------------------------------+
|  Sidebar                                   |
|  ┌──────────────┐  +----------------------+|
|  │ Boxty Logo    │  |  Top Bar (search)   ||
|  │ Dashboard     │  |                     ||
|  │ Workspaces    │  |  Main Content       ||
|  │   ├─ Workspace│  |  (routed area)      ||
|  │   └─ Env      │  |                     ||
|  │ Apps          │  |                     ||
|  │ Sandboxes     │  |                     ||
|  │ Billing       │  |                     ||
|  │ Secrets       │  |                     ||
|  │ Images        │  |                     ||
|  │ Schedules     │  |                     ||
|  │ Volumes       │  |                     ||
|  │ Settings      │  |                     ||
|  └──────────────┘  +----------------------+|
+-------------------------------------------+
```

Sidebar colapsabil. Breadcrumbs în top bar.

## Structura fișierelor de creat

```
web/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── index.html
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Router setup
│   ├── api/
│   │   ├── client.ts            # HTTP client (fetch wrapper, auth headers)
│   │   ├── auth.ts              # login, register, api-keys
│   │   ├── sandboxes.ts         # sandbox CRUD + metrics
│   │   ├── workspaces.ts        # workspace CRUD
│   │   ├── environments.ts      # environment CRUD
│   │   ├── apps.ts              # App CRUD + stop/deploy/metrics/usage/logs
│   │   ├── billing.ts           # balance, usage, checkout
│   │   ├── secrets.ts           # secrets CRUD
│   │   ├── images.ts            # image build + list
│   │   ├── schedules.ts         # schedule CRUD + trigger
│   │   └── volumes.ts           # volume CRUD + mount/unmount
│   ├── hooks/
│   │   ├── useAuth.ts           # auth context hook
│   │   ├── useSandboxes.ts      # react-query hooks
│   │   ├── useApps.ts
│   │   └── useWorkspaces.ts
│   ├── components/
│   │   ├── Layout.tsx           # sidebar + top bar
│   │   ├── Sidebar.tsx          # navigation
│   │   ├── StatusBadge.tsx      # running/stopped/snapshotted badge
│   │   ├── MetricsCard.tsx      # metric display card
│   │   ├── ChartCard.tsx        # Recharts wrapper
│   │   ├── SandboxTable.tsx     # sandbox list table
│   │   ├── AppCard.tsx          # App card for listing
│   │   └── Modal.tsx            # reusable modal
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── WorkspacesPage.tsx
│   │   ├── WorkspaceDetailPage.tsx
│   │   ├── AppDetailPage.tsx    # tabs: overview, sandboxes, deployments, metrics, usage, logs
│   │   ├── SandboxDetailPage.tsx
│   │   ├── BillingPage.tsx
│   │   ├── SecretsPage.tsx
│   │   ├── ImagesPage.tsx
│   │   ├── SchedulesPage.tsx
│   │   ├── VolumesPage.tsx
│   │   └── SettingsPage.tsx
│   └── styles/
│       └── globals.css          # Tailwind imports
```

## Contract cu API-ul

Toate call-urile merg la `https://api.boxty.dev` (sau `http://localhost:3000` în dev).

- Autentificare: `Authorization: Bearer <jwt>` sau `Authorization: Bearer <api_key>`
- JSON request/response
- WebSocket: `wss://api.boxty.dev/ws/:sandboxId` pentru stream live logs

Endpoint-urile API sunt documentate în `AGENT_API.md`.

## Reguli

- React + TypeScript, Vite build
- Tailwind CSS pentru styling
- Recharts pentru grafice
- react-query pentru server state (caching, refetch)
- Responsive design (funcționează și pe mobile)
- Dark mode support (prin Tailwind)
- Loading states (skeleton loader) + error states
- Nu se rulează teste live — doar cod structural care compilează
