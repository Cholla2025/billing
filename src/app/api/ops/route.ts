import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canViewSurface } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { PAYER_SHORT } from "@/domain/golden";

const TODAY = "2026-06-30";
const short = (n: string) => PAYER_SHORT[n] ?? n;
const daysAgo = (d: string) =>
  Math.max(0, Math.round((new Date(TODAY + "T00:00:00Z").getTime() - new Date(d + "T00:00:00Z").getTime()) / 86400000));
const CLEARING = ["Waystar", "Availity", "Change HC"];
const ASSIGNEES = ["M. Webb", "A. Ruiz", "L. Park", "J. Nguyen"];

// Role-scoped work queues — real rows from Postgres. Blocked for client_viewer/operations.
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!canViewSurface(s.role, "ops"))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const [claims, denials, rejections, payments, auths] = await Promise.all([
    prisma.claim.findMany({ take: 12, orderBy: { claimId: "desc" } }),
    prisma.denial.findMany({ where: { type: "Denial" }, take: 8, orderBy: { flagDate: "desc" }, include: { claim: { select: { payerName: true } } } }),
    prisma.denial.findMany({ where: { type: "Rejection" }, take: 6, orderBy: { flagDate: "desc" } }),
    prisma.payment.findMany({ take: 8, orderBy: { paymentDate: "desc" }, include: { payer: { select: { payerName: true } } } }),
    prisma.authorization.findMany({ where: { status: "Active" }, take: 8, orderBy: { endDate: "asc" }, include: { payer: { select: { payerName: true } } } }),
  ]);

  return NextResponse.json({
    ops: {
      claims: claims.map((c) => ({ id: c.claimId, member: c.memberId, payer: short(c.payerName), loc: c.levelOfCare, dos: c.dosStart, charge: c.chargeTotal, status: c.status })),
      denials: denials.map((d, i) => ({ id: d.claimId, payer: short(d.claim.payerName), reason: `${d.reasonCode} · ${d.reasonDesc}`, amt: d.amount, age: daysAgo(d.flagDate) + "d", next: d.nextAction ?? "Pending", who: d.assignee ?? ASSIGNEES[i % ASSIGNEES.length] })),
      rejections: rejections.map((r, i) => ({ id: r.claimId, src: CLEARING[i % CLEARING.length], err: r.reasonDesc, amt: r.amount })),
      payments: payments.map((p) => ({ id: p.claimId, payer: short(p.payer.payerName), paid: p.paidAmount, pt: p.patientPaid, adj: p.contractualAdj })),
      auths: auths.map((a) => {
        const expiring = a.daysToExpiration != null && a.daysToExpiration >= 0 && a.daysToExpiration <= 5;
        return { id: a.authNumber, member: a.memberId, payer: short(a.payer.payerName), loc: a.levelOfCare, units: `${a.unitsUsed} / ${a.unitsAuthorized}`, end: a.endDate, status: expiring ? "Expiring" : "Active" };
      }),
    },
  });
}
