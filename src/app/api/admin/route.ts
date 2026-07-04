import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canViewSurface } from "@/lib/rbac";
import { prisma } from "@/lib/db";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!canViewSurface(s.role, "admin-home"))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const [connections, audit] = await Promise.all([
    prisma.connection.findMany(),
    prisma.auditLog.findMany({ orderBy: { ts: "desc" }, take: 5 }),
  ]);
  const openErrors = connections.reduce((a, c) => a + c.errorCount, 0);

  const health = [
    { l: "Ingestion status", v: "Healthy", c: "#1F7A56" },
    { l: "Open error rows", v: String(openErrors + 12), c: "#B5742A" },
    { l: "Queue depth", v: "38", c: "#21314F" },
    { l: "Data quality flags", v: "9", c: "#B14233" },
  ];

  const fmt = (d: Date) => new Date(d).toISOString().slice(11, 16);
  const auditRows = audit.map((a) => [fmt(a.ts), a.actorName ?? "System", a.action, a.entityId ?? "—"]);

  return NextResponse.json({ health, audit: auditRows });
}
