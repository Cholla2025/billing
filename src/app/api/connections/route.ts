import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canViewSurface } from "@/lib/rbac";
import { prisma } from "@/lib/db";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!canViewSurface(s.role, "connections"))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const rows = await prisma.connection.findMany();
  return NextResponse.json(
    rows.map((c) => ({
      name: c.name, type: c.kind, status: c.status, time: c.lastSyncAt ?? "—",
      recs: String(c.recordsToday), err: c.errorCount, on: c.enabled,
    })),
  );
}
