/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Role, ROLE_META, NavId, canViewSurface } from "@/lib/rbac";
import { icon } from "./render";
import {
  pageBilling, pageUR, pageOps, pageImports, pageConnections, pageSettings, pageAdmin,
  pageEligibility, pageConcurrentReview, pageChargeCapture, pageCredentialing, pageMyWork, Ctx,
} from "./pages";

const el = React.createElement;

const PAYERS = ["All payers", "AZ Complete Health", "Care1st AZ", "Mercy Care", "UnitedHealthcare", "Aetna", "Self-pay"];
const LOCS = ["All levels", "Outpatient", "IOP", "PHP", "BHRF", "Inpatient"];
const MEDICAID = ["AZ Complete Health", "Care1st AZ", "Mercy Care"];

interface NavItem { id: NavId; label: string; icon: string; }
interface NavGroup { label: string; items: NavItem[]; }

const NAV: NavGroup[] = [
  { label: "Dashboards", items: [
    { id: "client-billing", label: "Billing Overview", icon: "billing" },
    { id: "client-ur", label: "Utilization Review", icon: "ur" },
  ] },
  { label: "Utilization Review", items: [
    { id: "concurrent-review", label: "Concurrent Review", icon: "review" },
  ] },
  { label: "Operations", items: [
    { id: "ops", label: "Team Ops", icon: "ops" },
    { id: "eligibility", label: "VOB & Eligibility", icon: "eligibility" },
    { id: "charge-capture", label: "Charge Capture", icon: "charge" },
    { id: "imports", label: "Import Wizard", icon: "import" },
  ] },
  { label: "Workspace", items: [
    { id: "my-work", label: "My Work", icon: "work" },
  ] },
  { label: "Platform", items: [
    { id: "connections", label: "Connections", icon: "plug" },
    { id: "settings", label: "Settings", icon: "settings" },
    { id: "credentialing", label: "Credentialing", icon: "credential" },
    { id: "admin-home", label: "Admin Home", icon: "admin" },
  ] },
];

const PAGE_META: Record<string, { kicker: string; title: string; sub: string; export?: boolean }> = {
  "client-billing": { kicker: "Dashboard", title: "Billing Overview", sub: "Simulated dataset · Jan 1 – Jun 30, 2026", export: true },
  "client-ur": { kicker: "Dashboard", title: "Utilization Review & Authorizations", sub: "Auth health and census · as of Jun 30, 2026", export: true },
  "concurrent-review": { kicker: "Utilization Review", title: "Concurrent Review Workspace", sub: "Review calendar, prep cards, peer-to-peer" },
  "ops": { kicker: "Operations", title: "Team Ops", sub: "Work queues and data entry" },
  "eligibility": { kicker: "Operations", title: "VOB & Eligibility Center", sub: "Benefits verification · 270/271 · redetermination" },
  "charge-capture": { kicker: "Operations", title: "Charge Capture & Billing Census", sub: "Census × charges reconciliation" },
  "imports": { kicker: "Operations", title: "Import Wizard", sub: "CSV · 835 · 837 · clearinghouse export" },
  "my-work": { kicker: "Workspace", title: "My Work", sub: "Alerts & tasks assigned to you" },
  "connections": { kicker: "Platform", title: "Connections & Automations", sub: "Integration control room" },
  "settings": { kicker: "Platform", title: "Settings", sub: "Organization, payers, codes, users" },
  "credentialing": { kicker: "Platform", title: "Credentialing & Payer Enrollment", sub: "Provider enrollment status by payer" },
  "admin-home": { kicker: "Platform", title: "Admin Control Panel", sub: "System health, audit log, data quality" },
};

export default function Platform({ role }: { role: Role }) {
  const router = useRouter();
  const rm = ROLE_META[role];
  const [nav, setNav] = useState<NavId>(rm.defaultNav as NavId);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dateRange, setDateRange] = useState("30d");
  const [payer, setPayer] = useState("All payers");
  const [loc, setLoc] = useState("All levels");
  const [opsTab, setOpsTab] = useState("Claims");
  const [D, setD] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const j = async (u: string) => {
        try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch { return null; }
      };
      const [billing, ur, ops, settings, admin, connections] = await Promise.all([
        j("/api/metrics/billing"), j("/api/metrics/ur"), j("/api/ops"),
        j("/api/settings"), j("/api/admin"), j("/api/connections"),
      ]);
      if (!alive) return;
      setD({ ...(billing || {}), ...(ur || {}), ops: ops?.ops, settings, admin, connections });
    }
    load();
    return () => { alive = false; };
  }, []);

  const isMedicaid = MEDICAID.includes(payer);
  const ctx: Ctx = { opsTab, setOpsTab, isMedicaid, role };
  const meta = PAGE_META[nav] || PAGE_META["client-billing"];
  const expiring = D?.ur?.expiring5 ?? 17;

  function renderPage() {
    switch (nav) {
      case "client-billing": return pageBilling(D, ctx);
      case "client-ur": return pageUR(D);
      case "concurrent-review": return pageConcurrentReview();
      case "ops": return pageOps(D, ctx);
      case "eligibility": return pageEligibility();
      case "charge-capture": return pageChargeCapture();
      case "imports": return pageImports();
      case "my-work": return pageMyWork();
      case "connections": return pageConnections(D);
      case "settings": return pageSettings(D);
      case "credentialing": return pageCredentialing();
      case "admin-home": return pageAdmin(D);
      default: return null;
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials = rm.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  const groups = NAV
    .map((g) => ({ label: g.label, items: g.items.filter((it) => canViewSurface(role, it.id)) }))
    .filter((g) => g.items.length > 0);

  return el("div", { style: { display: "flex", minHeight: "100vh", background: "#EEF4FB" } },
    // SIDEBAR
    el("aside", { style: { width: sidebarOpen ? "246px" : "74px", flex: "none", background: "#21314F", color: "#fff", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", transition: "width .18s" } },
      el("div", { style: { padding: "16px 16px 14px", borderBottom: "1px solid rgba(255,255,255,.08)" } },
        el("div", { style: { background: "#fff", borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "center" } },
          el("img", { src: "/assets/cholla-logo.png", alt: "Cholla Behavioral Health", style: { height: sidebarOpen ? 30 : 20, width: "auto", display: "block" } })),
        sidebarOpen ? el("div", { style: { textAlign: "center", font: "500 10px Inter", letterSpacing: ".12em", textTransform: "uppercase", color: "#8FA6C9", marginTop: 9 } }, "Billing & UR Platform") : null),
      el("div", { className: "cb-scroll", style: { flex: 1, overflowY: "auto", padding: "14px 12px" } },
        ...groups.map((grp, gi) => el("div", { key: gi, style: { marginBottom: 18 } },
          sidebarOpen ? el("div", { style: { font: "600 10px Inter", letterSpacing: ".1em", textTransform: "uppercase", color: "#6E86AD", padding: "0 12px 8px" } }, grp.label) : null,
          ...grp.items.map((it) => {
            const active = it.id === nav;
            const showAlert = it.id === "client-ur" && role !== "client_viewer";
            return el("button", { key: it.id, className: "cb-nav", onClick: () => setNav(it.id), title: it.label, style: { width: "100%", display: "flex", alignItems: "center", gap: 12, border: "none", background: active ? "#4C84C4" : "transparent", color: active ? "#fff" : "#C7D3E5", padding: "11px 12px", borderRadius: 11, font: "600 13.5px Inter", marginBottom: 3, textAlign: "left", transition: "background .12s" } },
              el("span", { style: { width: 20, height: 20, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", color: active ? "#fff" : "#8FA6C9" } }, icon(it.icon)),
              sidebarOpen ? el("span", { style: { flex: 1 } }, it.label) : null,
              showAlert ? el("span", { style: { background: "#C1453B", color: "#fff", font: "700 10px Inter", padding: "2px 7px", borderRadius: 999 } }, String(expiring)) : null);
          })))),
      el("div", { style: { padding: 12, borderTop: "1px solid rgba(255,255,255,.08)" } },
        el("button", { onClick: () => setSidebarOpen((s) => !s), className: "cb-nav", style: { width: "100%", display: "flex", alignItems: "center", gap: 12, border: "none", background: "transparent", color: "#8FA6C9", padding: "10px 12px", borderRadius: 11, font: "600 12.5px Inter" } },
          el("span", { style: { width: 20, flex: "none", textAlign: "center" } }, sidebarOpen ? "«" : "»"),
          sidebarOpen ? el("span", {}, "Collapse") : null))),
    // MAIN
    el("div", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" } },
      el("header", { style: { background: "#fff", borderBottom: "1px solid #DCE3EE", padding: "12px 26px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 40, flexWrap: "wrap" } },
        el("div", { style: { display: "flex", alignItems: "center", gap: 10, padding: "6px 13px 6px 8px", border: "1.5px solid #DCE3EE", borderRadius: 11 } },
          el("img", { src: "/assets/cholla-logo.png", alt: "Cholla", style: { height: 22, width: "auto", display: "block" } }),
          el("svg", { width: 13, height: 13, viewBox: "0 0 24 24", fill: "none", stroke: "#9AA8BD", strokeWidth: 2.5, strokeLinecap: "round" }, el("path", { d: "M6 9l6 6 6-6" }))),
        el("div", { style: { display: "flex", gap: 3, background: "#EEF4FB", padding: 4, borderRadius: 11 } },
          ...["Today", "7d", "30d", "MTD", "QTD", "Custom"].map((d) => el("button", { key: d, onClick: () => setDateRange(d), style: { border: "none", padding: "7px 12px", borderRadius: 8, font: "600 12.5px Inter", background: dateRange === d ? "#21314F" : "transparent", color: dateRange === d ? "#fff" : "#5A6B85" } }, d))),
        el("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
          el("select", { value: payer, onChange: (e: any) => setPayer(e.target.value), style: { padding: "8px 11px", border: "1.5px solid #DCE3EE", borderRadius: 10, font: "600 12.5px Inter", color: "#21314F", background: "#fff", outline: "none" } }, ...PAYERS.map((o) => el("option", { key: o, value: o }, o))),
          el("select", { value: loc, onChange: (e: any) => setLoc(e.target.value), style: { padding: "8px 11px", border: "1.5px solid #DCE3EE", borderRadius: 10, font: "600 12.5px Inter", color: "#21314F", background: "#fff", outline: "none" } }, ...LOCS.map((o) => el("option", { key: o, value: o }, o)))),
        el("div", { style: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 } },
          el("button", { onClick: logout, style: { border: "1px solid #DCE3EE", background: "#fff", color: "#5A6B85", font: "600 12px Inter", padding: "8px 13px", borderRadius: 10 } }, "Sign out"),
          el("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
            el("div", { style: { textAlign: "right", lineHeight: 1.2 } },
              el("div", { style: { font: "600 13px Inter", color: "#21314F" } }, rm.name),
              el("div", { style: { font: "500 11px Inter", color: "#8093AB" } }, rm.label)),
            el("div", { style: { width: 38, height: 38, borderRadius: 999, background: rm.avatar, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", font: "700 14px Poppins" } }, initials)))),
      el("main", { className: "cb-scroll", style: { flex: 1, overflowY: "auto", padding: "26px 30px 48px" } },
        el("div", { style: { maxWidth: 1360, margin: "0 auto" } },
          el("div", { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 } },
            el("div", {},
              el("div", { style: { font: "600 11.5px Inter", letterSpacing: ".1em", textTransform: "uppercase", color: "#4C84C4", marginBottom: 4 } }, meta.kicker),
              el("h1", { style: { font: "600 26px Poppins", color: "#21314F", margin: 0 } }, meta.title),
              el("p", { style: { font: "500 13.5px Inter", color: "#7A8AA3", margin: "6px 0 0" } }, meta.sub + (payer !== "All payers" ? " · " + payer : ""))),
            meta.export ? el("div", { style: { display: "flex", gap: 10 } },
              el("button", { style: { border: "1.5px solid #DCE3EE", background: "#fff", color: "#21314F", font: "600 12.5px Inter", padding: "10px 16px", borderRadius: 11 } }, "Export CSV"),
              el("button", { style: { border: "none", background: "#BE6A45", color: "#fff", font: "600 12.5px Inter", padding: "11px 18px", borderRadius: 11, boxShadow: "0 8px 18px -8px rgba(190,106,69,.6)" } }, "Export report (PDF)")) : null),
          el("div", {}, renderPage())))));
}
