# Commit review — Expirely modernization

**Status:** ready for maintainer review; no Git staging, commit, branch, tag, push, reset, or checkout was performed for this handoff.

## Proposed commit

```text
feat: modernize expiry tracking UI and shelf-life guidance
```

This is one cohesive user-facing change: it refreshes the Expirely experience and explains the basis of shelf-life estimates. It deliberately does not claim food-safety certainty.

## Intended commit scope

Stage the implementation and its durable product documentation:

- frontend modernization: landing route, authenticated dashboard, sign-in, item, photo, recommendation, urgency, onboarding, localization, brand assets, and UI foundations;
- backend `estimate_basis` response field, embedded source-linked shelf-life dataset, and service coverage;
- removal of the legacy Venturo logo from the active frontend asset path;
- `docs/frontend-modernization-handoff.md` and `docs/shelf-life-dataset.md`;
- the `.gitignore` entry for the local `.opencode-free-models.md` catalog, if that exclusion is intentional for this repository.

## Review points before staging

1. Confirm every modified and untracked source file belongs to this modernization. The working tree may contain pre-existing user work, so do not use a blanket `git add .`.
2. Review the brand files under `expirely-frontend/public/brand/`; they replace the removed Venturo asset and should be included only if their licence/ownership is confirmed.
3. Review the food-safety wording and source links in `shelf-life-dataset.md`. The snapshot is a planning reminder, never consumption advice or a safety guarantee.
4. Decide whether `.gitignore` belongs in this change. Its only visible change ignores `.opencode-free-models.md`, a local model catalog.
5. Perform the outstanding manual QA: authentication, photo recognition, recommendation/quota refresh, consume action, and responsive widths at 375px, 768px, and 1440px.

## Validation already completed

- Frontend: `yarn build`, `yarn lint`, and `yarn fm:check` passed.
- Backend: `go test ./...` and `go build ./cmd/api` passed using a writable Go build cache.
- Data: `shelf_life.json` passed JSON parsing validation.
- Patch hygiene: `git diff --check` passed.

## Documentation decision

| Document | Recommendation | Reason |
| --- | --- | --- |
| `docs/frontend-modernization-handoff.md` | Commit | Durable implementation status and manual QA handoff. |
| `docs/shelf-life-dataset.md` | Commit | Source provenance, safety boundary, and importer limitation for shipped data. |
| `docs/AGENT_EXECUTION_BRIEF.md` | Do not commit | Historical agent operating brief; not product documentation. |
| `docs/FRONTEND_MODERNIZATION_PLAN.md` | Do not commit | Superseded planning/history and duplicate of the handoff. |
| `docs/PREPARATION_CHECKLIST.md` | Do not commit | Historical execution/pitch checklist, not ongoing project reference. |
| `docs/opencode-9router-models.md` | Do not commit | External provider model snapshot that becomes stale and is unrelated to runtime behaviour. |

## Maintainer decision

Approve this scope only after the review points and manual QA pass. If any point is rejected, split the affected work into a separate commit rather than broadening this commit without review.
