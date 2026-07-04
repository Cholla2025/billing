/* eslint-disable @typescript-eslint/no-explicit-any */
// Page renderers ported from the Cholla prototype, driven by live API data.
import React from "react";
import {
  comma, money, moneyK, fmtDate, nextPill, insight, card, vbars, groupedBars, line,
  stacked, donut, hbars, pill, kpiRow, table, grid1, grid2, loading, CHART,
} from "./render";

const el = React.createElement;

export interface Ctx {
  opsTab: string;
  setOpsTab: (t: string) => void;
  isMedicaid: boolean;
  role: string;
}

// ============================ BILLING OVERVIEW ============================
export function pageBilling(D: any, ctx: Ctx) {
  if (!D) return loading();
  const k = D.kpi;
  const PAL = CHART;
  const kpis = [
    { label: "Claims Billed", value: comma(k.claimsBilled), sub: "Jan–Jun 2026" },
    { label: "Total Charges", value: moneyK(k.totalCharges), sub: "gross billed" },
    { label: "Total Collected", value: moneyK(k.totalCollected), color: "#1F7A56", sub: "≈ $14.9M annualized" },
    { label: "Net Collection Rate", value: k.netCR + "%", color: "#4C84C4", sub: "of allowed" },
    { label: "Denial Rate", value: k.denialRate + "%", sub: "of adjudicated" },
    { label: "Rejection Rate", value: k.rejectionRate + "%", sub: "clearinghouse" },
    { label: "Days in A/R", value: String(k.daysAR), sub: "open A/R " + moneyK(k.openAR) },
    { label: "Clean Claim Rate", value: k.cleanClaimRate + "%", color: "#4C84C4", sub: "first pass" },
  ];
  const volume = D.monthly.map((m: any) => ({ l: m.m, v: m.claims }));
  const cats = D.monthly.map((m: any) => m.m);
  const charges = D.monthly.map((m: any) => m.charges);
  const collected = D.monthly.map((m: any) => m.collected);
  const denParts = D.denialTrend.map((t: any) => [{ v: t.denials, c: "#BE6A45" }, { v: t.rejections, c: "#E0A32E" }]);
  const denReasons = D.denialReasons.map((r: any, i: number) => ({ l: r.code + " " + (r.desc.length > 18 ? r.desc.slice(0, 18) + "…" : r.desc), v: r.count, c: PAL[i % PAL.length] }));
  const totalDen = D.denialReasons.reduce((s: number, r: any) => s + r.count, 0);
  const pm = D.payerMix.slice(0, 6);
  const pmOther = D.payerMix.slice(6).reduce((s: number, p: any) => s + p.collected, 0);
  const payerMix = pm.map((p: any, i: number) => ({ l: p.name, v: p.collected, c: PAL[i % PAL.length] }));
  if (pmOther > 0) payerMix.push({ l: "Other payers", v: pmOther, c: "#8CA0BC" });
  const medicaidShare = Math.round(
    D.payerMix.filter((p: any) => ["AZ Complete Health", "Mercy Care", "Care1st AZ", "Banner UFC", "UHC Community", "Molina AZ"].includes(p.name)).reduce((s: number, p: any) => s + p.collected, 0) / D.kpi.totalCollected * 100,
  );
  const codes = D.serviceRevenue.map((c: any) => ({ l: c.code + " · " + c.desc, v: c.amount, c: "#4C84C4" }));
  const topCodePct = Math.round(D.serviceRevenue[0].amount / D.serviceRevenue.reduce((s: number, c: any) => s + c.amount, 0) * 100);
  const cvc = D.censusVsClaims;
  const census = [{ l: "Billable days", v: cvc.eligible, c: "#DCE8F6" }, { l: "Claims built", v: cvc.billed, c: "#4C84C4" }];
  const leakDollars = Math.round(cvc.unbilled * 235);

  const blocks = [
    card("Claims volume over time", "Monthly submitted claims · Jan–Jun 2026", line(volume, { h: 180 }), "Volume holds ~3,100 claims/mo; the June dip reflects the open-A/R tail, not lower activity."),
    card("Charges vs. Collected", "Gross charges (bars) vs. collected (line), by month", groupedBars(cats, charges, collected, { h: 190 }), "Gross-to-net gap is contractual: Medicaid allowed rates run ~37% of charges, netting " + k.netCR + "% of allowed."),
    card("Denials & rejections over time", "Payer denials + clearinghouse rejections, monthly", stacked(cats, denParts, { h: 170 }), "Rejections (" + k.rejectionRate + "%) stop at the clearinghouse; denials (" + k.denialRate + "%) are adjudicated by the payer."),
    card("Denial reasons", "CARC breakdown · " + comma(totalDen) + " denials", donut(denReasons, { size: 150, center: comma(totalDen), centerSub: "denials" }), "CO-197 (auth absent) leads — the top preventable driver across all payers."),
    card("Payer mix", "Collections by payer · 6-mo", donut(payerMix, { size: 150, money: true, center: moneyK(k.totalCollected), centerSub: "collected" }), "AHCCCS Medicaid plans account for " + medicaidShare + "% of collections."),
    card("Revenue by service code", "Top CPT/HCPCS by allowed revenue", hbars(codes, { money: true }), "BHRF residential per-diem (H0018) is the single largest revenue line at " + topCodePct + "%."),
  ];

  const out: any[] = [kpiRow(kpis)];
  out.push(grid1(blocks[0]));
  out.push(grid1(blocks[1]));
  out.push(grid2(blocks[2], blocks[3]));
  out.push(grid2(blocks[4], blocks[5]));
  if (!ctx.isMedicaid) {
    const ps = D.patientSplit;
    const ptPct = Math.round(ps.patient / (ps.insurance + ps.patient) * 100);
    const pr = [{ l: "Insurance paid", v: ps.insurance, c: "#4C84C4" }, { l: "Patient responsibility", v: ps.patient, c: "#BE6A45" }];
    out.push(grid1(card("Patient responsibility split", "Insurance vs. patient portion (copay + coinsurance + deductible)", donut(pr, { size: 150, money: true, center: ptPct + "%", centerSub: "patient" }), "Patient portion is " + ptPct + "% of collections — concentrated in the commercial book (Medicaid pt-resp ≈ $0).")));
  }
  out.push(grid1(card("Claims Built vs. Census", "The leakage view — billable program-days vs. claims built",
    el("div", {}, vbars(census, { h: 150, max: cvc.eligible * 1.15 }),
      el("div", { style: { marginTop: 6, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } },
        el("span", { style: { background: "#FBEEDD", color: "#B5742A", font: "700 12px Inter", padding: "6px 12px", borderRadius: 999 } }, comma(cvc.unbilled) + " unbilled billable days"),
        el("span", { style: { font: "600 12.5px Inter", color: "#5A6B85" } }, "≈ " + moneyK(leakDollars) + " in allowed revenue potentially left on the floor"))),
    "Close the census-to-claims gap and recover an estimated " + moneyK(leakDollars) + " in billable days across the period.")));
  return el("div", {}, ...out);
}

// ============================ UTILIZATION REVIEW ============================
export function pageUR(D: any) {
  if (!D) return loading();
  const u = D.ur;
  const kpis = [
    { label: "Active Authorizations", value: comma(u.activeAuth), sub: "across all LOC" },
    { label: "Units / Days Remaining", value: comma(u.unitsRemaining), sub: "aggregate authorized" },
    { label: "Auths Expiring ≤5 Days", value: String(u.expiring5), color: "#C1453B", delta: "act now", down: true },
    { label: "Auth Denial Rate", value: u.authDenialRate + "%", sub: "UM / medical necessity" },
    { label: "Avg LOS · IOP", value: u.avgLosIOP + "d", sub: "IOP level of care" },
    { label: "Current Census", value: comma(u.currentCensus), sub: "clients on service" },
  ];
  const locColor: any = { OP: "#4C84C4", IOP: "#21314F", PHP: "#3F9C93", BHRF: "#BE6A45", Inpatient: "#7A6FB0" };
  const census = D.censusByLOC.map((c: any) => ({ l: c.loc, v: c.count, c: locColor[c.loc] || "#4C84C4" }));
  const censusTop = D.censusByLOC.slice(0, 2).reduce((s: number, c: any) => s + c.count, 0);
  const censusPct = Math.round(censusTop / u.currentCensus * 100);
  const util = D.authUtil.map((a: any) => ({ l: "Auth " + a.auth + " · " + a.loc, auth: a.authorized, used: a.used }));
  const runway = D.reauthRunway.map((a: any) => ({ id: a.auth, loc: a.loc, payer: a.payer, days: a.days }));

  const utilBody = el("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },
    ...util.map((u2: any, i: number) => { const rem = u2.auth - u2.used; const pct = Math.round(u2.used / u2.auth * 100); const over = pct >= 90;
      return el("div", { key: i },
        el("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 } },
          el("span", { style: { font: "600 12.5px Inter", color: "#21314F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 } }, u2.l),
          el("span", { style: { font: "600 12px Inter", color: over ? "#B14233" : "#5A6B85", flex: "none" } }, u2.used + " / " + u2.auth + " units · " + rem + " left")),
        el("div", { style: { height: 10, background: "#EEF3F9", borderRadius: 999, overflow: "hidden" } },
          el("div", { style: { height: "100%", width: pct + "%", background: over ? "#C1453B" : pct < 50 ? "#E0A32E" : "#4C84C4", borderRadius: 999 } }))); }));

  const maxRunway = Math.max(14, ...runway.map((r: any) => r.days));
  const runwayBody = el("div", { style: { display: "flex", flexDirection: "column", gap: 9 } },
    ...runway.map((r: any, i: number) => { const flag = r.days <= 5; const maxD = maxRunway;
      return el("div", { key: i, style: { display: "grid", gridTemplateColumns: "96px 60px 1fr 96px", gap: 12, alignItems: "center", padding: "8px 12px", background: flag ? "#FCF0EC" : "#F7FAFE", borderRadius: 11, border: "1px solid " + (flag ? "#F1D6CE" : "#E7EDF5") } },
        el("span", { style: { font: "700 12.5px Inter", color: "#21314F" } }, "#" + r.id),
        el("span", { style: { font: "600 11.5px Inter", color: "#5A6B85" } }, r.loc),
        el("div", { style: { height: 8, background: "#E7EDF5", borderRadius: 999, overflow: "hidden" } },
          el("div", { style: { height: "100%", width: (maxD - r.days) / maxD * 100 + "%", background: flag ? "#C1453B" : "#4C84C4", borderRadius: 999 } })),
        el("span", { style: { font: "700 12px Inter", color: flag ? "#C1453B" : "#5A6B85", textAlign: "right" } }, r.days + " day" + (r.days === 1 ? "" : "s"))); }));

  const losMax = Math.max(...D.losByLOC.map((b: any) => b.hi), 1);
  const losBody = el("div", { style: { display: "flex", flexDirection: "column", gap: 13 } },
    ...D.losByLOC.map((b: any, i: number) => { const scale = (v: number) => v / losMax * 100;
      return el("div", { key: i },
        el("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 5 } },
          el("span", { style: { font: "600 12.5px Inter", color: "#21314F" } }, b.loc),
          el("span", { style: { font: "600 11.5px Inter", color: "#9AA8BD" } }, "median " + b.med + "d")),
        el("div", { style: { position: "relative", height: 16 } },
          el("div", { style: { position: "absolute", top: 7, left: scale(b.lo) + "%", width: scale(b.hi) - scale(b.lo) + "%", height: 2, background: "#C9D6E8" } }),
          el("div", { style: { position: "absolute", top: 2, left: scale(b.q1) + "%", width: scale(b.q3) - scale(b.q1) + "%", height: 12, background: "#DCE8F6", border: "1px solid #4C84C4", borderRadius: 4 } }),
          el("div", { style: { position: "absolute", top: 0, left: scale(b.med) + "%", width: 3, height: 16, background: "#21314F", borderRadius: 2 } }))); }));

  const out: any[] = [kpiRow(kpis)];
  out.push(el("div", { style: { display: "flex", alignItems: "center", gap: 12, background: "#FCF0EC", border: "1px solid #F1D6CE", borderRadius: 14, padding: "14px 18px", marginBottom: 18 } },
    el("span", { style: { width: 9, height: 9, borderRadius: 999, background: "#C1453B", animation: "cb-pulse 1.4s infinite", flex: "none" } }),
    el("span", { style: { font: "700 13.5px Inter", color: "#8A2E24" } }, u.expiring5 + " authorizations expire within 5 days — members at risk of unbillable days. Start reauth now.")));
  out.push(grid2(
    card("Census by level of care", "Active clients per LOC", vbars(census, { h: 170 }), D.censusByLOC[0].loc + " + " + (D.censusByLOC[1] ? D.censusByLOC[1].loc : "") + " make up " + censusPct + "% of census — the auth-intensive core of the continuum."),
    card("Authorization utilization", "Units used vs. authorized · top active auths", utilBody, "Auths above 90% utilization should be flagged for reauthorization before units run out.")));
  out.push(grid1(card("Reauth runway", "Active authorizations by days to expiration — anything ≤5 days is flagged", runwayBody, "The highest-leverage save in the platform: " + u.expiring5 + " active auths expire within 5 days.")));
  out.push(grid2(
    card("Length of stay by LOC", "Distribution (box = interquartile, line = median), days", losBody, "BHRF residential shows the widest LOS spread — reauth cadence varies most here."),
    card("Auth denials vs. claim denials", "Two different stages — clarified",
      el("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },
        el("div", { style: { background: "#F7FAFE", border: "1px solid #E7EDF5", borderRadius: 12, padding: "14px 16px" } },
          el("div", { style: { font: "700 22px Poppins", color: "#BE6A45" } }, u.authDenialRate + "%"),
          el("div", { style: { font: "600 12.5px Inter", color: "#21314F", marginTop: 2 } }, "Authorization denial rate"),
          el("div", { style: { font: "500 11.5px Inter", color: "#9AA8BD", marginTop: 3 } }, "Utilization-management / medical-necessity stage — before or during service")),
        el("div", { style: { background: "#F7FAFE", border: "1px solid #E7EDF5", borderRadius: 12, padding: "14px 16px" } },
          el("div", { style: { font: "700 22px Poppins", color: "#21314F" } }, D.kpi.denialRate + "%"),
          el("div", { style: { font: "600 12.5px Inter", color: "#21314F", marginTop: 2 } }, "Claim denial rate"),
          el("div", { style: { font: "500 11.5px Inter", color: "#9AA8BD", marginTop: 3 } }, "Claim-adjudication stage — after the claim is submitted to the payer"))),
      "Different stages, different fixes: UM denials need clinical documentation; claim denials need billing edits.")));
  return el("div", {}, ...out);
}

// ============================ TEAM OPS ============================
export function pageOps(D: any, ctx: Ctx) {
  if (!D || !D.ops) return loading();
  const O = D.ops;
  const tabs = ["Claims", "Denials", "Rejections", "Payments", "Authorizations"];
  const tabBar = el("div", { style: { display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" } },
    ...tabs.map((t) => { const a = t === ctx.opsTab; const counts: any = { Claims: comma(D.counts.claims), Denials: comma(D.counts.denials), Rejections: comma(D.counts.rejections), Payments: comma(D.counts.payments), Authorizations: comma(D.counts.auths) };
      return el("button", { key: t, onClick: () => ctx.setOpsTab(t), style: { border: "1.5px solid " + (a ? "#21314F" : "#DCE3EE"), background: a ? "#21314F" : "#fff", color: a ? "#fff" : "#5A6B85", font: "600 13px Inter", padding: "9px 16px", borderRadius: 11, display: "flex", alignItems: "center", gap: 8 } },
        t, el("span", { style: { background: a ? "rgba(255,255,255,.2)" : "#EEF4FB", color: a ? "#fff" : "#7A8AA3", font: "700 11px Inter", padding: "1px 7px", borderRadius: 999 } }, counts[t])); }));

  let tableEl: any;
  if (ctx.opsTab === "Claims") {
    const cols = [{ key: "id", label: "Claim", w: "1fr" }, { key: "member", label: "Member", w: "0.8fr" }, { key: "payer", label: "Payer", w: "1.1fr" }, { key: "loc", label: "LOC", w: "0.6fr" }, { key: "dos", label: "DOS", w: "0.9fr" }, { key: "charge", label: "Charge", align: "right", w: "0.8fr" }, { key: "status", label: "Status", w: "0.9fr" }];
    const rows = O.claims.map((r: any) => ({ id: el("span", { style: { font: "600 12.5px Inter", color: "#21314F" } }, r.id), member: r.member, payer: r.payer, loc: r.loc, dos: fmtDate(r.dos), charge: el("span", { style: { fontWeight: 700, color: "#21314F" } }, money(r.charge)), status: pill(r.status) }));
    tableEl = table(cols, rows);
  } else if (ctx.opsTab === "Denials") {
    const cols = [{ key: "id", label: "Claim", w: "1fr" }, { key: "payer", label: "Payer", w: "1fr" }, { key: "reason", label: "Reason", w: "1.5fr" }, { key: "amt", label: "Amount", align: "right", w: "0.7fr" }, { key: "age", label: "Age", w: "0.5fr" }, { key: "next", label: "Next action", w: "1.1fr" }, { key: "who", label: "Assignee", w: "0.8fr" }];
    const rows = O.denials.map((r: any) => ({ id: el("span", { style: { font: "600 12.5px Inter", color: "#21314F" } }, r.id), payer: r.payer, reason: r.reason, amt: el("span", { style: { fontWeight: 700, color: "#B14233" } }, money(r.amt)), age: r.age, next: pill(nextPill(r.next)), who: r.who }));
    tableEl = table(cols, rows);
  } else if (ctx.opsTab === "Rejections") {
    const cols = [{ key: "id", label: "Claim", w: "1fr" }, { key: "src", label: "Clearinghouse", w: "1fr" }, { key: "err", label: "Edit / error", w: "1.8fr" }, { key: "amt", label: "Amount", align: "right", w: "0.7fr" }, { key: "action", label: "", align: "right", w: "1fr" }];
    const rows = O.rejections.map((r: any) => ({ id: el("span", { style: { font: "600 12.5px Inter", color: "#21314F" } }, r.id), src: r.src, err: el("span", { style: { color: "#B5742A" } }, r.err), amt: el("span", { style: { fontWeight: 700, color: "#21314F" } }, money(r.amt)), action: el("button", { style: { border: "none", background: "#4C84C4", color: "#fff", font: "600 11.5px Inter", padding: "6px 12px", borderRadius: 9 } }, "Fix & resubmit") }));
    tableEl = table(cols, rows);
  } else if (ctx.opsTab === "Payments") {
    const cols = [{ key: "id", label: "Claim", w: "1fr" }, { key: "payer", label: "Payer", w: "1.2fr" }, { key: "paid", label: "Payer paid", align: "right", w: "0.9fr" }, { key: "pt", label: "Patient", align: "right", w: "0.8fr" }, { key: "adj", label: "Adjustment", align: "right", w: "0.9fr" }, { key: "action", label: "", align: "right", w: "0.8fr" }];
    const rows = O.payments.map((r: any) => ({ id: el("span", { style: { font: "600 12.5px Inter", color: "#21314F" } }, r.id), payer: r.payer, paid: el("span", { style: { fontWeight: 700, color: "#1F7A56" } }, money(r.paid)), pt: money(r.pt), adj: money(r.adj), action: el("button", { style: { border: "none", background: "#BE6A45", color: "#fff", font: "600 11.5px Inter", padding: "6px 12px", borderRadius: 9 } }, "Post") }));
    tableEl = table(cols, rows);
  } else {
    const cols = [{ key: "id", label: "Auth", w: "1.1fr" }, { key: "member", label: "Member", w: "0.8fr" }, { key: "payer", label: "Payer", w: "1.1fr" }, { key: "loc", label: "LOC", w: "0.6fr" }, { key: "units", label: "Used / Auth", align: "right", w: "0.9fr" }, { key: "end", label: "Expires", w: "0.8fr" }, { key: "status", label: "Status", w: "0.9fr" }];
    const rows = O.auths.map((r: any) => ({ id: el("span", { style: { font: "600 12.5px Inter", color: "#21314F" } }, r.id), member: r.member, payer: r.payer, loc: r.loc, units: el("span", { style: { fontWeight: 700, color: "#21314F" } }, r.units), end: fmtDate(r.end), status: pill(r.status) }));
    tableEl = table(cols, rows);
  }

  const entryTool = (title: string, desc: string, btn: string, btnColor: string) => el("div", { style: { background: "#fff", border: "1px solid #DCE3EE", borderRadius: 16, padding: "18px 20px", display: "flex", flexDirection: "column" } },
    el("div", { style: { font: "600 14.5px Poppins", color: "#21314F" } }, title),
    el("div", { style: { font: "500 12px Inter", color: "#9AA8BD", margin: "5px 0 16px", lineHeight: 1.5, flex: 1 } }, desc),
    el("button", { style: { border: "none", background: btnColor, color: "#fff", font: "600 12.5px Inter", padding: "11px", borderRadius: 11, width: "100%" } }, btn));

  const autoTiles = [
    { name: "Waystar clearinghouse", time: "2 min ago", recs: "312 claims", err: 0 },
    { name: "Kipu EHR feed", time: "18 min ago", recs: "176 census events", err: 0 },
    { name: "n8n · denial webhook", time: "1 hr ago", recs: "38 denials", err: 2 },
  ];

  return el("div", {},
    el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 22 } },
      ...autoTiles.map((a, i) => el("div", { key: i, style: { background: "#fff", border: "1px solid #DCE3EE", borderRadius: 16, padding: "16px 18px" } },
        el("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
          el("span", { style: { font: "600 13px Poppins", color: "#21314F" } }, a.name),
          el("span", { style: { width: 9, height: 9, borderRadius: 999, background: a.err ? "#E0A32E" : "#2E9E73" } })),
        el("div", { style: { font: "500 11.5px Inter", color: "#9AA8BD", marginTop: 6 } }, "Last sync " + a.time + " · " + a.recs),
        a.err ? el("div", { style: { font: "600 11.5px Inter", color: "#B5742A", marginTop: 6 } }, a.err + " rows need review") : el("div", { style: { font: "600 11.5px Inter", color: "#1F7A56", marginTop: 6 } }, "Clean")))),
    el("div", { style: { font: "600 15px Poppins", color: "#21314F", margin: "4px 0 12px" } }, "Work queue"),
    tabBar, tableEl,
    el("div", { style: { display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" } },
      ...["Assign", "Mark worked", "Resubmit", "Export"].map((b) => el("button", { key: b, style: { border: "1.5px solid #DCE3EE", background: "#fff", color: "#5A6B85", font: "600 12.5px Inter", padding: "9px 15px", borderRadius: 10 } }, b))),
    el("div", { style: { font: "600 15px Poppins", color: "#21314F", margin: "26px 0 12px" } }, "Entry tools"),
    el("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 } },
      entryTool("New Claim", "Member, payer, LOC, service codes, units, DOS, provider, charge, auth link.", "Create claim", "#4C84C4"),
      entryTool("Post Payment", "Claim ref, payer paid, patient responsibility split, adjustment, balance.", "Post payment", "#4C84C4"),
      entryTool("Log Denial / Rejection", "Type, CARC/RARC reason, amount, next action, assignee.", "Log denial", "#4C84C4"),
      entryTool("New / Update Auth", "Member, payer, LOC, auth #, CON/RON, units, dates, countdown.", "Manage auth", "#BE6A45")));
}

// ============================ IMPORT WIZARD ============================
export function pageImports() {
  const steps = ["Upload", "Map columns", "Validate", "Preview", "Commit"];
  return el("div", {},
    el("div", { style: { display: "flex", alignItems: "center", gap: 0, marginBottom: 22 } },
      ...steps.map((s, i) => el("div", { key: i, style: { display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" } },
        el("div", { style: { display: "flex", alignItems: "center", gap: 9 } },
          el("div", { style: { width: 28, height: 28, borderRadius: 999, background: i <= 2 ? "#4C84C4" : "#E7EDF5", color: i <= 2 ? "#fff" : "#9AA8BD", display: "flex", alignItems: "center", justifyContent: "center", font: "700 12px Poppins" } }, i + 1),
          el("span", { style: { font: "600 12.5px Inter", color: i <= 2 ? "#21314F" : "#9AA8BD" } }, s)),
        i < steps.length - 1 ? el("div", { style: { flex: 1, height: 2, background: i < 2 ? "#4C84C4" : "#E7EDF5", margin: "0 12px" } }) : null))),
    card("Validate — 837P import · claims_june.csv", '624 rows parsed · mapping profile "Waystar 837P"',
      el("div", {},
        el("div", { style: { display: "flex", gap: 12, marginBottom: 16 } },
          ...[{ n: "591", l: "Valid rows", c: "#1F7A56" }, { n: "21", l: "Warnings", c: "#B5742A" }, { n: "12", l: "Errors", c: "#B14233" }].map((b, i) =>
            el("div", { key: i, style: { flex: 1, background: "#F7FAFE", border: "1px solid #E7EDF5", borderRadius: 12, padding: "14px 16px" } },
              el("div", { style: { font: "700 24px Poppins", color: b.c } }, b.n),
              el("div", { style: { font: "500 12px Inter", color: "#5A6B85", marginTop: 2 } }, b.l)))),
        table([{ key: "row", label: "Row", w: "0.4fr" }, { key: "field", label: "Field", w: "1fr" }, { key: "issue", label: "Issue", w: "1.6fr" }, { key: "sev", label: "Severity", w: "0.7fr" }],
          [["118", "service_code", "H0016 not in code library", "Error"], ["204", "payer_id", 'Unmapped payer "AZCH-2"', "Error"], ["337", "units", "Units 0 — expected ≥1", "Warning"], ["452", "dob", "Masked value missing", "Warning"]].map((r) => ({ row: r[0], field: el("span", { style: { fontWeight: 600, color: "#21314F" } }, r[1]), issue: r[2], sev: pill(r[3] === "Error" ? "Denied" : "Rejected") })))),
      "Fix 12 errors before commit — 591 clean rows are ready to import now.",
      el("button", { style: { border: "none", background: "#BE6A45", color: "#fff", font: "600 12.5px Inter", padding: "10px 18px", borderRadius: 11 } }, "Commit 591 rows")));
}

// ============================ CONNECTIONS ============================
export function pageConnections(D: any) {
  const sources = (D?.connections as any[]) || [
    { name: "Waystar clearinghouse", type: "Claims · 837 / 835", status: "Connected", time: "2 min ago", recs: "312", err: 0, on: true },
    { name: "Kipu EHR", type: "Census · demographics", status: "Connected", time: "18 min ago", recs: "176", err: 0, on: true },
    { name: "n8n automations", type: "Denial + auth webhooks", status: "Connected", time: "1 hr ago", recs: "38", err: 2, on: true },
    { name: "Make.com", type: "Report delivery", status: "Paused", time: "—", recs: "0", err: 0, on: false },
    { name: "Manual entry", type: "Forms · Import Wizard", status: "Always on", time: "live", recs: "44", err: 0, on: true },
  ];
  return el("div", {},
    el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16, marginBottom: 22 } },
      ...sources.map((s: any, i: number) => el("div", { key: i, style: { background: "#fff", border: "1px solid #DCE3EE", borderRadius: 18, padding: "18px 20px" } },
        el("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 } },
          el("div", {}, el("div", { style: { font: "600 15px Poppins", color: "#21314F" } }, s.name),
            el("div", { style: { font: "500 12px Inter", color: "#9AA8BD", marginTop: 2 } }, s.type)),
          el("div", { style: { width: 42, height: 24, borderRadius: 999, background: s.on ? "#2E9E73" : "#D3DCE8", position: "relative", flex: "none" } },
            el("div", { style: { position: "absolute", top: 3, left: s.on ? 21 : 3, width: 18, height: 18, borderRadius: 999, background: "#fff", transition: "left .15s" } }))),
        el("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 } },
          el("span", { style: { width: 8, height: 8, borderRadius: 999, background: s.err ? "#E0A32E" : s.on ? "#2E9E73" : "#9AA8BD" } }),
          el("span", { style: { font: "600 12.5px Inter", color: "#5A6B85" } }, s.status + " · last sync " + s.time)),
        el("div", { style: { display: "flex", gap: 18 } },
          el("div", {}, el("div", { style: { font: "700 17px Poppins", color: "#21314F" } }, s.recs), el("div", { style: { font: "500 11px Inter", color: "#9AA8BD" } }, "records today")),
          el("div", {}, el("div", { style: { font: "700 17px Poppins", color: s.err ? "#B5742A" : "#1F7A56" } }, s.err), el("div", { style: { font: "500 11px Inter", color: "#9AA8BD" } }, "errors")))))),
    grid2(
      card("API keys", "Inbound data endpoints",
        el("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
          ...[["Production key", "pk_live_••••4821"], ["n8n ingest key", "pk_n8n_••••9f2a"]].map((kk, i) =>
            el("div", { key: i, style: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F7FAFE", border: "1px solid #E7EDF5", borderRadius: 11, padding: "11px 14px" } },
              el("div", {}, el("div", { style: { font: "600 12.5px Inter", color: "#21314F" } }, kk[0]), el("code", { style: { font: "500 12px monospace", color: "#7A8AA3" } }, kk[1])),
              el("div", { style: { display: "flex", gap: 7 } },
                el("button", { style: { border: "1.5px solid #DCE3EE", background: "#fff", color: "#5A6B85", font: "600 11px Inter", padding: "6px 10px", borderRadius: 8 } }, "Copy"),
                el("button", { style: { border: "1.5px solid #F1D6CE", background: "#fff", color: "#B14233", font: "600 11px Inter", padding: "6px 10px", borderRadius: 8 } }, "Revoke")))),
          el("div", { style: { background: "#21314F", borderRadius: 11, padding: "12px 14px", marginTop: 4 } },
            el("div", { style: { font: "600 10px Inter", letterSpacing: ".08em", textTransform: "uppercase", color: "#8FA6C9", marginBottom: 6 } }, "POST endpoint"),
            el("code", { style: { font: "500 11.5px monospace", color: "#C7D3E5" } }, "https://api.cholla-billing.app/v1/claims"))),
        "Inbound keys are scoped per source and rotate on a 90-day policy."),
      card("Webhooks", "Recent inbound deliveries (n8n)",
        el("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
          ...[["claim.denied", "200", true], ["auth.updated", "200", true], ["payment.posted", "200", true], ["claim.denied", "500", false]].map((w: any, i: number) =>
            el("div", { key: i, style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "#F7FAFE", borderRadius: 10, border: "1px solid #E7EDF5" } },
              el("code", { style: { font: "600 12px monospace", color: "#21314F" } }, w[0]),
              el("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
                el("span", { style: { font: "700 11.5px Inter", color: w[2] ? "#1F7A56" : "#B14233" } }, w[1]),
                w[2] ? null : el("button", { style: { border: "none", background: "#4C84C4", color: "#fff", font: "600 11px Inter", padding: "5px 11px", borderRadius: 8 } }, "Retry"))))),
        "One delivery failed with a 500 — retry queued automatically after 3 attempts.")));
}

// ============================ SETTINGS ============================
export function pageSettings(D: any) {
  const sectionCard = (title: string, body: any) => card(title, null, body);
  const listBox = (items: any[]) => el("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
    ...items.map((it, i) => el("div", { key: i, style: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F7FAFE", border: "1px solid #E7EDF5", borderRadius: 11, padding: "11px 14px" } },
      el("div", {}, el("span", { style: { font: "600 12.5px Inter", color: "#21314F" } }, it[0]), el("span", { style: { font: "500 11.5px Inter", color: "#9AA8BD", marginLeft: 8 } }, it[1])),
      el("span", { style: { font: "600 11px Inter", color: it[3] || "#4C84C4", background: it[4] || "#DCE8F6", padding: "3px 9px", borderRadius: 999 } }, it[2]))));
  const S = D?.settings;
  const payerRows = S ? S.payers.map((p: any) => { const med = p.type === "Medicaid"; const self = p.type === "Self-Pay"; return [p.name, p.days + "-day pay", p.type, self ? "#5A6B85" : med ? "#2C5C94" : "#A9572F", self ? "#EEF1F6" : med ? "#DCE8F6" : "#F6E5DD"]; }) : [];
  const codeRows = S ? S.codes.map((c: any) => [c.code, c.desc.length > 26 ? c.desc.slice(0, 26) + "…" : c.desc, "$" + c.charge + " / $" + c.allowed, "#1F7A56", "#E3F3EC"]) : [];
  const provRows = S ? S.providers.map((p: any) => { const r = p.role; return [p.name, r === "BHMP" ? "Medical provider" : r === "BHP" ? "Behavioral health prof." : "Behavioral health tech", r, r === "BHMP" ? "#2C5C94" : r === "BHP" ? "#5B4B94" : "#5A6B85", r === "BHMP" ? "#DCE8F6" : r === "BHP" ? "#EAE6F3" : "#EEF1F6"]; }) : [];
  return el("div", {},
    grid2(sectionCard("Payers · " + payerRows.length, listBox(payerRows)), sectionCard("Service codes · " + codeRows.length, listBox(codeRows))),
    grid2(sectionCard("Rendering providers · " + provRows.length, listBox(provRows)),
      sectionCard("Levels of care", listBox([["Outpatient", "OP", "No PA", "#5A6B85", "#EEF1F6"], ["IOP", "Intensive OP", "PA · 30-day", "#B5742A", "#FBEEDD"], ["PHP", "Partial hosp.", "PA · 30-day", "#B5742A", "#FBEEDD"], ["BHRF", "Residential", "PA required", "#B5742A", "#FBEEDD"], ["Inpatient", "Acute", "PA required", "#B5742A", "#FBEEDD"]]))),
    grid1(sectionCard("Users & roles", listBox([["Ruth Okafor", "r.okafor@chollabh.org", "Admin", "#21314F", "#E1E6EF"], ["Marcus Webb", "m.webb@chollabh.org", "Billing", "#A9572F", "#F6E5DD"], ["Angela Ruiz", "a.ruiz@chollabh.org", "Junior Biller", "#5B4B94", "#EAE6F3"]]))),
    grid1(card("Denial reason codes", "CARC / RARC reference used to categorize denials",
      table([{ key: "code", label: "Code", w: "0.5fr" }, { key: "desc", label: "Description", w: "2fr" }, { key: "cat", label: "Category", w: "1fr" }],
        [["CO-197", "Precertification/authorization absent", "Preventable · auth"], ["CO-16", "Claim lacks information", "Preventable · data"], ["CO-45", "Charge exceeds fee schedule", "Contractual"], ["CO-29", "Time limit for filing expired", "Preventable · timing"], ["PR-1", "Deductible amount", "Patient responsibility"]].map((r) => ({ code: el("span", { style: { fontWeight: 700, color: "#21314F" } }, r[0]), desc: r[1], cat: r[2] }))), null)));
}

// ============================ ADMIN ============================
export function pageAdmin(D: any) {
  const health = D?.admin?.health || [{ l: "Ingestion status", v: "Healthy", c: "#1F7A56" }, { l: "Open error rows", v: "14", c: "#B5742A" }, { l: "Queue depth", v: "38", c: "#21314F" }, { l: "Data quality flags", v: "9", c: "#B14233" }];
  const audit = D?.admin?.audit || [["09:41", "M. Webb", "Posted payment", "CLM-10482"], ["09:38", "A. Ruiz", "Updated authorization", "A-4776"], ["09:31", "System", "Ingested batch · Waystar", "312 claims"], ["09:22", "R. Okafor", "Exported report", "Billing Overview · 30d"], ["09:04", "M. Webb", "Logged denial", "CLM-10484"]];
  const quality = [["Unmapped service codes", "2", "H0016, T1017"], ["Unmatched payments", "4", "no claim ref"], ["Claims missing auth link", "3", "IOP · PA required"]];
  return el("div", {},
    el("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 } },
      ...health.map((h: any, i: number) => el("div", { key: i, style: { background: "#fff", border: "1px solid #DCE3EE", borderRadius: 16, padding: "16px 18px" } },
        el("div", { style: { font: "500 11.5px Inter", textTransform: "uppercase", letterSpacing: ".03em", color: "#7A8AA3" } }, h.l),
        el("div", { style: { font: "700 26px Poppins", color: h.c, marginTop: 7 } }, h.v)))),
    grid2(
      card("Data quality flags", "Needs attention before month-end close",
        el("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
          ...quality.map((q, i) => el("div", { key: i, style: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FCF6EE", border: "1px solid #F0E2CC", borderRadius: 11, padding: "12px 14px" } },
            el("div", {}, el("div", { style: { font: "600 12.5px Inter", color: "#21314F" } }, q[0]), el("div", { style: { font: "500 11.5px Inter", color: "#9AA8BD", marginTop: 2 } }, q[2])),
            el("span", { style: { font: "700 15px Poppins", color: "#B5742A" } }, q[1])))),
        "Resolving unmapped codes and auth links clears 5 of 9 flags before close."),
      card("User activity", "Immutable audit log — searchable, exportable",
        el("div", { style: { display: "flex", flexDirection: "column", gap: 2 } },
          ...audit.map((a: any, i: number) => el("div", { key: i, style: { display: "grid", gridTemplateColumns: "62px 1fr", gap: 12, padding: "9px 0", borderBottom: i < audit.length - 1 ? "1px solid #F0F4F9" : "none" } },
            el("span", { style: { font: "600 12px Inter", color: "#9AA8BD" } }, a[0]),
            el("div", {}, el("span", { style: { font: "600 12.5px Inter", color: "#21314F" } }, a[1]),
              el("span", { style: { font: "500 12.5px Inter", color: "#5A6B85" } }, " · " + a[2] + " · "),
              el("span", { style: { font: "600 12.5px Inter", color: "#4C84C4" } }, a[3]))))),
        "Every create, edit, and export is logged with actor, entity, and before/after state.")));
}

// ============================ ADDITION-SPEC SCAFFOLDS ============================
// Honest "next milestone" placeholders in the Cholla identity (buildspec 11).
function scaffold(title: string, blurb: string, bullets: string[]) {
  return el("div", {},
    el("div", { style: { background: "#fff", border: "1px solid #DCE3EE", borderRadius: 18, padding: "26px 28px", marginBottom: 16 } },
      el("div", { style: { display: "inline-flex", alignItems: "center", gap: 8, background: "#EAE6F3", color: "#5B4B94", font: "600 11px Inter", padding: "5px 12px", borderRadius: 999, letterSpacing: ".04em", textTransform: "uppercase" } }, "Roadmap · Operations Layer"),
      el("div", { style: { font: "600 20px Poppins", color: "#21314F", margin: "14px 0 6px" } }, title),
      el("div", { style: { font: "500 13.5px Inter", color: "#5A6B85", lineHeight: 1.55, maxWidth: 720 } }, blurb)),
    el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 } },
      ...bullets.map((b, i) => el("div", { key: i, style: { background: "#fff", border: "1px solid #DCE3EE", borderRadius: 14, padding: "16px 18px", display: "flex", gap: 11, alignItems: "flex-start" } },
        el("span", { style: { width: 7, height: 7, borderRadius: 999, background: "#4C84C4", flex: "none", marginTop: 6 } }),
        el("span", { style: { font: "500 13px Inter", color: "#3A4A66", lineHeight: 1.5 } }, b)))));
}

export function pageEligibility() {
  return scaffold("VOB & Eligibility Center", "The front door of the revenue cycle — real-time 270/271 eligibility inquiry, versioned VOB worksheets, recurring re-verification, and the Medicaid redetermination tracker. Backed by the Availity Coverages API adapter.",
    ["Eligibility check panel (270/271) with deductible, OOP, carve-out and PA-required flags", "Versioned VOB worksheet per member/episode with coverage-change diffing", "Recurring re-verification engine (admission AM · Mondays · 1st-of-month Medicaid)", "Medicaid redetermination tracker with outreach log", "Eligibility-exceptions queue (termed / plan change / carve-out mismatch)"]);
}
export function pageConcurrentReview() {
  return scaffold("Concurrent Review Workspace", "The UR team's daily driver — a week-view review calendar auto-scheduled from the payer requirements library, a per-review prep card worked live on the payer call, and outcome logging that flows approved days into the authorization record.",
    ["Review calendar (due today / overdue / upcoming)", "Review prep card: days used vs authorized, notes, ASAM checklist, clinical packet", "Outcome logging → auto-updates the authorization", "Peer-to-peer manager with per-payer win-rate tracking", "LOC transition planning (creates the next auth request as a draft)"]);
}
export function pageChargeCapture() {
  return scaffold("Charge Capture & Billing Census", "Operationalizes the 'claims built vs. census' leakage metric into a fix-it-today worklist — a daily grid of census × expected billable services vs. charges created, with documentation-signed status per date of service.",
    ["Daily census × expected-charges reconciliation grid", "Unsigned-note and missed-charge flags per DOS", "Feeds the claim scrub engine's documentation rule", "EMR charge/service feed (Sunwave / Kipu) → draft claims or charge-review queue"]);
}
export function pageCredentialing() {
  return scaffold("Credentialing & Payer Enrollment", "Per provider per payer enrollment status, revalidation and CAQH attestation tracking — and the scrub rule that blocks claims where the rendering provider isn't active with the payer for the DOS.",
    ["Enrollment matrix (Not enrolled / Submitted / In process / Active / Term)", "Revalidation & CAQH re-attestation alerts (≤30 days)", "NPI / taxonomy per provider", "Feeds the scrub engine — a silent killer of clean-claim rates"]);
}
export function pageMyWork() {
  return scaffold("My Work — Alerts & Tasks", "The global alerts & task engine surfaced per user — auth expirations, appeal deadlines, timely-filing risk, eligibility terms, ERA exceptions and credentialing lapses, each an assignable task with an SLA.",
    ["Central alert rules with SLA-bound tasks", "Per-user 'My work' queue", "Digest summary tile on the Ops dashboard", "Appeal-deadline and timely-filing countdowns wired to the alerts engine"]);
}
