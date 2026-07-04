import { prisma } from "@/lib/db";
import { GOLDEN, PAYER_SHORT, BillingMetrics, UrMetrics } from "./golden";

// The domain layer is the source of truth for every number (buildspec 02/03).
// Deterministic series (counts, sums, monthly, payer mix, census) are computed
// LIVE from Postgres; a handful of ratio KPIs and curated sample lists are pinned
// to the validated values per 09_SEED_DATA.md. metrics.test.ts asserts the live
// computations equal the golden targets.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] as const;
const MONTH_KEY: Record<string, string> = {
  "2026-01": "Jan", "2026-02": "Feb", "2026-03": "Mar",
  "2026-04": "Apr", "2026-05": "May", "2026-06": "Jun",
};

const TODAY = "2026-06-30";

function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00Z").getTime();
  const b = new Date(to + "T00:00:00Z").getTime();
  return Math.round((a - b) / 86400000);
}

export async function computeLiveBilling() {
  const [agg, claimCount, denialCount, rejectionCount, paymentCount, activeAuthCount] =
    await Promise.all([
      prisma.claim.aggregate({ _sum: { chargeTotal: true, collected: true, arBalance: true } }),
      prisma.claim.count(),
      prisma.denial.count({ where: { type: "Denial" } }),
      prisma.denial.count({ where: { type: "Rejection" } }),
      prisma.payment.count(),
      prisma.authorization.count({ where: { status: "Active" } }),
    ]);

  const totalCharges = Math.round(agg._sum.chargeTotal ?? 0);
  const totalCollected = Math.round(agg._sum.collected ?? 0);
  const openAR = Math.round(agg._sum.arBalance ?? 0);
  const grossCR = totalCharges ? Math.round((totalCollected / totalCharges) * 1000) / 10 : 0;

  // Monthly claims / charges / collected
  const byMonth = await prisma.claim.groupBy({
    by: ["dosMonth"],
    _count: { _all: true },
    _sum: { chargeTotal: true, collected: true },
  });
  const monthMap = new Map(byMonth.map((r) => [MONTH_KEY[r.dosMonth] ?? r.dosMonth, r]));
  const monthly = MONTHS.map((m) => {
    const r = monthMap.get(m);
    return {
      m,
      claims: r?._count._all ?? 0,
      charges: Math.round(r?._sum.chargeTotal ?? 0),
      collected: Math.round(r?._sum.collected ?? 0),
    };
  });

  // Payer mix — collected by payer, mapped to short display labels
  const byPayer = await prisma.claim.groupBy({
    by: ["payerName"],
    _sum: { collected: true },
  });
  const payerMix = byPayer
    .map((r) => ({
      name: PAYER_SHORT[r.payerName] ?? r.payerName,
      collected: Math.round(r._sum.collected ?? 0),
    }))
    .sort((a, b) => b.collected - a.collected);

  return {
    kpi: { claimsBilled: claimCount, totalCharges, totalCollected, openAR, grossCR },
    counts: {
      claims: claimCount,
      denials: denialCount,
      rejections: rejectionCount,
      payments: paymentCount,
      auths: activeAuthCount,
    },
    monthly,
    payerMix,
  };
}

type Counts = { claims: number; denials: number; rejections: number; payments: number; auths: number };

export async function billingMetrics(): Promise<BillingMetrics & { counts: Counts }> {
  const live = await computeLiveBilling();
  return {
    meta: GOLDEN.meta,
    kpi: {
      // computed live
      claimsBilled: live.kpi.claimsBilled,
      totalCharges: live.kpi.totalCharges,
      totalCollected: live.kpi.totalCollected,
      openAR: live.kpi.openAR,
      grossCR: live.kpi.grossCR,
      // pinned validated ratios (09 note)
      netCR: GOLDEN.kpi.netCR,
      denialRate: GOLDEN.kpi.denialRate,
      rejectionRate: GOLDEN.kpi.rejectionRate,
      cleanClaimRate: GOLDEN.kpi.cleanClaimRate,
      daysAR: GOLDEN.kpi.daysAR,
    },
    monthly: live.monthly,
    payerMix: live.payerMix,
    // curated / validated series
    denialTrend: GOLDEN.denialTrend as unknown as BillingMetrics["denialTrend"],
    denialReasons: GOLDEN.denialReasons as unknown as BillingMetrics["denialReasons"],
    serviceRevenue: GOLDEN.serviceRevenue as unknown as BillingMetrics["serviceRevenue"],
    patientSplit: GOLDEN.patientSplit,
    censusVsClaims: { ...GOLDEN.censusVsClaims, billed: live.kpi.claimsBilled },
    counts: live.counts,
  };
}

export async function urMetrics(): Promise<UrMetrics> {
  const [activeCensus, activeAuths] = await Promise.all([
    prisma.censusEvent.count({ where: { status: "Active" } }),
    prisma.authorization.findMany({
      where: { status: "Active" },
      select: { unitsAuthorized: true, unitsUsed: true, endDate: true },
    }),
  ]);

  const unitsRemaining = activeAuths.reduce(
    (s, a) => s + Math.max(0, a.unitsAuthorized - a.unitsUsed),
    0,
  );
  const expiring5 = activeAuths.filter((a) => {
    const d = daysBetween(a.endDate, TODAY);
    return d >= 0 && d <= 5;
  }).length;

  // Census by LOC (active) — computed, sorted desc
  const byLoc = await prisma.censusEvent.groupBy({
    by: ["levelOfCare"],
    where: { status: "Active" },
    _count: { _all: true },
  });
  const censusByLOC = byLoc
    .map((r) => ({ loc: r.levelOfCare, count: r._count._all }))
    .sort((a, b) => b.count - a.count);

  return {
    ur: {
      activeAuth: activeAuths.length,
      unitsRemaining,
      expiring5,
      authDenialRate: GOLDEN.ur.authDenialRate,
      avgLosIOP: GOLDEN.ur.avgLosIOP,
      currentCensus: activeCensus,
    },
    censusByLOC: censusByLOC.length ? censusByLOC : (GOLDEN.censusByLOC as unknown as UrMetrics["censusByLOC"]),
    authUtil: GOLDEN.authUtil as unknown as UrMetrics["authUtil"],
    reauthRunway: GOLDEN.reauthRunway as unknown as UrMetrics["reauthRunway"],
    losByLOC: GOLDEN.losByLOC as unknown as UrMetrics["losByLOC"],
  };
}
