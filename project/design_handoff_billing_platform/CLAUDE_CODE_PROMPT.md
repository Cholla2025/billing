# CLAUDE CODE — BUILD PROMPT (paste this in)

Copy everything in the fenced block below into Claude Code, from the root of this folder
(`design_handoff_billing_platform/`). It tells Claude Code to stand the platform up **exactly
as designed, with the mock data**, and not to redesign anything.

---

```
You are helping me ship a finished, high-fidelity web app called the "Cholla Behavioral
Health — Billing & UR Intelligence Platform." It already exists in this folder as working,
self-contained HTML/JS. Your job is to make it RUN EXACTLY AS-IS with the included mock data —
NOT to redesign, restyle, or "improve" anything.

NON-NEGOTIABLE RULES
- Preserve the design pixel-for-pixel: same layout, colors, fonts (Poppins + Inter), charts,
  copy, spacing, icons, status pills, and interactions. Do not change the visual design.
- Use the included synthetic dataset as the seed data. Do not invent new numbers. The headline
  KPIs must stay: 18,841 claims · $20.09M charges · $7.46M collected · 92.4% net collection ·
  7.7% denial · 3.9% rejection · 45 days A/R · 96.1% clean · $2.63M open A/R · 84 active auths ·
  17 auths expiring <=5 days · 214 census.
- No real PHI. This is synthetic demo data only.

WHAT'S IN THIS FOLDER
- `Cholla Billing Platform.standalone.html` — single self-contained build (all JS, data, logo,
  fonts inlined). This is the source of truth for how it must look and behave.
- `Cholla Billing Platform.dc.html` — the editable source: one HTML file with an inline
  template + a `class Component` logic block (charts are hand-built inline SVG). Runs via
  `support.js` (a small runtime — do not edit it) and reads data from `cholla-data.js`
  (`window.CHOLLA_DATA = {...}`).
- `cholla-data.js` — precomputed dashboard aggregates + sample table rows (derived from
  `dataset/`).
- `dataset/` — the raw synthetic CSVs (+ xlsx and `README-simulated-data.md`) the aggregates
  came from. Join keys: claim_id, member_id, episode_id, payer_id.
- `assets/cholla-logo.png` — the logo (sidebar, top-bar org switcher, login).
- `README.md` — full design spec: tokens, every screen, data shape, and behavior. Treat it as
  the authoritative spec.

DELIVER THIS (pick the stack I tell you below; if I didn't say, ask me once, then proceed):

Option A — Static (default, closest to "exactly as is"):
  Create a minimal project that serves this app over http:// (it must NOT be opened as file://
  because it loads support.js and cholla-data.js). For example a tiny Vite or Express static
  server, or just document `python3 -m http.server`. Wire it so `npm install && npm run dev`
  (or an equally simple command) opens the app at the login screen. Keep
  `Cholla Billing Platform.dc.html`, `support.js`, `cholla-data.js`, `assets/`, and `dataset/`
  intact. Add a README with run instructions. Do not alter the design files' contents.

Option B — React/Next (only if I ask for a framework):
  Recreate the screens 1:1 in React using README.md + the .dc.html as the pixel spec. Keep the
  charts as inline SVG (port the helper math from the .dc.html: line, groupedBars, stacked,
  donut, vbars, hbars). Load `window.CHOLLA_DATA` from `cholla-data.js` (or import the JSON) so
  the numbers are identical. Match every token in README.md exactly. Verify each screen against
  the standalone HTML before calling it done.

APP BEHAVIOR TO PRESERVE (see README.md for detail)
- Login: "Sign in with Microsoft" (mock SSO) + email/password fallback + a demo "preview as
  role" switcher with two roles: Billing and Admin. Role routing on sign-in: admin -> Admin
  Home, otherwise -> Team Ops. Sidebar nav is filtered by role.
- Collapsible navy sidebar; sticky top bar with org switcher, global date-range
  (Today/7d/30d/MTD/QTD/Custom), Payer + Level-of-care filters, user menu.
- Screens: Billing Overview (8 KPIs + charts, each with a bold insight line; the
  Patient-Responsibility panel auto-hides when a Medicaid payer is selected), Utilization
  Review/Authorizations (KPIs + census + auth utilization + reauth runway + LOS box-plots +
  auth-vs-claim denial explainer; pulsing red alert for expiring auths), Team Ops (automation
  tiles + tabbed work queues with real counts + entry tools), Import Wizard, Connections,
  Settings (real 11 payers / 18 codes / 14 providers), Admin Home.
- Keep it a front-end demo: mocked SSO, no backend, the global date/payer/LOC filters are
  display controls over the precomputed aggregates (except the Medicaid -> hide
  patient-responsibility behavior). Do NOT wire a live backend unless I ask.

ACCEPTANCE CHECK before you finish:
1) App loads at the login screen with no console errors.
2) Sign in as Billing -> lands on Team Ops; sign in as Admin -> lands on Admin Home.
3) Billing Overview shows the exact headline KPIs above and all charts render.
4) UR dashboard shows 84 active auths and the "17 expiring <=5 days" red alert.
5) Team Ops tab badges read 18,841 / 1,763 / 727 / 13,125 / 84.
6) It visually matches `Cholla Billing Platform.standalone.html` side-by-side.

Start by reading README.md and opening the standalone HTML to see the target. Then set up
Option A unless I told you Option B. Ask me at most one clarifying question, then build.
```

---

## Optional: which stack?
- If you want the **least risk of any visual change**, tell Claude Code **"use Option A"**
  (serve the existing files). It will look identical because it *is* the same files.
- If your team needs it inside a **React/Next codebase**, tell it **"use Option B, React"** —
  it will recreate the screens from the spec and match the standalone build.
