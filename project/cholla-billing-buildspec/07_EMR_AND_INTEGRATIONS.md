# 07 · EMR & Integrations

The client wants the leadership/operations surface to **run on automation**: reports pulled from
the EMR, denials/authorizations flowing in via webhooks, and scheduled report delivery. Build all
external systems as **adapters** with a local **simulator**, so real feeds drop in without
touching the app.

## Integration surface
| Source | Kind | Role in the system | Prototype name |
|--------|------|--------------------|----------------|
| **EMR** | pull (scheduled) + push (webhook) | census, demographics, episodes, LOC, discharges | "Kipu EHR" |
| **Clearinghouse** | submit 837 / ingest 835 / ingest rejections | claims out, remits + rejections in | "Waystar" |
| **Automation hub** | webhooks | denial.created, auth.updated, payment.posted, etc. | "n8n" |
| **Report delivery** | scheduled export | PDF/CSV to leadership/client on a cadence | "Make.com" |
| **Manual entry / Import Wizard** | UI | fallback + bulk CSV/837/835 | always on |

## Adapter interface (build this seam)
Define a TS interface per integration in `/integrations`, plus a **simulator** implementation for
local/dev and a **real** implementation stub for prod (feature-flagged).

```ts
// /integrations/emr/EmrAdapter.ts
export interface EmrAdapter {
  pullCensus(since: Date): Promise<CensusEvent[]>;       // scheduled
  pullEpisodes(since: Date): Promise<Episode[]>;
  pullDemographics(memberIds: string[]): Promise<Member[]>;
  verifyConnection(): Promise<ConnectionHealth>;
  // push handled via webhook receiver below
}
```
```ts
// /integrations/clearinghouse/ClearinghouseAdapter.ts
export interface ClearinghouseAdapter {
  submitClaim(claim: Claim): Promise<SubmitResult>;      // 837
  ingestRemit(x12_835: string): Promise<Payment[]>;      // 835
  ingestRejections(): Promise<Denial[]>;                 // clearinghouse edits
  verifyConnection(): Promise<ConnectionHealth>;
}
```

### Local simulators (Milestone deliverable)
- **EMR simulator**: reads `./dataset/census_events.csv`, `members.csv`, and episode-shaped rows
  and streams them as if pulled on a schedule. A `verifyConnection()` that returns healthy + a
  "last sync N min ago" so the Connections screen looks live.
- **Clearinghouse simulator**: given a claim, returns Accepted/Rejected with realistic CARC/RARC;
  can emit an 835-shaped remit that the ingest path turns into `payment` rows; replays
  `denials.csv` (type=Rejection) as clearinghouse edits.
- **Webhook simulator**: posts `denial.created` / `auth.updated` / `payment.posted` events from
  `denials.csv` / `authorizations.csv` / `payments.csv` to the receiver on an interval.

## Scheduled jobs (worker)
- **EMR pull** (e.g. every 15 min): census + episodes → upsert; recompute census KPIs.
- **Clearinghouse poll** (e.g. hourly): remits + rejections → payments/denials; recompute A/R.
- **Reauth watcher** (daily): recompute `days_to_expiration`; raise alerts for ≤5 days; notify
  the assigned biller / operations.
- **Report delivery** (scheduled): render Billing Overview + UR PDF/CSV; deliver to configured
  recipients; log to `report_job`.
- **Data-quality sweep**: flag unmapped service codes, unmatched payments, claims missing an auth
  link → surface on Admin.

## Webhook receiver
- Verify signature (HMAC) per source; store raw in `webhook_event`; process idempotently by event
  id; auto-retry failures (max 3, backoff); expose the delivery log + manual **Retry** in the
  Connections screen (as in the prototype).

## Connections screen (C3) must show, per source
enabled toggle, status (Connected/Paused/Error), last sync time, records today, error count; plus
API keys (scoped, 90-day rotation policy, copy/revoke) and the webhook delivery log.

## Security for integrations
- Secrets in a vault/env, never in the DB or client.
- Inbound API keys are **scoped per source** and hashed at rest.
- All external calls over TLS; PHI-bearing payloads only over BAA-covered channels in prod.
- Every ingestion writes an `audit_log`/`import_batch` trail.

## "Swap to real" checklist
- [ ] Point `EmrAdapter` at real Kipu API creds (interface unchanged).
- [ ] Point `ClearinghouseAdapter` at real Waystar/Availity endpoints.
- [ ] Replace webhook simulator with real n8n/Make flows hitting the same receiver.
- [ ] Flip feature flags; simulators stay available for staging/demo.
