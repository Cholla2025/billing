# Cholla Behavioral Health — Billing & UR Intelligence Platform
## Full Build Specification for Claude Code

This folder is a **complete, self-contained build brief**. It contains everything needed to
build a production-grade, backend-ready behavioral-health **billing + utilization-review (UR)**
platform for **Cholla Behavioral Health** (an AHCCCS/Medicaid-heavy Arizona program).

A high-fidelity, fully-designed **front-end prototype already exists** (see `reference/`). Your
job is to turn it into a real, end-to-end, working application — same look and feel, real
backend, real auth, real EMR ingestion, three distinct user-facing surfaces, and role-based
access for a billing team.

> There is **no real PHI** here. All data is synthetic. Keep it that way in every seed/fixture.

---

## Read these in order

| # | File | What it covers |
|---|------|----------------|
| 00 | **`00_CLAUDE_CODE_PROMPT.md`** | The paste-in kickoff prompt + working agreement. Start here. |
| 01 | `01_PRODUCT_OVERVIEW.md` | The product, who it's for, the three surfaces, goals. |
| 02 | `02_ARCHITECTURE.md` | Recommended stack, repo layout, environments, "backend-ready" plan. |
| 03 | `03_DATA_MODEL.md` | Entities, relationships, schema (maps 1:1 to `dataset/`). |
| 04 | `04_ROLES_AND_PERMISSIONS.md` | Every role, what they see, what they can do (RBAC matrix). |
| 05 | `05_SURFACES_AND_SCREENS.md` | Screen-by-screen spec for all three surfaces. |
| 06 | `06_DESIGN_SYSTEM.md` | Exact tokens, components, charts — pixel spec. |
| 07 | `07_EMR_AND_INTEGRATIONS.md` | EMR/clearinghouse ingestion, automations, reports. |
| 08 | `08_BACKEND_API.md` | REST/RPC surface, endpoints, auth, audit, security. |
| 09 | `09_SEED_DATA.md` | The synthetic dataset, how to load it, headline KPIs to match. |
| 10 | `10_BUILD_PLAN.md` | Milestones, acceptance criteria, and a definition of done. |

## What's in this folder
```
cholla-billing-buildspec/
├── 00_CLAUDE_CODE_PROMPT.md … 10_BUILD_PLAN.md   ← the spec (read in order)
├── reference/
│   ├── Cholla Billing Platform.standalone.html    ← the finished design, single file. THE visual target.
│   ├── Cholla Billing Platform.dc.html            ← design source (template + logic, inline SVG charts)
│   ├── Cholla Check-In System.standalone.html     ← sibling product (group check-in) for brand consistency
│   ├── Cholla Check-In System.dc.html             ← its source
│   ├── cholla-data.js                             ← precomputed dashboard aggregates (window.CHOLLA_DATA)
│   └── support.js                                 ← runtime for the .dc.html prototypes (reference only)
├── assets/
│   └── cholla-logo.png                            ← the Cholla wordmark
└── dataset/
    ├── *.csv (claims, claim_lines, payments, denials, authorizations,
    │          census_events, members, payers, service_codes, providers)
    ├── *.xlsx
    └── README-simulated-data.md                   ← the data model + KPI formulas
```

## The one-paragraph brief
Build **one platform, three surfaces**: (1) a **Client Portal** where Cholla leadership sees a
clean, de-identified view of their billing health; (2) a **Leadership / Operations** surface
that runs on automation — reports pulled from the EMR, denials/auth webhooks, roll-up KPIs; and
(3) a **Billing Workspace** used by the billing team, where a **Billing Manager** and a
**Junior Biller** have different permissions but work the same claims, denials, payments,
authorizations, imports, and settings. It must look exactly like the prototype in `reference/`,
be genuinely functional, and be architected so a real backend + real EMR feeds drop in cleanly.
