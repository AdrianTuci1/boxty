# Boxty Control Panel Architecture

## Overview

The Control Panel is the web dashboard for managing Boxty workloads, workspaces, volumes, secrets, and settings. It has been refactored from a flat component structure into a modular, OOP/SOLID architecture inside `web/src/control-panel/`.

## Design Principles

| Principle | How it is applied |
|-----------|-------------------|
| **Single Responsibility (SRP)** | Each module owns one concern: models, ports, repositories, use-cases, view-models, UI. |
| **Open/Closed (OCP)** | New domains are added as new feature modules without touching existing ones. |
| **Liskov Substitution (LSP)** | Repository interfaces (`IAppRepository`, `IWorkspaceRepository`, etc.) allow swapping implementations. |
| **Interface Segregation (ISP)** | Small, focused ports instead of fat interfaces. |
| **Dependency Inversion (DIP)** | UI and services depend on abstractions (ports), not concrete API clients. |
| **OOP** | Domain logic is encapsulated in classes: `AppRepository`, `AppCardViewModel`, `DashboardViewModel`, `CommandPaletteRegistry`, etc. |

## Directory Structure

```
web/src/control-panel/
├── core/
│   ├── models/           # Plain domain models (App, Sandbox, Workspace, Volume, Secret, Dashboard)
│   ├── ports/            # Interfaces/contracts (repositories, auth, command-palette)
│   ├── services/         # Domain services (future: dashboard aggregator)
│   └── use-cases/        # Business logic classes (AppFilterUseCase, AppSortUseCase, AppModelMapper, etc.)
├── features/
│   ├── apps/             # App list, AppCard, repository, hooks, view-models
│   ├── auth/             # Auth service + token storage implementation
│   ├── command-palette/  # Registry, command factories, UI overlay
│   ├── dashboard/        # Dashboard page, filter toolbar, dashboard view-model
│   ├── navigation/       # (reserved) workspace/environment selector abstraction
│   ├── shell/            # (reserved) layout shell adapters
│   └── workspaces/       # (reserved) workspace management abstraction
└── shared/
    ├── api/              # (reserved) API-level utilities
    ├── components/       # Reusable presentational components (Badge, StatusBadge)
    ├── hooks/            # (reserved) shared hooks
    ├── mocks/            # (reserved) shared mock data
    └── utils/            # (reserved) shared utilities
```

## Core Modules

### Models (`core/models`)

| Model | File | Purpose |
|-------|------|---------|
| `AppModel` | `app.model.ts` | Workload representation in the UI. |
| `SandboxModel` | `sandbox.model.ts` | Sandbox session model. |
| `WorkspaceModel` | `workspace.model.ts` | Workspace + environment. |
| `VolumeModel` | `volume.model.ts` | Volume record. |
| `SecretModel` | `secret.model.ts` | Secret record. |
| `DashboardDataModel` | `dashboard.model.ts` | Dashboard summary + collections. |

### Ports (`core/ports`)

| Port | File | Purpose |
|------|------|---------|
| `IAppRepository` | `app.repository.port.ts` | CRUD + lifecycle for apps/workloads. |
| `IWorkspaceRepository` | `workspace.repository.port.ts` | Workspace + environment management. |
| `IVolumeRepository` | `volume.repository.port.ts` | Volume management. |
| `ISecretRepository` | `secret.repository.port.ts` | Secret management. |
| `IAuthService` / `IAuthTokenStorage` | `auth.port.ts` | Auth abstraction. |
| `ICommandPaletteRegistry` | `command-palette.port.ts` | Command palette contract. |

### Use-Cases (`core/use-cases`)

| Class | File | Responsibility |
|-------|------|----------------|
| `AppFilterUseCase` | `app-filter-sort.use-case.ts` | Filter apps by status, deployer, tag. |
| `AppSortUseCase` | `app-filter-sort.use-case.ts` | Sort apps by name, date, activity. |
| `AppFilterSortUseCase` | `app-filter-sort.use-case.ts` | Compose filter + sort. |
| `AppModelMapper` | `app-mapper.use-case.ts` | Map API records to `AppModel`. |
| `ComputeDashboardSummaryUseCase` | `dashboard.use-case.ts` | Aggregate resource counts. |
| `GetLiveAppsUseCase` / `GetStoppedAppsUseCase` | `dashboard.use-case.ts` | Live/stopped partitioning. |

## Feature Modules

### Apps (`features/apps`)

```
features/apps/
├── repositories/
│   └── app.repository.ts          # Concrete IAppRepository using apiFetch + mocks
├── hooks/
│   └── use-apps.ts                # React Query hooks backed by repository
├── view-models/
│   └── app-card.view-model.ts     # Presentation logic for AppCard
└── ui/
    └── AppCard.tsx                # Presentational component (119 lines)
```

### Dashboard (`features/dashboard`)

```
features/dashboard/
├── view-models/
│   └── dashboard.view-model.ts    # State derivation, filter/sort/query orchestration
└── ui/
    ├── DashboardPage.tsx          # Thin page shell (82 lines)
    └── FilterToolbar.tsx          # Filter/sort UI (111 lines)
```

### Command Palette (`features/command-palette`)

```
features/command-palette/
├── services/
│   └── command-palette.registry.ts   # In-memory registry of commands
├── factories/
│   └── navigation-command.factory.ts # Builds navigation commands from current path
└── ui/
    └── CommandPalette.tsx              # UI overlay (181 lines)
```

## Dependency Flow

```
UI Components
    ↓ imports
View-Models
    ↓ imports
Use-Cases / Services
    ↓ imports
Repositories (implement Ports)
    ↓ imports
API Client (legacy apiFetch)
```

Nothing above the repository layer knows about `apiFetch` or HTTP details. This makes unit testing business logic possible without a running backend.

## Testing

Tests are colocated with source code in `__tests__` folders and run with **Vitest** + **jsdom**.

```bash
cd web
npm run test
```

| Test File | Coverage |
|-----------|----------|
| `app-filter-sort.test.ts` | Filter, sort, combined filter+sort, label map. |
| `app-mapper.test.ts` | API-to-domain mapping and fallback logic. |
| `app-card.view-model.test.ts` | Presentation logic for app cards. |
| `dashboard.view-model.test.ts` | Route params, deployer list, query filtering. |
| `command-palette.registry.test.ts` | Register, filter, unregister commands. |
| `navigation-command.factory.test.ts` | Scope extraction and navigation execution. |

All 23 tests pass.

## Build

```bash
cd web
npm run build
```

The TypeScript build is clean (0 errors). The production bundle is produced successfully.

## Migration Notes

- The legacy `pages/DashboardPage.tsx` and `components/CommandPalette.tsx` remain in the repository but are no longer imported by `App.tsx`.
- `components/CommandPalette.tsx` now re-exports the new modular implementation for compatibility with `Layout.tsx` and `Navbar.tsx`.
- Existing `api/*` modules are still used as the concrete transport layer by the new repositories.
- No backend endpoints were changed.

## Future Work

- Extend the same pattern to remaining features: volumes, secrets, workspaces, settings, billing, images, schedules.
- Introduce dependency injection container for repositories and services.
- Add end-to-end tests for the refactored dashboard flow.
- Implement `IWorkspaceRepository`, `IVolumeRepository`, `ISecretRepository` concrete implementations.
