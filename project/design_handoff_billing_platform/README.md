# Handoff: Cholla Behavioral Health — Billing & UR Intelligence Platform

## Overview
A HIPAA-conscious billing and utilization-review (UR) intelligence platform for a
behavioral-health center (Cholla Behavioral Health, an AHCCCS/Medicaid-heavy Arizona
program). It has role-routed auth and four working areas: a **Billing Overview** dashboard,
a **Utilization Review / Authorizations** dashboard, a **Team Ops** work-queue surface, and
platform screens (Import Wizard, Connections, Settings, Admin). Everything is seeded with a
**synthetic 6-month dataset** (Jan 1 – Jun 30, 2026). No real PHI.

## TL;DR — how to "keep it exactly as it is"
This design is **not a throwaway mock** — it is self-contained, working HTML/JS that runs in
any modern browser. You have two faithful paths:

1. **Ship the design as-is (fastest, zero visual drift).**
   `Cholla Billing Platform.standalone.html` is a single self-contained file (all JS, the
   dataset, the logo, and fonts inlined). Open it directly, drop it behind any static host,
   or embed it in a route. It works offline and looks *pixel-identical* to what you saw.

2. **Run the source (to keep editing in this component format).** Serve the folder over any
   static server and open `Cholla Billing Platform.dc.html`:
   ```bash
   cd design_handoff_billing_platform
   python3 -m http.server 8080
   # open http://localhost:8080/Cholla%20Billing%20Platform.dc.html
   ```
   It must be served over http:// (not opened as a file://) because it loads `support.js`
   and `cholla-data.js`. `support.js` is a small runtime that renders the component; you do
   not edit it. All UI + logic lives in `Cholla Billing Platform.dc.html`.

3. **Port into an existing app (React/Vue/etc.).** If you must live inside a framework
   codebase, recreate the screens using this README + the source file as the pixel spec. The
   charts are hand-built inline SVG (no chart lib), so they translate cleanly to any stack.

> The `.dc.html` file is a **Design Component**: one HTML file with an inline template and a
> `class Component` logic block. It is a design reference / working prototype — production
> code should preserve its exact look and behavior, whether you keep it as HTML or reimplement
> it in your framework of choice.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, charts, copy, and interactions.
Recreate pixel-for-pixel. Exact tokens are listed below; exact values also live inline in the
source.

---

## File map
| File | What it is |
|------|-----------|
| `Cholla Billing Platform.standalone.html` | **Single-file, self-contained build.** Everything inlined. Share/host this to reproduce exactly. |
| `Cholla Billing Platform.dc.html` | Source: inline template + `class Component` logic (all UI, charts, page routing). |
| `support.js` | Design-Component runtime that mounts the `.dc.html` (React under the hood). Do not edit. |
| `cholla-data.js` | `window.CHOLLA_DATA = {…}` — the precomputed dashboard aggregates + sample table rows. |
| `assets/cholla-logo.png` | Cholla wordmark (blue script). Used in sidebar, top-bar org switcher, and login. |
| `dataset/` | The raw synthetic source data (CSVs + xlsx + `README-simulated-data.md`) the aggregates were computed from. |

`cholla-data.js` is **derived** from `dataset/`. If you reseed with new data, recompute the
same shape (see "Data layer" below) and the whole UI updates — no component changes needed.

---

## Design tokens

### Color
| Token | Hex | Use |
|-------|-----|-----|
| Primary blue | `#4C84C4` | Primary accents, active nav, chart series 1, links |
| Deep navy | `#21314F` | Sidebar, dark headers, primary text, chart series 2 |
| Terracotta | `#BE6A45` | Primary action buttons, alerts, chart series 3 |
| Sky tint 1 | `#EEF4FB` | App background, chip fills |
| Sky tint 2 | `#DCE8F6` | Card fills, badges, muted bars |
| White | `#FFFFFF` | Cards, surfaces |
| Success green | `#1F7A56` / `#2E9E73` | Collected $, positive deltas, "connected" |
| Alert red | `#C1453B` / `#B14233` | Expiring auths, denials, over-utilization |
| Amber | `#B5742A` / `#E0A32E` | Rejections, warnings |
| Teal | `#3F9C93` | Chart series 4 |
| Violet | `#7A6FB0` / `#5B4B94` | Chart series 5, UR-specialist role |
| Slate | `#8CA0BC` | "Other" chart segment, muted labels |
| Text muted | `#5A6B85` / `#7A8AA3` / `#9AA8BD` | Secondary/tertiary text |
| Border | `#DCE3EE` / `#E7EDF5` / `#F0F4F9` | Card borders, dividers, table rows |

Chart palette array (order): `['#4C84C4','#21314F','#BE6A45','#3F9C93','#7A6FB0','#2E9E73','#E0A32E','#8CA0BC']`

### Typography
- **Headings:** Poppins (500/600/700) — rounded geometric sans.
- **Body / UI:** Inter (400/500/600/700) — humanist sans.
- Loaded from Google Fonts. Common sizes: page title 26px Poppins 600; card title 15.5px
  Poppins 600; KPI value 27–34px Poppins 700; body 12.5–14px Inter; labels 11–12px Inter 600
  uppercase, letter-spacing .03–.05em.

### Shape & elevation
- Radius: cards 16–20px; pills/badges 999px; buttons/inputs 10–13px; device chips 11–12px.
- Card: `#fff` + `1px solid #DCE3EE` + radius 16–20px, padding ~18–22px.
- Insight banner: fill `#F3F8FD`, `1px solid #E1ECF8`, radius 12, a 7px `#4C84C4` dot +
  600/13px `#2C4468` text. (Deliberately **not** a left-border-accent card.)
- Shadows are used sparingly (login card, primary buttons): e.g. `0 30px 70px -30px rgba(33,49,79,.45)`.

### Status pills (label → [bg, fg])
Paid/Accepted/Active `#E3F3EC`/`#1F7A56` · Submitted/Pending `#DCE8F6`/`#2C5C94` ·
Draft `#EEF1F6`/`#5A6B85` · Rejected/Expiring `#FBEEDD`/`#B5742A` ·
Denied/Expired `#F7E3E0`/`#B14233` · Appeal `#EAE6F3`/`#5B4B94`.
Each pill is a rounded-999 chip with a 6px dot in the fg color.

---

## Global shell

### Sidebar (collapsible, `#21314F`)
- Width 246px expanded / 74px collapsed (icon-only), 180ms transition.
- Header: white chip containing `cholla-logo.png` + "BILLING & UR PLATFORM" caption.
- Nav grouped by section (Dashboards / Operations / Platform), gated by role (see below).
  Active item = `#4C84C4` fill, white text. Hover = `rgba(255,255,255,.08)`.
  The "Utilization Review" item shows a red `count` badge for expiring auths.
- Footer: Collapse toggle.

### Top bar (white, sticky)
- Org switcher (logo + chevron), **global date-range** segmented control
  (Today / 7d / 30d / MTD / QTD / Custom), **Payer** filter select, **Level-of-care** filter
  select, Sign out, and user identity (name + role + colored initials avatar).
- NOTE (current build): the date/payer/LOC controls are wired as UI state but the seeded
  aggregates are precomputed for the full 6-month period, so changing them does not re-slice
  the numbers. The one live filter behavior: selecting a Medicaid payer **auto-hides** the
  Patient-Responsibility panel on the Billing dashboard (`isMedicaid()`).

### Auth & roles
- Login screen: "Sign in with Microsoft" (Entra SSO, mocked), email/password fallback, and a
  **Demo "preview as role"** switcher (**Billing**, **Admin** — the Client role was removed).
- Role routing on sign-in: `admin → Admin Home`, otherwise `→ Team Ops`. Sidebar nav is
  filtered per role: Billing sees Dashboards + Operations; Admin adds the Platform group.
- User identity per role: Billing = "Marcus Webb, Billing Team" (terracotta avatar);
  Admin = "Ruth Okafor, Platform Admin" (navy avatar).

---

## Screens

### 1. Billing Overview (`nav = client-billing`)
8 KPI cards (Claims Billed, Total Charges, Total Collected, Net Collection Rate, Denial Rate,
Rejection Rate, Days in A/R, Clean Claim Rate) in a 4-col `minmax(0,1fr)` grid, then chart
cards each ending in a bold one-line **insight banner**:
- Claims volume over time (area line, monthly)
- Charges vs. Collected (grouped bars + collected line)
- Denials & rejections over time (stacked bars)
- Denial reasons (CARC donut with center total)
- Payer mix (collections donut, center = total collected)
- Revenue by service code (horizontal bars)
- Patient-responsibility split (donut) — **hidden when payer filter = a Medicaid plan**
- Claims Built vs. Census (leakage bars + unbilled-days callout)

Seeded headline values: 18,841 claims · $20.09M charges · $7.46M collected · 92.4% net ·
7.7% denial · 3.9% rejection · 45 days A/R · 96.1% clean · $2.63M open A/R.

### 2. Utilization Review / Authorizations (`nav = client-ur`)
6 KPI cards (Active Authorizations, Units/Days Remaining, **Auths Expiring ≤5 Days** in red,
Auth Denial Rate, Avg LOS · IOP, Current Census), a pulsing red alert banner for expiring
auths, then:
- Census by level of care (vertical bars)
- Authorization utilization (per-auth used/authorized progress bars; ≥90% turns red)
- Reauth runway (rows sorted by days-to-expiration; ≤5 days flagged red) — the marquee view
- Length of stay by LOC (box-plot: interquartile box + median line)
- Auth-denial vs. claim-denial explainer (two stat blocks clarifying the different stages)

Seeded: 84 active auths · 704 units remaining · 17 expiring ≤5d · 2.5% auth-denial · 45d IOP
LOS · 214 census.

### 3. Team Ops (`nav = ops`)
- Three automation sync tiles (Waystar clearinghouse, Kipu EHR, n8n webhook) with status dots.
- Work-queue tabbed table with real counts in the tab badges: **Claims 18,841 · Denials 1,763
  · Rejections 727 · Payments 13,125 · Authorizations 84**. Each tab renders a `DataTable`
  with status pills (see the pill map). Rows are real sample records from the dataset (member
  referenced by internal ID, per HIPAA guidance).
- Bulk-action buttons + four entry-tool cards (New Claim, Post Payment, Log Denial/Rejection,
  New/Update Auth).

### 4. Import Wizard (`nav = imports`)
5-step stepper (Upload → Map → Validate → Preview → Commit) with a validation summary
(valid / warnings / errors) and an error table. Static demo of the ingestion flow.

### 5. Connections & Automations (`nav = connections`, Admin)
Source cards (clearinghouse, EHR, n8n, Make.com, manual) with on/off toggles, sync status,
record + error counts; API-keys panel (endpoint + copy/revoke); webhooks delivery log + retry.

### 6. Settings (`nav = settings`, Admin)
Real dataset lists: **11 payers** (with Medicaid/Commercial/Self-Pay type + pay-days),
**18 service codes** (charge / allowed), **14 rendering providers** (BHMP/BHP/BHT), levels of
care with PA rules, users & roles, and a CARC/RARC reference table.

### 7. Admin Home (`nav = admin-home`, Admin)
System-health KPIs, a data-quality-flags panel, and an immutable audit-log feed.

---

## Interactions & behavior
- **Nav:** sidebar items call `go(id)` → swaps `pageContent`. Ops tabs call `setOpsTab`.
  Sidebar collapse toggles width. Login buttons set `authed` and route by role.
- **Charts** are pure inline SVG helpers on the component (`line`, `groupedBars`, `stacked`,
  `donut`, `vbars`, `hbars`) — deterministic from data, no external chart library, no
  animation state to preserve. Re-implement with any SVG or a chart lib; the math is in-file.
- **Animations:** login/auth cards use a subtle fade (`cb-fade`); the UR alert dot pulses
  (`cb-pulse`, 1.4s). Nav hover is a background transition.
- **Loading:** if `window.CHOLLA_DATA` is not yet present, pages render a "Loading dataset…"
  state and the component polls until the data script loads, then re-renders.

## State management
Single component state object: `{ authed, role, nav, dateRange, payer, loc, sidebarOpen,
opsTab, loginEmail, loginPass }`. All dashboard *data* is read from `window.CHOLLA_DATA`
(not state). To make the global filters live in production, slice server-side or precompute
per-filter aggregates and swap the object.

## Data layer (`cholla-data.js`)
`window.CHOLLA_DATA` shape (all synthetic, derived from `dataset/`):
```
meta{period,today}
kpi{claimsBilled,totalCharges,totalCollected,netCR,grossCR,denialRate,rejectionRate,
    cleanClaimRate,daysAR,openAR}
monthly[{m,claims,charges,collected}]        denialTrend[{m,denials,rejections}]
denialReasons[{code,desc,count}]             payerMix[{name,collected}]
serviceRevenue[{code,desc,amount}]           patientSplit{insurance,patient}
censusVsClaims{eligible,billed,unbilled}
ur{activeAuth,unitsRemaining,expiring5,authDenialRate,avgLosIOP,currentCensus}
censusByLOC[{loc,count}]  authUtil[{auth,loc,used,authorized}]  reauthRunway[{auth,loc,payer,days}]
losByLOC[{loc,lo,q1,med,q3,hi}]
ops{claims[],denials[],rejections[],payments[],auths[]}   counts{...}
settings{payers[],codes[],providers[]}
```
The `dataset/` CSVs map 1:1 to the platform entities (`claim`, `claim_line`, `payment`,
`denial`, `authorization`, `census_event`, `member`, `payer`, `service_code`, `provider`).
Join keys: `claim_id`, `member_id`, `episode_id`, `payer_id`. See
`dataset/README-simulated-data.md` for the full model and the formulas behind each KPI.

### Wiring to a real backend
Replace `cholla-data.js` with an endpoint returning the same JSON shape (e.g. Supabase/
Postgres per the spec). Keep member-level fields gated to Billing/UR/Admin roles; client-facing
aggregates should stay de-identified. Every create/edit/delete/export should hit an audit log.

## Assets
- `assets/cholla-logo.png` — Cholla wordmark (blue script). Swap with the production logo;
  it appears in the sidebar header (on a white chip), the top-bar org switcher, and login.
- Fonts: Poppins + Inter via Google Fonts (`<link>` in the file head). Self-host for offline.
- Icons: inline SVG (stroke-based), defined in the `icon()` helper. No icon font.

## Notes / caveats to preserve or productionize
- Front-end demo: mocked SSO, no real persistence, synthetic data.
- Global date/payer/LOC filters are display controls over precomputed aggregates (except the
  Medicaid → hide patient-responsibility behavior). Make them live when wiring the backend.
- Numbers intentionally match `dataset/README-simulated-data.md` headline KPIs.
