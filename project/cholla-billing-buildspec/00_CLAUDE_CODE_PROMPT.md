# 00 · Claude Code Kickoff Prompt

Paste the fenced block below into Claude Code with this whole `cholla-billing-buildspec/`
folder open as the working directory. Read the rest of the numbered files before you write code.

> On "Fable 5": the user wants you to use **Fable 5** as the component/design tooling for this
> build. **Research it first** (official docs + component catalog) and use its component library
> to its full potential — build/compose the components this system needs rather than hand-rolling
> primitives. If, after researching, Fable 5 is not a fit for a given piece, note it explicitly
> and choose the closest well-supported equivalent — but default to using Fable 5 components
> everywhere they apply. Do not silently skip it.

---

```
ROLE
You are building a production-grade, backend-ready Behavioral Health Billing & Utilization
Review platform for "Cholla Behavioral Health." A complete high-fidelity design prototype
already exists in ./reference/. Build the REAL system to match it — same look and feel — while
making it genuinely functional and architected for a real backend and real EMR data feeds.

FIRST, DO RESEARCH (before writing app code)
1. Research "Fable 5" (the component/design tooling the client chose). Read its docs and
   component catalog. Plan to use its components fully across this build. Summarize in
   /docs/fable5-notes.md how you'll use it per surface.
2. Research the domain enough to be correct: AHCCCS (Arizona Medicaid) behavioral-health
   billing, levels of care (OP, IOP, PHP, BHRF, Inpatient), prior authorization / concurrent
   review, CARC/RARC denial codes, 837/835 EDI + clearinghouse rejections, net collection rate,
   days in A/R, clean claim rate. Capture key rules in /docs/domain-notes.md.
3. Read every file in this folder in order (README.md then 01…10). Open
   reference/Cholla Billing Platform.standalone.html in a browser — that is the visual target.

WHAT TO BUILD — ONE PLATFORM, THREE SURFACES
A) Client Portal  — Cholla leadership see a de-identified, read-focused view of their billing
   health (KPIs, trends, payer mix, denial drivers, collections). No member-level PHI.
B) Leadership / Operations — automation-driven: reports pulled from the EMR, denial/auth
   webhooks, org-wide roll-ups, exportable reports. This is the "runs itself" surface.
C) Billing Workspace — the billing team's cockpit: claims, denials, rejections, payments,
   authorizations, import wizard, connections, settings. TWO team roles with different
   permissions share it: Billing Manager (full) and Junior Biller (scoped — see 04).

HARD REQUIREMENTS
- Pixel-match the prototype: layout, colors, Poppins+Inter type, charts, copy, pills, spacing,
  icons, sidebar/topbar, login. Design tokens are in 06_DESIGN_SYSTEM.md and inline in the
  .dc.html source. Do not redesign.
- Real auth with roles + RBAC exactly as 04_ROLES_AND_PERMISSIONS.md specifies. Enforce
  permissions on the SERVER, not just the UI.
- Backend-ready and actually wired: real database, real API (08_BACKEND_API.md), real queries.
  Seed it from ./dataset (09_SEED_DATA.md). The headline KPIs must reproduce exactly (listed in
  09). Mock only the external systems that can't run locally (SSO IdP, live clearinghouse, EMR),
  behind adapters with a clearly documented "swap to real" seam.
- EMR ingestion + automations as adapters (07_EMR_AND_INTEGRATIONS.md): a working local
  simulator + a documented interface so real Kipu/Waystar/n8n feeds drop in.
- Audit log: every create/update/delete/export records actor, entity, before/after, timestamp.
- Synthetic data only. No real PHI, ever.

STACK
Default to the recommended stack in 02_ARCHITECTURE.md unless I tell you otherwise. If you have
a strong reason to deviate, propose it in one short message, then proceed. Use Fable 5 for the
component layer as researched above.

DELIVERABLES
- A running monorepo (web app + API + db) with `docker compose up` OR `npm install && npm run
  dev` bringing the whole thing up seeded, at the login screen, no console errors.
- /docs with: fable5-notes.md, domain-notes.md, architecture.md, api.md, rbac.md, and a
  runbook (setup, seed, test, deploy).
- Automated tests for RBAC, the KPI calculations (must match 09), and the ingestion adapters.
- A short screencast script or checklist proving the acceptance criteria in 10_BUILD_PLAN.md.

WAY OF WORKING
- Work in milestones from 10_BUILD_PLAN.md. After each milestone, run the acceptance checks and
  summarize what's done + what's next.
- Keep a /docs/DECISIONS.md log of any deviations from this spec and why.
- Ask me at most a few high-value clarifying questions up front, then build autonomously.

Start by producing: (1) fable5-notes.md + domain-notes.md from your research, (2) a concrete
architecture + repo plan, (3) the milestone checklist you'll execute. Then begin Milestone 0.
```

---

## Notes for the human (you)
- If you have a **specific stack** in mind, add one line when you paste (e.g. "Use Next.js +
  Supabase" or "Use the stack in 02"). Otherwise it'll use the recommended one.
- If "Fable 5" is a specific tool/library you have a link or license for, paste that link in too
  — it makes the research step land faster.
- Everything the agent needs to reproduce the numbers is in `dataset/` and `09_SEED_DATA.md`.
