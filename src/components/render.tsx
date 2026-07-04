/* eslint-disable @typescript-eslint/no-explicit-any */
// Ported verbatim (structure + styles) from the Cholla prototype's render helpers
// so the rebuilt React UI is pixel-identical. Inline-SVG charts in the Cholla palette.
import React from "react";
import { CHART, PILL } from "@/design/tokens";

const el = React.createElement;

export const comma = (n: number) => Math.round(n).toLocaleString("en-US");
export const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
export const moneyK = (n: number) => {
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return "$" + n;
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  const p = String(iso).split("-");
  if (p.length < 3) return iso;
  return MONTHS[parseInt(p[1], 10) - 1] + " " + parseInt(p[2], 10);
};
export const nextPill = (s?: string) => {
  s = (s || "").toLowerCase();
  if (s.includes("appeal")) return "Appeal";
  if (s.includes("resubmit") || s.includes("correct")) return "Correct & resubmit";
  if (s.includes("write")) return "Write-off";
  return "Pending";
};

export function icon(name: string) {
  const P: any = { strokeWidth: 2, fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", width: 18, height: 18, viewBox: "0 0 24 24" };
  const paths: Record<string, string[]> = {
    billing: ["M3 3v18h18", "M7 14l3-3 3 3 5-6"],
    ur: ["M9 11l3 3L22 4", "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"],
    review: ["M8 2v4M16 2v4M3 10h18", "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"],
    ops: ["M4 6h16M4 12h16M4 18h10"],
    eligibility: ["M9 12l2 2 4-4", "M12 3l7 4v5c0 4-3 6-7 8-4-2-7-4-7-8V7z"],
    charge: ["M9 11H5v10h4zM15 3h-4v18h4zM21 7h-4v14h4z"],
    import: ["M12 3v12", "M7 10l5 5 5-5", "M4 21h16"],
    plug: ["M9 2v6M15 2v6", "M7 8h10v4a5 5 0 0 1-10 0z", "M12 17v5"],
    settings: ["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"],
    credential: ["M12 2l3 6 6 .5-4.5 4 1.5 6L12 15l-5.5 3.5 1.5-6L3.5 8.5 9.5 8z"],
    admin: ["M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"],
    work: ["M20 7h-4V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"],
  };
  return el("svg", { ...P }, ...(paths[name] || []).map((d, i) => el("path", { key: i, d })));
}

export function insight(text: any) {
  return el("div", { style: { display: "flex", alignItems: "center", gap: 10, background: "#F3F8FD", border: "1px solid #E1ECF8", borderRadius: 12, padding: "11px 15px", marginTop: 14 } },
    el("span", { style: { width: 7, height: 7, borderRadius: 999, background: "#4C84C4", flex: "none" } }),
    el("span", { style: { font: "600 13px Inter", color: "#2C4468", lineHeight: 1.45 } }, text));
}

export function card(title: any, sub: any, body: any, insightText?: any, right?: any) {
  return el("div", { style: { background: "#fff", border: "1px solid #DCE3EE", borderRadius: 18, padding: "20px 22px" } },
    el("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 } },
      el("div", {},
        el("div", { style: { font: "600 15.5px Poppins", color: "#21314F" } }, title),
        sub ? el("div", { style: { font: "500 12px Inter", color: "#9AA8BD", marginTop: 2 } }, sub) : null),
      right || null),
    body,
    insightText ? insight(insightText) : null);
}

export function vbars(data: any[], opts: any) {
  opts = opts || {};
  const w = opts.w || 520, h = opts.h || 180, pad = 26, bw = Math.max(6, ((w - pad * 2) / data.length) * 0.55);
  const max = opts.max || Math.max(...data.map((d) => d.v)) * 1.15;
  const gap = (w - pad * 2) / data.length;
  return el("svg", { viewBox: "0 0 " + w + " " + (h + 26), style: { width: "100%", height: "auto", display: "block" } },
    ...[0, 0.25, 0.5, 0.75, 1].map((f, i) => { const y = pad + (h - pad) * (1 - f); return el("line", { key: "ln" + i, x1: pad, x2: w - pad / 2, y1: y, y2: y, stroke: "#EEF3F9", strokeWidth: 1 }); }),
    ...data.map((d, i) => { const bh = (d.v / max) * (h - pad); const x = pad + gap * i + (gap - bw) / 2; const y = pad + (h - pad) - bh;
      return el("g", { key: i },
        el("rect", { x, y, width: bw, height: bh, rx: 5, fill: d.c || "#4C84C4" }),
        el("text", { x: x + bw / 2, y: h + 18, textAnchor: "middle", style: { font: "600 10.5px Inter", fill: "#9AA8BD" } }, d.l)); }));
}

export function groupedBars(cats: string[], seriesA: number[], seriesB: number[], opts: any) {
  opts = opts || {};
  const w = opts.w || 560, h = opts.h || 190, pad = 30; const n = cats.length; const gap = (w - pad * 2) / n; const bw = Math.min(16, gap * 0.34);
  const max = Math.max(...seriesA, ...seriesB) * 1.15;
  const lineY = (v: number) => pad + (h - pad) - (v / max) * (h - pad);
  const linePts = seriesB.map((v, i) => [pad + gap * i + gap / 2, lineY(v)]);
  return el("svg", { viewBox: "0 0 " + w + " " + (h + 26), style: { width: "100%", height: "auto", display: "block" } },
    ...[0, 0.25, 0.5, 0.75, 1].map((f, i) => { const y = pad + (h - pad) * (1 - f); return el("line", { key: "ln" + i, x1: pad, x2: w - pad / 2, y1: y, y2: y, stroke: "#EEF3F9", strokeWidth: 1 }); }),
    ...cats.map((c, i) => { const bh = (seriesA[i] / max) * (h - pad); const x = pad + gap * i + gap / 2 - bw - 2; const y = pad + (h - pad) - bh;
      return el("g", { key: i },
        el("rect", { x, y, width: bw, height: bh, rx: 4, fill: "#DCE8F6" }),
        el("text", { x: pad + gap * i + gap / 2, y: h + 18, textAnchor: "middle", style: { font: "600 10.5px Inter", fill: "#9AA8BD" } }, c)); }),
    el("polyline", { points: linePts.map((p) => p.join(",")).join(" "), fill: "none", stroke: "#BE6A45", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" }),
    ...linePts.map((p, i) => el("circle", { key: "d" + i, cx: p[0], cy: p[1], r: 3.5, fill: "#BE6A45" })));
}

export function line(points: any[], opts: any) {
  opts = opts || {};
  const w = opts.w || 560, h = opts.h || 180, pad = 28; const max = Math.max(...points.map((p) => p.v)) * 1.15, min = 0;
  const px = (i: number) => pad + (w - pad * 1.5) * (i / (points.length - 1));
  const py = (v: number) => pad + (h - pad) - ((v - min) / (max - min)) * (h - pad);
  const pts = points.map((p, i) => [px(i), py(p.v)]);
  const area = pts.map((p) => p.join(",")).join(" ");
  return el("svg", { viewBox: "0 0 " + w + " " + (h + 26), style: { width: "100%", height: "auto", display: "block" } },
    el("defs", {}, el("linearGradient", { id: "cbfill", x1: 0, y1: 0, x2: 0, y2: 1 },
      el("stop", { offset: "0%", stopColor: "#4C84C4", stopOpacity: 0.22 }), el("stop", { offset: "100%", stopColor: "#4C84C4", stopOpacity: 0 }))),
    ...[0, 0.25, 0.5, 0.75, 1].map((f, i) => { const y = pad + (h - pad) * (1 - f); return el("line", { key: "ln" + i, x1: pad, x2: w - pad / 2, y1: y, y2: y, stroke: "#EEF3F9", strokeWidth: 1 }); }),
    el("polygon", { points: pad + "," + (pad + (h - pad)) + " " + area + " " + px(points.length - 1) + "," + (pad + (h - pad)), fill: "url(#cbfill)" }),
    el("polyline", { points: area, fill: "none", stroke: "#4C84C4", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" }),
    ...pts.map((p, i) => el("circle", { key: "d" + i, cx: p[0], cy: p[1], r: 3, fill: "#fff", stroke: "#4C84C4", strokeWidth: 2 })),
    ...points.map((p, i) => el("text", { key: "t" + i, x: px(i), y: h + 18, textAnchor: "middle", style: { font: "600 10px Inter", fill: "#9AA8BD" } }, p.l)));
}

export function stacked(cats: string[], partsList: any[][], opts: any) {
  opts = opts || {};
  const w = opts.w || 520, h = opts.h || 180, pad = 28; const gap = (w - pad * 2) / cats.length; const bw = Math.min(26, gap * 0.5);
  const totals = partsList.map((p) => p.reduce((a: number, b: any) => a + b.v, 0)); const max = Math.max(...totals) * 1.2;
  return el("svg", { viewBox: "0 0 " + w + " " + (h + 26), style: { width: "100%", height: "auto", display: "block" } },
    ...[0, 0.5, 1].map((f, i) => { const y = pad + (h - pad) * (1 - f); return el("line", { key: "ln" + i, x1: pad, x2: w - pad / 2, y1: y, y2: y, stroke: "#EEF3F9", strokeWidth: 1 }); }),
    ...cats.map((c, i) => { let acc = 0; const x = pad + gap * i + (gap - bw) / 2;
      return el("g", { key: i },
        ...partsList[i].map((seg: any, j: number) => { const sh = (seg.v / max) * (h - pad); const y = pad + (h - pad) - acc - sh; acc += sh;
          return el("rect", { key: j, x, y, width: bw, height: sh, rx: 2, fill: seg.c }); }),
        el("text", { x: x + bw / 2, y: h + 18, textAnchor: "middle", style: { font: "600 10px Inter", fill: "#9AA8BD" } }, c)); }));
}

export function donut(segs: any[], opts: any) {
  opts = opts || {};
  const size = opts.size || 150, r = size / 2 - 14, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
  const total = segs.reduce((a, s) => a + s.v, 0); let acc = 0;
  return el("div", { style: { display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" } },
    el("svg", { viewBox: "0 0 " + size + " " + size, style: { width: size, height: size, flex: "none" } },
      el("circle", { cx, cy, r, fill: "none", stroke: "#EEF3F9", strokeWidth: 16 }),
      ...segs.map((s, i) => { const frac = s.v / total; const dash = frac * C; const off = acc * C; acc += frac;
        return el("circle", { key: i, cx, cy, r, fill: "none", stroke: s.c, strokeWidth: 16, strokeDasharray: dash + " " + (C - dash), strokeDashoffset: -off, transform: "rotate(-90 " + cx + " " + cy + ")", strokeLinecap: "butt" }); }),
      opts.center ? el("text", { x: cx, y: cy - 2, textAnchor: "middle", style: { font: "700 18px Poppins", fill: "#21314F" } }, opts.center) : null,
      opts.centerSub ? el("text", { x: cx, y: cy + 14, textAnchor: "middle", style: { font: "500 9px Inter", fill: "#9AA8BD" } }, opts.centerSub) : null),
    el("div", { style: { display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 120 } },
      ...segs.map((s, i) => el("div", { key: i, style: { display: "flex", alignItems: "center", gap: 8 } },
        el("span", { style: { width: 10, height: 10, borderRadius: 3, background: s.c, flex: "none" } }),
        el("span", { style: { font: "500 12.5px Inter", color: "#5A6B85", flex: 1 } }, s.l),
        el("span", { style: { font: "700 12.5px Inter", color: "#21314F" } }, opts.money ? moneyK(s.v) : Math.round((s.v / total) * 100) + "%")))));
}

export function hbars(rows: any[], opts: any) {
  opts = opts || {};
  const max = Math.max(...rows.map((r) => r.v)) * 1.1;
  return el("div", { style: { display: "flex", flexDirection: "column", gap: 12 } },
    ...rows.map((r, i) => el("div", { key: i },
      el("div", { style: { display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 5 } },
        el("span", { style: { font: "600 12.5px Inter", color: "#21314F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 } }, r.l),
        el("span", { style: { font: "700 12.5px Inter", color: "#5A6B85", flex: "none" } }, opts.money ? moneyK(r.v) : r.v)),
      el("div", { style: { height: 9, background: "#EEF3F9", borderRadius: 999, overflow: "hidden" } },
        el("div", { style: { height: "100%", width: (r.v / max) * 100 + "%", background: r.c || "#4C84C4", borderRadius: 999 } })))));
}

export function pill(status: string) {
  const c = PILL[status] || ["#eee", "#333"];
  return el("span", { style: { display: "inline-flex", alignItems: "center", gap: 6, background: c[0], color: c[1], font: "600 12px Inter", padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" } },
    el("span", { style: { width: 6, height: 6, borderRadius: 999, background: c[1] } }), status);
}

export function kpiRow(kpis: any[]) {
  return el("div", { style: { display: "grid", gridTemplateColumns: "repeat(" + (kpis.length >= 6 ? 4 : kpis.length) + ",minmax(0,1fr))", gap: 14, marginBottom: 22 } },
    ...kpis.map((k, i) => el("div", { key: i, style: { background: "#fff", border: "1px solid #DCE3EE", borderRadius: 16, padding: "16px 18px" } },
      el("div", { style: { font: "500 11.5px Inter", letterSpacing: ".03em", textTransform: "uppercase", color: "#7A8AA3" } }, k.label),
      el("div", { style: { display: "flex", alignItems: "baseline", gap: 8, marginTop: 7 } },
        el("span", { style: { font: "700 27px Poppins", color: k.color || "#21314F", lineHeight: 1 } }, k.value),
        k.delta ? el("span", { style: { font: "700 12px Inter", color: k.up ? "#1F7A56" : k.down ? "#B14233" : "#7A8AA3" } }, (k.up ? "▲ " : k.down ? "▼ " : "") + k.delta) : null),
      k.sub ? el("div", { style: { font: "500 11.5px Inter", color: "#9AA8BD", marginTop: 6 } }, k.sub) : null)));
}

export function table(cols: any[], rows: any[]) {
  const tmpl = cols.map((c) => c.w || "1fr").join(" ");
  return el("div", { style: { background: "#fff", border: "1px solid #DCE3EE", borderRadius: 16, overflow: "hidden" } },
    el("div", { style: { display: "grid", gridTemplateColumns: tmpl, gap: 12, padding: "13px 20px", background: "#F7FAFE", borderBottom: "1px solid #E7EDF5" } },
      ...cols.map((c, i) => el("div", { key: i, style: { font: "600 11px Inter", letterSpacing: ".04em", textTransform: "uppercase", color: "#7A8AA3", textAlign: c.align || "left" } }, c.label))),
    ...rows.map((r, i) => el("div", { key: i, style: { display: "grid", gridTemplateColumns: tmpl, gap: 12, padding: "13px 20px", borderBottom: "1px solid #F0F4F9", alignItems: "center" } },
      ...cols.map((c, j) => el("div", { key: j, style: { textAlign: c.align || "left", font: "500 13px Inter", color: "#3A4A66", minWidth: 0 } }, r[c.key])))));
}

export function grid2(a: any, b: any) {
  return el("div", { style: { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, marginBottom: 16 } }, a, b);
}
export function grid1(a: any) {
  return el("div", { style: { marginBottom: 16 } }, a);
}
export function loading() {
  return el("div", { style: { padding: "80px 20px", textAlign: "center", font: "500 14px Inter", color: "#9AA8BD" } }, "Loading dataset…");
}
export { CHART };
