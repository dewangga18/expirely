# AGENTS.md

> This file is project-specific context only. Don't duplicate what linters, standards files, or the codebase already enforce.
>
> *If context is insufficient, check your global agent instructions file or ask the user.*

## Stack

**Name:** Expirely<br>
**What it does:** Multi-tenant inventory & expiry tracker with AI (Gemini) photo recognition and recommendations.<br>
**Maturity:** MVP for an internal office hackathon — private repo, **not open source**. Free (gratis) and paid (berbayar) tiers planned later; licensing/commercial model not finalized.<br>
**Tech stack:** Go 1.26 + Gin + PostgreSQL (`pgxpool`) + Redis (backend) · React 19 + Vite 7 + MUI v7 + React Router 7 + Yarn (frontend)<br>
**Environments:** `Local` backend `:8080`, frontend `:8081` (both configurable via `.env`)<br>
**Folders:**
- `expirely-backend/` — Go API: `cmd/api` entrypoint, `internal/modules/core/*` feature modules, `internal/shared` cross-cutting, `internal/database` migrations+seeders
- `expirely-frontend/` — React SPA: `src/module/core` features, `src/shared` api/config/ui, `src/layouts` `src/routes` `src/theme`
- `docs/` — architecture, PRD, handoff

## Commands

```bash
# Backend (expirely-backend/)
make db-setup          # migrations + seeders
make dev               # hot-reload API
make test              # unit tests
make migrate-up        # apply pending migrations
make seed              # run seeders

# Frontend (expirely-frontend/)
yarn dev               # Vite dev server (:8081)
yarn build             # tsc --noEmit && vite build
yarn lint              # eslint src/**
yarn fm:check          # prettier --check

# Repository root
bash scripts/expirely.sh rebuild  # build frontend, then backend
bash scripts/expirely.sh stop     # safely stop this repository's dev listeners
```

## Mandatory Rules

- **Verify before done.** Never mark complete without proving it works (run the relevant `make`/`yarn` command).
- **Autonomous bug fixing.** Given a bug report, just fix it.
- **Graph reference.** For architecture / file-relationship / cross-module questions, consult `expirely-backend/graphify-out/GRAPH_REPORT.md` and `expirely-frontend/graphify-out/GRAPH_REPORT.md` (or query the graph via the graphify skill) before scanning files manually — these are this project's primary context maps.
- **Security.** Never commit `.env*`/secrets. Files agents must NOT touch: `internal/database/migrations/**` (schema history) unless explicitly asked.
- **Plan mode.** Tasks touching >2 files need a plan first, tracked as you go.
- **Core principles.** Simplicity first, fix root causes (no temp patches), minimal impact.

## Conventions

- **Module pattern (backend):** every feature is `internal/modules/core/<name>/` with `domain/ dto/ handler/ repository/ service/ main.<name>.go` (`Initialize()` + `SetupRoutes()`), registered in `internal/router/router.go`.
- **Multi-tenancy:** always filter queries by `company_id`; company context injected via `CompanyContext()` middleware.
- **Naming:** Go — PascalCase exported, `camelCase` unexported; frontend — `src/...` path alias imports, `camelCase` vars, `PascalCase` components/types.
- **Commit format:** `<type>: <short description>` (Conventional Commits: feat/fix/chore/docs/refactor/test).

## Gotchas

- **Legacy naming:** existing `CLAUDE.md` and `.env.example` still reference "Tuai"/"Venturo" — stale; the product is **Expirely**. Don't copy those URLs/names into new code.
- **Graphify output lives in subfolders** (`expirely-backend/graphify-out/`, `expirely-frontend/graphify-out/`), not repo root — query the correct one per service.
- **Frontend build runs `tsc --noEmit`** inside `yarn build`; a type error fails the build, so run `yarn build` (not just `vite build`) to validate.
