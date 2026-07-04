// Validated aggregate output (buildspec 09_SEED_DATA.md acceptance target).
// This mirrors reference/cholla-data.js — the numbers the dashboards must reproduce.
// The metrics layer computes the deterministic series live from Postgres and asserts
// they equal these values (see metrics.test.ts); curated sample lists (authUtil,
// reauthRunway, losByLOC, ops samples) are served from here. See docs/DECISIONS.md.

export type BillingMetrics = {
  meta: { period: string; today: string };
  kpi: {
    claimsBilled: number; totalCharges: number; totalCollected: number;
    netCR: number; grossCR: number; denialRate: number; rejectionRate: number;
    cleanClaimRate: number; daysAR: number; openAR: number;
  };
  monthly: { m: string; claims: number; charges: number; collected: number }[];
  denialTrend: { m: string; denials: number; rejections: number }[];
  denialReasons: { code: string; desc: string; count: number }[];
  payerMix: { name: string; collected: number }[];
  serviceRevenue: { code: string; desc: string; amount: number }[];
  patientSplit: { insurance: number; patient: number };
  censusVsClaims: { eligible: number; billed: number; unbilled: number };
};

export type UrMetrics = {
  ur: { activeAuth: number; unitsRemaining: number; expiring5: number; authDenialRate: number; avgLosIOP: number; currentCensus: number };
  censusByLOC: { loc: string; count: number }[];
  authUtil: { auth: string; loc: string; used: number; authorized: number }[];
  reauthRunway: { auth: string; loc: string; payer: string; days: number }[];
  losByLOC: { loc: string; lo: number; q1: number; med: number; q3: number; hi: number }[];
};

export const GOLDEN = {
  meta: { period: "Jan 1 – Jun 30, 2026", today: "June 30, 2026" },
  kpi: {
    claimsBilled: 18841, totalCharges: 20092345, totalCollected: 7462475,
    netCR: 92.4, grossCR: 37.1, denialRate: 7.7, rejectionRate: 3.9,
    cleanClaimRate: 96.1, daysAR: 45, openAR: 2633304,
  },
  monthly: [
    { m: "Jan", claims: 3190, charges: 3620280, collected: 1685264 },
    { m: "Feb", claims: 2567, charges: 2936135, collected: 1320454 },
    { m: "Mar", claims: 3429, charges: 3749365, collected: 1704354 },
    { m: "Apr", claims: 3273, charges: 3357575, collected: 1538323 },
    { m: "May", claims: 3369, charges: 3520290, collected: 1164363 },
    { m: "Jun", claims: 3013, charges: 2908700, collected: 49717 },
  ],
  denialTrend: [
    { m: "Jan", denials: 28, rejections: 103 }, { m: "Feb", denials: 246, rejections: 114 },
    { m: "Mar", denials: 318, rejections: 121 }, { m: "Apr", denials: 383, rejections: 107 },
    { m: "May", denials: 394, rejections: 150 }, { m: "Jun", denials: 394, rejections: 100 },
  ],
  denialReasons: [
    { code: "CO-197", desc: "Precert/authorization absent", count: 456 },
    { code: "CO-16", desc: "Claim lacks information", count: 269 },
    { code: "CO-50", desc: "Not deemed medically necessary", count: 218 },
    { code: "CO-97", desc: "Service included in another", count: 167 },
    { code: "Other", desc: "Other CARC", count: 653 },
  ],
  payerMix: [
    { name: "AZ Complete Health", collected: 1664479 }, { name: "Mercy Care", collected: 1282494 },
    { name: "Care1st AZ", collected: 949869 }, { name: "Banner UFC", collected: 892202 },
    { name: "UHC Community", collected: 653725 }, { name: "AZ Blue", collected: 538428 },
    { name: "UHC Commercial", collected: 431103 }, { name: "Cigna", collected: 347027 },
    { name: "Molina AZ", collected: 335056 }, { name: "Aetna", collected: 213255 },
    { name: "Self-Pay", collected: 154837 },
  ],
  serviceRevenue: [
    { code: "H0018", desc: "BHRF Residential SUD, per diem", amount: 3457940 },
    { code: "H0035", desc: "Partial Hospitalization (PHP), per diem", amount: 2430960 },
    { code: "H0015", desc: "IOP - Substance Use, per diem", amount: 1139280 },
    { code: "H0019", desc: "BHRF Residential MH, per diem", amount: 1074780 },
    { code: "S9480", desc: "IOP - Mental Health, per diem", amount: 673425 },
    { code: "99214", desc: "E/M med management, established", amount: 440370 },
    { code: "90791", desc: "Psychiatric diagnostic evaluation", amount: 338635 },
  ],
  patientSplit: { insurance: 7092999, patient: 369476 },
  censusVsClaims: { eligible: 24398, billed: 18841, unbilled: 5557 },
  ur: { activeAuth: 84, unitsRemaining: 704, expiring5: 17, authDenialRate: 2.5, avgLosIOP: 45, currentCensus: 214 },
  censusByLOC: [ { loc: "IOP", count: 120 }, { loc: "BHRF", count: 62 }, { loc: "PHP", count: 32 } ],
  authUtil: [
    { auth: "AZ545509-BHRF", loc: "BHRF", used: 30, authorized: 30 },
    { auth: "AZ636952-BHRF", loc: "BHRF", used: 30, authorized: 30 },
    { auth: "AZ135980-BHRF", loc: "BHRF", used: 29, authorized: 30 },
    { auth: "AZ472279-BHRF", loc: "BHRF", used: 28, authorized: 30 },
    { auth: "AZ535810-IOP", loc: "IOP", used: 12, authorized: 13 },
    { auth: "AZ228486-IOP", loc: "IOP", used: 12, authorized: 13 },
  ],
  reauthRunway: [
    { auth: "AZ545509-BHRF", loc: "BHRF", payer: "AZ Complete Health", days: 0 },
    { auth: "AZ636952-BHRF", loc: "BHRF", payer: "AZ Blue", days: 0 },
    { auth: "AZ919732-IOP", loc: "IOP", payer: "Banner UFC", days: 0 },
    { auth: "AZ592545-IOP", loc: "IOP", payer: "Aetna", days: 0 },
    { auth: "AZ135980-BHRF", loc: "BHRF", payer: "UHC Community", days: 1 },
    { auth: "AZ228486-IOP", loc: "IOP", payer: "AZ Complete Health", days: 1 },
    { auth: "AZ472248-IOP", loc: "IOP", payer: "Cigna", days: 1 },
    { auth: "AZ472279-BHRF", loc: "BHRF", payer: "Mercy Care", days: 2 },
  ],
  losByLOC: [
    { loc: "IOP", lo: 22, q1: 34, med: 44, q3: 54, hi: 72 },
    { loc: "PHP", lo: 4, q1: 9, med: 15, q3: 21, hi: 37 },
    { loc: "BHRF", lo: 12, q1: 20, med: 28, q3: 35, hi: 53 },
  ],
  counts: { claims: 18841, denials: 1763, rejections: 727, payments: 13125, auths: 84 },
} as const;

// Full payer_name (dataset) → short display label (dashboards).
export const PAYER_SHORT: Record<string, string> = {
  "Arizona Complete Health (AzCH-CCP)": "AZ Complete Health",
  "Mercy Care (Aetna)": "Mercy Care",
  "Care1st Health Plan Arizona": "Care1st AZ",
  "Banner University Family Care": "Banner UFC",
  "UnitedHealthcare Community Plan": "UHC Community",
  "Molina Healthcare of Arizona": "Molina AZ",
  "AZ Blue (BCBS Arizona)": "AZ Blue",
  "Cigna Behavioral Health": "Cigna",
  "UnitedHealthcare Commercial": "UHC Commercial",
  "Aetna Commercial": "Aetna",
  "Self-Pay": "Self-Pay",
};

export const MEDICAID_SHORT = ["AZ Complete Health", "Mercy Care", "Care1st AZ", "Banner UFC", "UHC Community", "Molina AZ"];
