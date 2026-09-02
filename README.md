# Expirely

Inventory & expiry tracker with AI-powered item recognition and smart recommendations. Built as a Go + React monorepo (backend API + SPA frontend).

> **Status:** MVP built for an internal office hackathon. **Not open source** — source is private. A free (gratis) and paid (berbayar) tier are planned for the future, but the licensing/commercial model is not finalized yet.

## About

Expirely helps teams and households track item shelf-life and expiry. Users snap a photo of an item and the backend recognizes it via Google Gemini, then surfaces recommendations from a curated shelf-life dataset. The backend is a multi-tenant modular monolith (companies, branches, users, roles) with JWT auth, RBAC, and company-scoped data isolation; the frontend is a React SPA that talks to the backend REST API.

This repository is an **MVP** scoped to internal hackathon needs — expect rough edges and incomplete features. It is not intended for production use yet.

## Requirements

- **Go** 1.26+ (backend)
- **Node.js** >= 22.12 (frontend)
- **PostgreSQL** 12+ (primary datastore, via `pgxpool`)
- **Redis** 6+ (cache / session backing)
- **Yarn** 1.x (frontend package manager)
- **Docker** 24+ (optional, for containerized runs)

## Getting Started

```bash
git clone https://github.com/dewangga18/expirely.git
cd expirely

# --- Backend ---
cp expirely-backend/.env.example expirely-backend/.env   # edit DB_*, JWT_*, AI_API_KEY
cd expirely-backend
make db-setup      # run migrations + seeders (PostgreSQL + Redis must be up)
make dev           # hot-reload API on :8080

# --- Frontend (separate terminal) ---
cd expirely-frontend
cp .env.example .env        # set VITE_SERVER_URL -> backend base URL
yarn install
yarn dev            # Vite dev server on :8081
```

## Project Structure

```
expirely-backend/            # Go API (Gin, PostgreSQL, Redis)
  cmd/api/                   # entrypoint (server bootstrap)
  internal/modules/core/     # feature modules: auth, expirely_item, ...
  internal/shared/           # cross-cutting: response, authz, audit, logger
  internal/database/         # migrations (core/) + seeders
  deployments/               # k8s + docker entrypoints
expirely-frontend/           # React SPA (Vite, MUI)
  src/module/core/           # auth + expirely features
  src/shared/                # api client, config, hooks, ui, utils
  src/layouts/ src/routes/ src/theme/
docs/                        # architecture, PRD, handoff notes
```

## Dependencies

- Backend: `go mod tidy` (Go modules) — add via `go get`, update via `go mod tidy`
- Frontend: `yarn install` — add via `yarn add`, update via `yarn upgrade`

## Build Configuration

| Service | Build command | Output | Notes |
| --- | --- | --- | --- |
| `expirely-backend` | `make build` | `bin/` binary | `Dockerfile` provided |
| `expirely-frontend` | `yarn build` (`tsc && vite build`) | `dist/` | `Dockerfile` + `nginx.conf` provided |

## Development Utilities

Run these commands from the repository root:

```bash
bash scripts/expirely.sh rebuild  # Build frontend, then backend
bash scripts/expirely.sh stop     # Stop this repository's dev listeners on :8081 and :8080
```

`stop` verifies the listener's working directory before sending `SIGTERM`, so it refuses to stop another project that happens to use either port. Override the default ports only when needed with `EXPIRELY_FRONTEND_PORT` and `EXPIRELY_BACKEND_PORT`. The rebuild command uses a writable temporary Go cache by default; override it with `EXPIRELY_GO_CACHE` when needed.

## Troubleshooting

- **DB connection refused** — confirm PostgreSQL is running and `DB_*` in `expirely-backend/.env` match; run `make db-setup`.
- **Migrations stuck / version mismatch** — `make migrate-force V=<version> MODULE=core`.
- **AI recognition not working** — set `AI_API_KEY` (Google Gemini) and `AI_MODEL` in backend `.env`; verify `VITE_SERVER_URL` on the frontend points at the backend.
- **Auth loop on frontend** — set `CONFIG.auth.skip = true` in `src/shared/config` to bypass `AuthGuard` when the backend is down.
