/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/lib/rbac";

const el = React.createElement;

const CHIPS: { role: Role; label: string }[] = [
  { role: "client_viewer", label: "Client" },
  { role: "operations", label: "Operations" },
  { role: "junior_biller", label: "Junior" },
  { role: "billing_manager", label: "Billing" },
  { role: "admin", label: "Admin" },
];

export default function LoginForm({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>("billing_manager");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);

  async function enter(r: Role) {
    setBusy(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role: r, email }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setBusy(false);
    }
  }

  return el("div", { style: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "radial-gradient(130% 90% at 50% 0%,#DCE8F6 0%,#EEF4FB 55%)" } },
    el("div", { style: { width: 440, maxWidth: "100%", background: "#fff", borderRadius: 24, border: "1px solid #DCE3EE", padding: "40px 40px 30px", boxShadow: "0 30px 70px -30px rgba(33,49,79,.45)" } },
      el("img", { src: "/assets/cholla-logo.png", alt: "Cholla Behavioral Health", style: { height: 52, width: "auto", display: "block", margin: "0 auto 6px" } }),
      el("p", { style: { textAlign: "center", font: "600 11.5px Inter", letterSpacing: ".14em", textTransform: "uppercase", color: "#4C84C4", margin: "8px 0 2px" } }, "Billing & UR Intelligence"),
      el("h1", { style: { textAlign: "center", font: "600 21px Poppins", margin: "0 0 22px", color: "#21314F" } }, "Sign in to your workspace"),
      el("button", { onClick: () => enter(role), disabled: busy, style: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 11, border: "none", padding: 14, borderRadius: 13, font: "600 15px Poppins", color: "#fff", background: "#21314F", boxShadow: "0 10px 22px -10px rgba(33,49,79,.6)", marginBottom: 16 } },
        el("svg", { width: 18, height: 18, viewBox: "0 0 23 23" }, el("rect", { width: 10, height: 10, x: 1, y: 1, fill: "#F25022" }), el("rect", { width: 10, height: 10, x: 12, y: 1, fill: "#7FBA00" }), el("rect", { width: 10, height: 10, x: 1, y: 12, fill: "#00A4EF" }), el("rect", { width: 10, height: 10, x: 12, y: 12, fill: "#FFB900" })),
        "Sign in with Microsoft"),
      el("div", { style: { display: "flex", alignItems: "center", gap: 12, margin: "6px 0 16px" } },
        el("div", { style: { flex: 1, height: 1, background: "#E7EDF5" } }), el("span", { style: { font: "500 11.5px Inter", color: "#9AA8BD" } }, "or with email"), el("div", { style: { flex: 1, height: 1, background: "#E7EDF5" } })),
      el("input", { value: email, onChange: (e: any) => setEmail(e.target.value), placeholder: "you@chollabh.org", style: { width: "100%", padding: "12px 15px", border: "1.5px solid #DCE3EE", borderRadius: 12, font: "500 14px Inter", color: "#21314F", marginBottom: 11, outline: "none" } }),
      el("input", { value: pass, onChange: (e: any) => setPass(e.target.value), type: "password", placeholder: "Password", style: { width: "100%", padding: "12px 15px", border: "1.5px solid #DCE3EE", borderRadius: 12, font: "500 14px Inter", color: "#21314F", marginBottom: 6, outline: "none" } }),
      el("div", { style: { textAlign: "right", marginBottom: 16 } }, el("a", { href: "#", style: { font: "500 12px Inter", color: "#4C84C4", textDecoration: "none" } }, "Forgot password?")),
      el("button", { onClick: () => enter(role), disabled: busy, style: { width: "100%", border: "1.5px solid #DCE3EE", background: "#fff", color: "#21314F", padding: 12, borderRadius: 12, font: "600 14.5px Poppins", marginBottom: 22 } }, "Continue with email"),
      demo ? el("div", { style: { background: "#F7FAFE", border: "1px solid #E7EDF5", borderRadius: 14, padding: 14 } },
        el("div", { style: { font: "600 11px Inter", letterSpacing: ".08em", textTransform: "uppercase", color: "#7A8AA3", marginBottom: 9, textAlign: "center" } }, "Demo — preview as role"),
        el("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7 } },
          ...CHIPS.map((c) => el("button", { key: c.role, onClick: () => { setRole(c.role); enter(c.role); }, style: { border: "1.5px solid " + (role === c.role ? "#21314F" : "#DCE3EE"), background: role === c.role ? "#21314F" : "#fff", color: role === c.role ? "#fff" : "#5A6B85", font: "600 12px Inter", padding: "10px 4px", borderRadius: 10 } }, c.label)))) : null,
      el("p", { style: { textAlign: "center", font: "400 11px Inter", color: "#9AA8BD", margin: "18px 0 0", lineHeight: 1.5 } }, "HIPAA-conscious · SOC 2 · data under BAA")));
}
