import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canViewSurface } from "@/lib/rbac";
import { prisma } from "@/lib/db";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!canViewSurface(s.role, "settings"))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const [payers, codes, providers] = await Promise.all([
    prisma.payer.findMany({ orderBy: { payerType: "asc" } }),
    prisma.serviceCode.findMany(),
    prisma.provider.findMany(),
  ]);

  return NextResponse.json({
    payers: payers.map((p) => ({ name: p.payerName, type: p.payerType, days: p.payDays, ptResp: p.ptResp })),
    codes: codes.map((c) => ({ code: c.serviceCode, sys: c.codeSystem, desc: c.description, charge: c.charge, allowed: c.allowed })),
    providers: providers.map((p) => ({ name: p.providerName, role: p.providerRole })),
  });
}
