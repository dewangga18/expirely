# Frontend modernization — implementation handoff

## Status & Operating Rules

This document is the execution handoff for the Expirely frontend modernization. It consolidates the current planning documents into an implementation sequence grounded in the existing codebase.

## Current Execution Status — 2 September 2026

Completed locally, without a Git commit:

- P0 baseline: build, lint, and formatting checks passed; brand/API/i18n boundaries were verified.
- P1 foundation: Tailwind v4 utilities are integrated through Vite with Preflight disabled, MUI palette tokens are exposed, and reusable shadcn primitives are available for card, badge, separator, avatar, input, label, and button.
- P2 recommendation: the existing non-streaming API now has a guided recommendation-result presentation, preserves quota refresh/retry, and offers the existing per-item consume action.
- P3 item UX: photo upload and manual form shells were polished without moving their responsibilities; a reusable urgency badge now drives both desktop and mobile item lists.
- P4 dashboard: real summary data now renders in the official React Bits Magic Bento component; its desktop interaction is disabled on mobile.
- Human visual direction: the home page now prioritizes one warm, actionable “today” moment before supporting stats, with honest loading states and count-up feedback; the Google sign-in entry uses a calmer branded welcome panel and clearer trust context.
- Public entry: `/landing` is a mobile-first, unauthenticated pitch route with the Expirely story, product-flow preview, a contained official React Bits Prism backdrop on desktop, and direct Google sign-in CTA; dashboard root remains protected.
- P5 onboarding: a four-step, company-scoped driver.js tour is shown from the item list only after items exist; it complements (and does not replace) the account-state onboarding dialog.
- Brand assets: the active Venturo splash-logo asset was removed. The supplied Expirely icon, lockup, and app icon now serve compact/full product branding and the browser favicon.
- Dataset A: shelf-life references now live in a versioned, source-linked JSON snapshot. Estimated items expose an `estimate_basis` in the existing item response, and the detail dialog explains the estimate with a prominent food-safety disclaimer.

Out of scope deliberately: generic AI conversation and streaming. Expirely presents structured recommendations for selected items, rather than a chat experience. React Bits and selected shadcn primitives are in the current implementation packet; Tailark remains optional because the public landing is already custom-built. Bulk consume requires an explicit product/API decision.

- **Source strategy:** `FRONTEND_MODERNIZATION_PLAN.md` remains the product/design intent; this document resolves its implementation decisions and execution order.
- **Quality gates:** `PREPARATION_CHECKLIST.md` is the pre-flight and final QA checklist.
- **No Git mutation:** do not create commits, tags, branches, pushes, resets, checkouts, or force-pushes as part of this work. Preserve all existing working-tree changes.
- **No backend/schema change:** API contracts, database migrations, and backend behaviour are out of scope.
- **No full MUI migration:** retain MUI layouts, table toolkit, shared form patterns, and MUI DatePicker. Introduce shadcn/Tailwind only in scoped, verified surfaces.
- **Validation is mandatory:** after each implementation packet, run the smallest relevant check; before handoff, run `yarn build`, `yarn lint`, and `yarn fm:check`.

## Verified Current-State Boundaries

| Area | Existing reality | Refactor decision |
| --- | --- | --- |
| Recommendation API | `POST /core/v1/recommend` receives selected item data and returns completed recommendations per item. | Build a guided result presentation with loading, retry, and response cards. Do not add a composer, token streaming, or free-form prompting. |
| Shelf-life estimate | Category and `is_estimated` are persisted; actual storage history is not. | Return a general `estimate_basis` only for estimated categories. Do not represent it as item-specific safety advice or a guarantee. |
| Quota refresh | The recommendation dialog already refreshes quota after a successful generation. | Preserve the existing success callback and quota refresh path. |
| Item creation | `ItemFormDialog` covers manual item fields; `PhotoUploadDialog` owns image recognition and storage-location flow. | Refactor/polish these dialogs separately. Do not collapse or move their business logic without an approved flow design. |
| Item actions | Desktop/mobile item UI already has status and action affordances. | Reuse existing handlers. A bulk “mark consumed” action requires an explicit UI policy because the current status update is per item. |
| Onboarding | A global `OnboardingDialog` is already rendered by the application shell. | Decide whether driver.js replaces it or extends it before adding a second onboarding system. Default: defer driver.js. |
| Notifications | `sonner` is already installed. | Reuse the existing toast approach; do not add a duplicate shadcn toast system unless a concrete need appears. |
| Package manager | The frontend declares Yarn 1.22.22. | Use `yarn` for installs and scripts. Do not mix `npm install` into the implementation. |

## Scope, Priority, and Definition of Done

### P0 — Baseline and Design Contract

Before changing UI:

1. Record the current `yarn build`, `yarn lint`, and `yarn fm:check` results.
2. Capture before screenshots for dashboard (desktop/mobile), manual item dialog, photo flow, and current recommendation flow.
3. Confirm the MUI palette values in `src/theme/core/palette.ts` and map tokens before configuring Tailwind.
4. Confirm the exact recommendation request/response types in `expirely-items/api` and the existing status-update handler.
5. Confirm the current i18n namespace files for every surface that will gain copy.

**Done when:** baseline evidence is recorded and no design task relies on an unverified API/UI assumption.

### P1 — Tailwind + shadcn Foundation

1. Add Tailwind and shadcn with the smallest component set needed for the first real surface.
2. Keep MUI and Emotion intact; do not change layouts, routes, or working forms merely to prove coexistence.
3. Sync initial primary/error/warning/success tokens from the actual MUI palette.
4. Render an isolated proof surface only if it is needed to verify coexistence; remove it before final handoff unless it is an intentional developer-only route.

**Done when:** shadcn components compile beside MUI, visual tokens align, and build/lint/format pass.

### P2 — Recommendation Experience (Primary Demo Surface)

Replace the presentation of the existing `RecommendationDialog` through a small, reversible integration in the item-list owner.

- Preserve item selection, request shape, API endpoint, quota behaviour, loading, retry/error handling, and close behaviour.
- Present completed recommendations as clear, structured result cards.
- Use responsive dialog/drawer behaviour only if it does not break focus management and keyboard navigation.
- Reuse existing per-item actions; defer bulk consume until its expected behaviour and API strategy are approved.
- Add all new copy to Bahasa Indonesia and English locale files; no hardcoded user-facing strings.

**Done when:** selecting one or multiple items produces the existing real API result, quota refreshes, errors can retry, and the original flow has no regression.

### P3 — Item Dialog and Urgency Polish

Work in small packets, preserving each flow's ownership.

1. Polish `PhotoUploadDialog`: visual preview, processing state, and error/retry presentation without changing recognition or storage-location data flow.
2. Polish `ItemFormDialog`: retain React Hook Form, schema, API calls, shared field conventions, and MUI DatePicker. Migrate only the safely isolated visual shell/controls.
3. Add one reusable `UrgencyBadge` and apply it consistently to desktop row and mobile card.

Urgency threshold must be verified against existing helper/business logic before implementation. If the product rule is adopted, use: expired `< 0`, urgent `0–2`, warning `3–7`, safe `> 7` days. Include text/icon treatment in addition to colour, and meet WCAG AA contrast.

**Done when:** manual create, edit, recognition-assisted create, validation, save, status update, and delete continue to work in desktop and mobile layouts.

### P4 — Dashboard Stats

The dashboard now uses the official React Bits Magic Bento component with real existing stats. Desktop-only interaction is disabled on mobile; it must not obscure content, harm keyboard access, or cause layout shift.

Test 375px, 768px, and 1440px widths.

**Done when:** all existing stats values and loading/empty states render correctly with no horizontal overflow.

### P5 — Optional Polish (Only After P1–P4 Pass)

- Driver.js complements (not replaces) the account-state onboarding dialog: the dialog resolves missing company/account state, while the product tour starts only for a company with items.
- The official React Bits Prism background is contained to the public landing desktop hero and honors reduced-motion.
- A custom public `/landing` route is in demo scope. Tailark is not installed because the existing landing is tailored to Expirely and carries no fabricated social-proof content.

These tasks are skippable and must never delay P2 or P3.

## Implementation Constraints

- Import application modules via `src/...`; follow the existing feature structure.
- Keep user-facing text translated through `useTranslate` / locale JSON files.
- Keep existing API envelopes and the shared Axios instance.
- Do not alter auth, multi-company behaviour, database migrations, or configuration secrets.
- Do not add mock data to production feature paths.
- Prefer a new scoped component over a large rewrite of an existing owner.
- Run `yarn lint:fix` only for files intentionally changed; inspect the diff afterwards so formatting does not alter unrelated work.
- Use reversible, file-scoped edits. If a packet fails validation, stop at that packet and report the affected files and error; do not use destructive Git commands.

## Orchestration Protocol

Each implementation packet must specify:

1. **Target files and ownership** — avoid concurrent edits to shared config, routes, or the item-list owner.
2. **Preserved contract** — API request/response, i18n, state handler, and quota/status callback that must remain unchanged.
3. **Verification** — command(s) and manual flow that prove the packet works.
4. **Visual evidence** — before/after screenshot at the relevant breakpoint(s).
5. **Handoff note** — files changed, decisions made, remaining risk, and whether the next packet is unblocked.

Recommended packet order:

1. P0 baseline/design contract
2. P1 foundation
3. P2 recommendation experience
4. P3a photo dialog
5. P3b manual item dialog
6. P3c urgency badge + item list
7. P4 dashboard stats
8. P5 optional work

## Manual QA — Ready for Validation

Restart the backend after this change so the embedded Dataset A snapshot is loaded, then validate:

1. Sign in and scan a fresh item with no printed date; open its detail dialog and confirm the amber **estimate basis** panel appears with the category, day estimate, storage/use guidance, disclaimer, and source link.
2. Open an item with a printed package date; confirm the estimate basis panel does not appear.
3. On a narrow viewport, open the same detail dialog and confirm the panel wraps without horizontal scrolling.
4. Complete the normal photo → save → recommendation → mark consumed loop to confirm the real Firebase/Gemini/backend configuration still works.

The data snapshot's scope and importer limitation are documented in `shelf-life-dataset.md`.

## Final Acceptance Checklist

- [x] `yarn build` passes with no TypeScript errors.
- [x] `yarn lint` and `yarn fm:check` pass.
- [x] `go test ./...` and `go build ./cmd/api` pass.
- [ ] Authentication and dashboard routes still work.
- [ ] Manual add/edit, validation, save, and item actions work.
- [ ] Photo recognition still auto-fills and saves correctly.
- [ ] Recommendation works for one and multiple selected items, handles error/retry, and refreshes quota.
- [ ] Urgency treatments match verified business logic and remain understandable without colour alone.
- [ ] Responsive checks pass at 375px, 768px, and 1440px with no overflow.
- [ ] Before/after screenshots document the demo surfaces.
- [ ] No commit, tag, branch, push, reset, checkout, or secret-file change was made.

## Deferred Decisions Requiring Explicit Approval

1. Desired bulk “Mark as consumed” behaviour and API strategy.
2. Whether OpenCode may send private repository context to the external 9router provider.
