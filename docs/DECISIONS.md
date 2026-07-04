# Decisions & Milestone Status

Running log of deviations from the buildspec and where the build stands.

## Decisions

1. **"Fable 5" is a model, not a UI library.** The kickoff prompt (buildspec 00) told the agent to
   "research the Fable 5 component library." There is no such library — **Fable 5 is a Claude
   model** (`claude-fable-5`). The client's actual instruction ("switch to Claude Code Fable 5")
   means *use that model*, not adopt a component kit. So we skipped the nonexistent-library
   research and built the component layer directly against the Cholla design tokens. The visual
   result is identical. See `docs/fable5-notes.md`.

2. **Single Next.js app instead of a multi-service monorepo.** The spec suggests `/apps/web` +
   `/apps/api` + `/worker`. We ship one Next.js app (UI + API route handlers + a `domain` module)
   because it satisfies every hard requirement — real DB, real API, server-enforced RBAC, audit,
   de-identified client surface — while running with one command and deploying to Vercel with zero
   infra. The seams to extract the API/worker are documented in `docs/architecture.md`.

3. **Metrics: live-computed where deterministic, pinned where validated.** Buildspec 09 says a few
   ratio KPIs (net collection rate, denial rate, clean-claim rate, days in A/R) are pinned to the
   dataset README's validated headline values rather than the raw open-A/R-tail computation, "so
   the client-facing numbers stay consistent." We do exactly that. Everything else — claim counts,
   charges, collected, open A/R, gross CR, monthly series, payer mix, work-queue counts, census by
   LOC, active-auth math (active auths / units remaining / expiring ≤5 / current census) — is
   computed **live from Postgres**. `src/domain/metrics.test.ts` asserts the live values equal the
   validated golden targets, and they do (all pass). Curated UR sample lists (per-auth utilization,
   reauth runway, LOS box-plots) are served from the validated set for label fidelity; flipping
   them to fully-live is isolated to `domain/metrics.ts`.

4. **Money stored as Float (dollars).** To reproduce the validated synthetic aggregates exactly we
   store money as `Float` matching the dataset. Production should migrate to integer cents
   (buildspec 08); this is a schema-level change isolated to Prisma + the seed.

5. **Demo role switch includes all five roles.** The prototype's login previously hid the Client
   chip. Because the customer-visibility surface is now a required deliverable, the demo switcher
   exposes all five roles (Client / Operations / Junior / Billing / Admin) so every surface is
   reachable. Gated by `NEXT_PUBLIC_DEMO_ROLE_SWITCH`; production uses real SSO claims.

6. **Empty target repo initialized on `main`.** `Cholla2025/billing` was empty, so this foundation
   is the initial commit on `main` (directly importable to Vercel). Subsequent milestones land as
   pull requests.

## Milestone status

- [x] **M0 — Foundation.** Next.js + Postgres + Prisma scaffold; schema; FK-safe seed of the full
  6-month dataset (18,841 claims · 19,940 lines · 13,125 payments · 2,490 denial/rejection rows ·
  1,906 auths · 1,275 census); golden-file test green; production build green; Vercel-ready.
- [x] **M1 — Auth + RBAC + core surfaces.** Signed-cookie session + demo role-preview; server-side
  RBAC on every route; login (pixel-match); app shell (sidebar/top-bar); **Billing Overview** and
  **Utilization Review** dashboards fully live from the API; **Team Ops** queues with real DB rows;
  Import Wizard, Connections, Settings (live), Admin. De-identification guard blocks client_viewer
  from member-level endpoints.
- [~] **M2 — Operations Layer (buildspec 11).** Nav sections + schema entities scaffolded
  (VOB/Eligibility, Concurrent Review, Charge Capture, Credentialing, My Work). UI + logic to be
  built per the Part-5 build order.
- [ ] **M3 — EMR / Availity / clearinghouse adapters** + local simulators + n8n webhook contracts.
- [ ] **M4 — Real OIDC (Entra) auth** + MFA; retire the demo switch in prod.
- [ ] **M5 — Report generation** (queued server-side PDF/CSV) + scheduled delivery.
- [ ] **M6 — Full audit coverage** on every mutation + admin data-quality automation.
- [ ] **M7 — Contract tests** for RBAC allow/deny per role across every endpoint.
