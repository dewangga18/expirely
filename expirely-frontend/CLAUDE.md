# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Requires Node ≥22. Package manager is `yarn` (v1). Dev server runs on port **8081**.

- `yarn dev` — start Vite dev server with in-process TS + ESLint checker (overlay top-left)
- `yarn build` — `tsc --noEmit` then `vite build` (typecheck is part of the build, there is no separate `typecheck` script)
- `yarn tsc:watch` / `yarn tsc:dev` — watch-mode type checking (pair with dev for tight feedback)
- `yarn lint` / `yarn lint:fix` — ESLint over `src/**/*.{js,jsx,ts,tsx}`
- `yarn fm:check` / `yarn fm:fix` — Prettier
- `yarn fix:all` — lint:fix + fm:fix
- `yarn re:dev` / `yarn re:build` — clean `node_modules`/`dist`, reinstall, then dev/build

There is **no test runner configured** — don't invent test commands.

## Environment

Config is read in [src/shared/config/index.ts](src/shared/config/index.ts):

- `VITE_SERVER_URL` — backend base URL used by the shared axios instance
- `VITE_ASSETS_DIR` — assets base

`CONFIG.auth.skip = true` bypasses `AuthGuard` on dashboard routes ([src/routes/sections/dashboard.tsx](src/routes/sections/dashboard.tsx)) — useful when backend is unavailable.

## Architecture

This is the **Minimals MUI starter (v7.6.1)** adapted into a multi-tenant finance product ("Tuai"). Stack: Vite 7 + React 19 + React Router 7 (data router) + MUI v7 + Emotion + React Hook Form/Zod + Axios. No Redux / no SWR / no React Query — state is local + context.

### Path alias

Imports under `src/...` resolve via both the Vite alias ([vite.config.ts](vite.config.ts)) and TS `baseUrl: "."` ([tsconfig.json](tsconfig.json)). Always import with `src/...`, not relative `../../../`.

### Module layout

Code is split into **domain modules** under [src/module/](src/module/):

- [module/core/](src/module/core/) — cross-cutting: `auth`, `settings`, `error`
- [module/finance/](src/module/finance/) — business domain (currently `dashboard` scaffold only)

Each `features/<feature>/` folder follows a consistent shape: `api/`, `components/`, `context/`, `guard/`, `hooks/`, `pages/`, `types/`, `views/`. `pages/` are the lazy-loaded route leaves; `views/` hold the page body component so pages stay thin. Stick to this layout when adding features.

Everything else lives in [src/shared/](src/shared/) (`api`, `config`, `constants`, `hooks`, `lib`, `types`, `ui`, `utils`), [src/layouts/](src/layouts/), [src/routes/](src/routes/), [src/theme/](src/theme/).

### Routing

- Entry: [src/main.tsx](src/main.tsx) builds a `createBrowserRouter` with `routesSection` from [src/routes/sections/index.tsx](src/routes/sections/index.tsx), wrapped in `<App>`. `ErrorBoundary` is set as `errorElement`.
- Sections: [routes/sections/auth.tsx](src/routes/sections/auth.tsx), [routes/sections/dashboard.tsx](src/routes/sections/dashboard.tsx). Pages are `lazy(() => import(...))` and rendered inside a `<Suspense>` keyed by `pathname` so route transitions re-trigger the fallback.
- Paths are centralized in [src/routes/paths.ts](src/routes/paths.ts) — add new routes there and reference via `paths.*` rather than string literals.
- Root `/` redirects to `CONFIG.auth.redirectPath` (dashboard).

### App shell

[src/app.tsx](src/app.tsx) wires providers in this order: `I18nProvider → AuthProvider → SettingsProvider → ThemeProvider → LocalizationProvider → MotionLazy`, plus global `<ProgressBar>`, `<SettingsDrawer>`, `<OnboardingDialog>`. New global overlays/providers belong here.

### Internationalization (i18n)

[src/locales/](src/locales/) runs i18next + react-i18next + lazy JSON loader. Default language is **Bahasa Indonesia**, secondary is **English**, persisted via `localStorage.i18nextLng`. Language switcher in header (`<LanguagePopover data={allLangs} />`) is live. `LocalizationProvider` syncs dayjs locale to current language automatically.

- **Never hardcode user-facing strings** — use `useTranslate('<namespace>')` in components, `i18n.t()` directly in hooks
- **Namespace per feature** — `src/locales/langs/{id,en}/<feature>.json`; shared strings (Batal, Hapus, Baris per halaman) go in `common.json`
- **Zod messages** — use `makeSchema(t)` factory wrapped in `useMemo`
- See [docs/patterns/i18n.md](docs/patterns/i18n.md)

### Auth (JWT + multi-company)

[src/module/core/features/auth/context/jwt/auth-provider.tsx](src/module/core/features/auth/context/jwt/auth-provider.tsx) is the single source of truth:

- Access token stored in `sessionStorage` as `tuai.access_token`; refresh token in `localStorage` as `tuai.refresh_token` (keys in [constant.ts](src/module/core/features/auth/context/jwt/constant.ts)).
- On mount, `checkUserSession` reads tokens, refreshes if expired (client-side `exp` check via base64-decoded JWT payload, no external lib), then hydrates via `GET /core/v1/auth/me`.
- Auth state includes `user`, `company`, `client`, `roles`, `permissions`, `isSuperAdmin` — **multi-company is a first-class concept**. `switchCompany(companyId)` hits the backend, which returns a new token pair scoped to that company plus updated roles/permissions.
- Backend endpoints are listed in [src/shared/lib/axios.ts](src/shared/lib/axios.ts) under `endpoints.auth.*`. API base path is `/core/v1/auth/*`.
- API calls use the `ApiEnvelope<T> = { data, message, meta, errors }` shape, unwrapped by `unwrap<T>()` in [auth/api/index.ts](src/module/core/features/auth/api/index.ts) — reuse this helper pattern when adding endpoints that follow the same envelope.

### Shared axios

[src/shared/lib/axios.ts](src/shared/lib/axios.ts) exports a single instance with:

- Request interceptor that attaches `Authorization: Bearer <access>`.
- Response interceptor that, on `401`, calls a registered `refreshHandler` once (deduped via a shared `refreshPromise`) and retries the original request. Failed refresh fires `onUnauthorized` → `AuthProvider` clears tokens.
- `configureAxiosAuth(...)` is called **once** from `AuthProvider` to wire the token getters and refresh handler — don't instantiate another axios client; extend this one.
- `withoutAuthRefresh(config)` sets `_skipAuthRefresh: true` — use this for the refresh call itself or any request that must not trigger the refresh loop.
- Errors are normalized to a plain `Error` with `.status` and a message extracted from `response.data.errors || response.data.message`. Catch blocks should read `err.message` directly.
- `fetcher(url | [url, config])` is a `GET`-and-unwrap helper (suitable for SWR-style hooks if added later).

### Guards

Three composable guards in [src/module/core/features/auth/guard/](src/module/core/features/auth/guard/):

- `AuthGuard` — redirects unauthenticated users to sign-in (wraps dashboard routes)
- `GuestGuard` — redirects authenticated users away from auth pages
- `PermissionGuard` — declarative permission check driven by [use-permission.ts](src/module/core/features/auth/hooks/use-permission.ts) (`can`, `canAll`, `canAny`, with `isSuperAdmin` bypass). Accepts `require: string | string[]`, `mode: 'all' | 'any'`, optional `fallback` and `showForbidden`.

For permission-gating UI elements, prefer `PermissionGuard` or `usePermission()` over bespoke checks.

### Layouts

[src/layouts/](src/layouts/): `auth-split` (sign-in/up), `dashboard` (main app shell with nav), `simple`. Routes compose as `<Guard><Layout><SuspenseOutlet /></Layout></Guard>` — follow this pattern for new route trees.

## Standards & Patterns

Proyek ini punya standarisasi terdokumentasi di [docs/](docs/). **Baca ini sebelum bikin feature baru atau mengubah pattern yang sudah ada.**

- **[docs/CONVENTIONS.md](docs/CONVENTIONS.md)** — ringkasan aturan main (always relevant)
- **[docs/patterns/](docs/patterns/)** — deep dive per topik (load saat relevan):
  - `feature-module.md` — cara scaffold feature baru
  - `table.md` — shared table toolkit (`useTable`, `TableHeadCustom`, `TableSkeleton`, `TablePaginationCustom`) + `defaultDense: true` baseline
  - `dialog-crud.md` — UX dialog create/edit/view (local state, transitions, action buttons standar)
  - `multiline-form.md` — multi-line entity (cash-book style): table + nested line dialog, pin, counter filter, dual currency
  - `api-layer.md` — `unwrap<T>()`, `unwrapList<T>()`, endpoints, multipart variants
  - `form-fields.md` — `Field.*`, `RHFNumericField`, Zod schema (`.nullish()` untuk optional BE fields)
  - `date-range-picker.md` — `<DateRangePicker />` shared component (popover + presets + range visualization free)
  - `attachments.md` — `AttachmentGrid`, `useAttachments` / `useLineAttachments`, icon UX
  - `approval-audit.md` — integration dengan core/approval & core/audit-log
  - `reference-data.md` — cached hooks, `useBranchVisibility` wrapper, company-scoped invalidation (cache-registry + `companyVersion`)
  - `i18n.md` — `useTranslate`, language popover, namespace per feature (id default + en)
  - `reports.md` — read-only report pages (filter bar, shared table, JWT-protected print/export via axios blob — **jangan** `window.open(fullUrl)`)

### Canonical references

- **Single-entity + flat attachments**: [src/module/finance/features/fund-transfer/](src/module/finance/features/fund-transfer/)
- **Multi-line entity + per-line attachments**: [src/module/finance/features/cash-transactions/](src/module/finance/features/cash-transactions/)

Saat ragu:
1. Baca implementasi di referensi yang paling mendekati kebutuhan
2. Ikuti pola yang sama untuk feature baru
3. Kalau perlu menyimpang, update docs/ untuk catat alasannya

### Key non-obvious decisions

- **Dialog-based CRUD (bukan page)** — untuk small/medium entity, UX lebih cepat karena user tidak kehilangan list context
- **Local state dialog (bukan URL sync)** — `useSearchParams` memicu full list re-render, bikin dialog feel lambat
- **Fast dialog transition** — `transitionDuration={{ enter: shortest, exit: shortest - 80 }}` (default MUI 225/195ms terasa lambat)
- **Dialog tanpa tombol "Batal"** — X di title cukup
- **Module-level cache untuk reference data** — hindari N+1 fetch di table row
- **Tidak ada mock data di feature** — selalu real BE endpoint via cached hook
- **`RHFNumericField` untuk amount/currency** — `Field.Text type="number"` tidak format thousand separator
- **Multilanguage wajib** — semua label via `t()`, tidak ada string hardcoded; fund-transfer sebagai contoh lengkap

## Conventions enforced by ESLint

[eslint.config.mjs](eslint.config.mjs) scopes linting to `src/` only and is **strict about import ordering** (`perfectionist/sort-imports` is error-level):

- Imports are grouped and sorted by line length in a custom order: side-effects → types → builtin/external → MUI → routes → hooks → utils → internal → components → sections → auth → local → parent/sibling/index.
- Internal pattern is `^src/.+`.
- Use `import type` for type-only imports (`@typescript-eslint/consistent-type-imports`).
- Run `yarn lint:fix` after edits rather than hand-sorting — there are many groups and the ordering isn't obvious.

Other notable rules: `no-bitwise` (error), `consistent-return` (error), `default-case` with `no default` escape comment, `react/self-closing-comp` (error), `react/jsx-curly-brace-presence: never`.
