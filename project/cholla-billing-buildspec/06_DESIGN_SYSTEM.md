# 06 · Design System (pixel spec)

Match the prototype exactly. Every value below also appears inline in
`reference/Cholla Billing Platform.dc.html` — when in doubt, read the source. Feel: calm,
warm-clinical, dignified, accessible (WCAG-AA). Rounded cards, pill buttons, generous spacing,
large touch targets. **Avoid AI-slop tropes** (no gradient-heavy backgrounds, no emoji, no
left-border-accent cards).

## Color tokens
| Token | Hex | Use |
|-------|-----|-----|
| `blue` | `#4C84C4` | primary accent, active nav, chart series 1, links |
| `navy` | `#21314F` | sidebar, dark headers, primary text, chart series 2 |
| `terracotta` | `#BE6A45` | primary action buttons, alerts, chart series 3 |
| `sky-1` | `#EEF4FB` | app background, chip fills |
| `sky-2` | `#DCE8F6` | card fills, badges, muted bars |
| `white` | `#FFFFFF` | cards, surfaces |
| `green` / `green-2` | `#1F7A56` / `#2E9E73` | collected $, positive deltas, connected |
| `red` / `red-2` | `#C1453B` / `#B14233` | expiring auths, denials, over-utilization |
| `amber` / `amber-2` | `#B5742A` / `#E0A32E` | rejections, warnings |
| `teal` | `#3F9C93` | chart series 4 |
| `violet` / `violet-2` | `#7A6FB0` / `#5B4B94` | chart series 5, UR-specialist role |
| `slate` | `#8CA0BC` | "Other" segments, muted labels |
| `text-2/3/4` | `#5A6B85` / `#7A8AA3` / `#9AA8BD` | secondary/tertiary text |
| `border-1/2/3` | `#DCE3EE` / `#E7EDF5` / `#F0F4F9` | card borders, dividers, table rows |

**Chart palette order:** `#4C84C4, #21314F, #BE6A45, #3F9C93, #7A6FB0, #2E9E73, #E0A32E, #8CA0BC`

## Typography
- **Headings**: Poppins 500/600/700 (rounded geometric sans).
- **Body/UI**: Inter 400/500/600/700 (humanist sans).
- Sizes: page title 26px Poppins 600 · card title 15.5px Poppins 600 · KPI value 27–34px
  Poppins 700 · body 12.5–14px Inter · labels 11–12px Inter 600 UPPERCASE letter-spacing .03–.05em.
- Load from Google Fonts; self-host for offline/prod.

## Shape & elevation
- Radius: cards 16–20 · pills/badges 999 · buttons/inputs 10–13 · chips 11–12.
- Card: `#fff` + `1px solid #DCE3EE` + radius 16–20 + padding 18–22.
- **Insight banner**: fill `#F3F8FD`, `1px solid #E1ECF8`, radius 12, a 7px `#4C84C4` dot +
  600/13px `#2C4468` text.
- Shadows used sparingly: login card `0 30px 70px -30px rgba(33,49,79,.45)`; primary buttons
  `0 8–12px 18–24px -8/-10px rgba(190,106,69,.6)`.

## Status pills (label → [bg, fg]); each pill = rounded-999 chip + 6px dot in fg
- Paid / Accepted / Active → `#E3F3EC` / `#1F7A56`
- Submitted / Pending → `#DCE8F6` / `#2C5C94`
- Draft → `#EEF1F6` / `#5A6B85`
- Rejected / Expiring → `#FBEEDD` / `#B5742A`
- Denied / Expired → `#F7E3E0` / `#B14233`
- Appeal → `#EAE6F3` / `#5B4B94`
- Correct & resubmit → `#DCE8F6` / `#2C5C94` · Write-off → `#EEF1F6` / `#5A6B85`

## Core components (compose from Fable 5 where possible)
- **Sidebar** (collapsible, grouped, role-filtered, badge support)
- **TopBar** (org switcher, segmented date-range, filter selects, user menu)
- **KpiCard** (label, value, optional up/down delta, sub) — 4-col `minmax(0,1fr)` grid
- **ChartCard** (title, sub, chart, insight banner, optional right slot)
- **StatusPill / Badge** (map above)
- **DataTable** (grid template columns, header row, status pills, action buttons; empty state)
- **SegmentedControl** (date-range, ops tabs)
- **Select / Input / Toggle switch** (rounded, `#DCE3EE` border, blue focus)
- **Button**: primary = terracotta filled; secondary = white + `#DCE3EE` border
- **Stepper** (Import Wizard, 5 steps)
- **Donut / Line / GroupedBars / StackedBars / VBars / HBars / BoxPlot** — inline SVG helpers;
  reproduce the math from the prototype (`donut`, `line`, `groupedBars`, `stacked`, `vbars`,
  `hbars`, and the LOS box-plot). Deterministic from data; no external dep required.
- **AlertBanner** (pulsing red dot for expiring auths)
- **AuthUtilizationBar** (used/authorized; ≥90% turns red)
- **ReauthRunwayRow** (progress by days-to-expiration; ≤5 red)

## Icons
Inline stroke SVG (see the `icon()` helper: billing, ur, ops, import, plug, settings, admin).
No icon font, no emoji.

## Accessibility
- WCAG-AA contrast on all text/controls. Focus-visible states. Hit targets ≥40px. Charts get
  text alternatives / data tables. Respect reduced-motion for the pulse/fade.

## Logo
`assets/cholla-logo.png` (blue script wordmark). Appears in: sidebar header (on a white chip so
it reads on navy), top-bar org switcher, and login. Keep a clean slot; allow swap to a
production logo.

## Sibling product (brand consistency)
`reference/Cholla Check-In System.*` is the companion group check-in/out product. Reuse the same
tokens/type/pills so the two feel like one family (the client may want them linked later).
