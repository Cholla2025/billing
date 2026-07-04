import { PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const TODAY = "2026-06-30";

const DATASET_DIR =
  process.env.DATASET_DIR ||
  path.join(process.cwd(), "project", "cholla-billing-buildspec", "dataset");

function read(file: string): Record<string, string>[] {
  const raw = fs.readFileSync(path.join(DATASET_DIR, file), "utf8");
  return parse(raw, { columns: true, skip_empty_lines: true, bom: true });
}
const num = (v: string | undefined) => (v === undefined || v === "" ? 0 : parseFloat(v));
const int = (v: string | undefined) => (v === undefined || v === "" ? 0 : parseInt(v, 10));
const str = (v: string | undefined) => (v === undefined || v === "" ? null : v);

function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(from + "T00:00:00Z").getTime() - new Date(to + "T00:00:00Z").getTime()) / 86400000,
  );
}

async function batch<T>(rows: T[], size: number, fn: (chunk: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += size) await fn(rows.slice(i, i + size));
}

async function main() {
  console.log(`Seeding from ${DATASET_DIR}`);

  // Clear (child → parent) so re-seeding is idempotent
  await prisma.$transaction([
    prisma.claimLine.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.denial.deleteMany(),
    prisma.authorization.deleteMany(),
    prisma.censusEvent.deleteMany(),
    prisma.claim.deleteMany(),
    prisma.member.deleteMany(),
    prisma.provider.deleteMany(),
    prisma.serviceCode.deleteMany(),
    prisma.payer.deleteMany(),
  ]);

  // ---- reference tables ----
  const payers = read("payers.csv");
  await prisma.payer.createMany({
    data: payers.map((p) => ({
      payerId: p.payer_id, payerName: p.payer_name, payerType: p.payer_type,
      payDays: int(p.pay_days), ptResp: num(p.pt_resp),
    })),
  });
  const payerIds = new Set(payers.map((p) => p.payer_id));

  const codes = read("service_codes.csv");
  await prisma.serviceCode.createMany({
    data: codes.map((c) => ({
      serviceCode: c.service_code, codeSystem: c.code_system, description: c.description,
      charge: num(c.charge), allowed: num(c.allowed),
    })),
  });
  const codeIds = new Set(codes.map((c) => c.service_code));

  const providers = read("providers.csv");
  await prisma.provider.createMany({
    data: providers.map((p) => ({
      providerId: p.provider_id, providerName: p.provider_name, providerRole: p.provider_role,
    })),
  });
  const providerIds = new Set(providers.map((p) => p.provider_id));

  const members = read("members.csv");
  await batch(members, 2000, (chunk) =>
    prisma.member.createMany({
      data: chunk.map((m) => ({ memberId: m.member_id, memberName: m.member_name, dob: str(m.dob) })),
    }),
  );
  const memberIds = new Set(members.map((m) => m.member_id));

  // ---- claims (FK-safe) ----
  const claims = read("claims.csv").filter(
    (c) => memberIds.has(c.member_id) && payerIds.has(c.payer_id),
  );
  await batch(claims, 4000, (chunk) =>
    prisma.claim.createMany({
      data: chunk.map((c) => ({
        claimId: c.claim_id, memberId: c.member_id, payerId: c.payer_id,
        payerName: c.payer_name, payerType: c.payer_type, levelOfCare: c.level_of_care,
        episodeId: str(c.episode_id), dosStart: c.dos_start, dosEnd: c.dos_end, dosMonth: c.dos_month,
        renderingProviderId: providerIds.has(c.rendering_provider) ? c.rendering_provider : null,
        status: c.status, submitDate: str(c.submit_date), paidDate: str(c.paid_date),
        chargeTotal: num(c.charge_total), allowedTotal: num(c.allowed_total),
        paidAmount: num(c.paid_amount), patientPaid: num(c.patient_paid),
        collected: num(c.collected), contractualAdj: num(c.contractual_adj), arBalance: num(c.ar_balance),
      })),
    }),
  );
  const claimIds = new Set(claims.map((c) => c.claim_id));

  // ---- claim lines ----
  const lines = read("claim_lines.csv").filter(
    (l) => claimIds.has(l.claim_id) && codeIds.has(l.service_code),
  );
  await batch(lines, 5000, (chunk) =>
    prisma.claimLine.createMany({
      data: chunk.map((l) => ({
        claimId: l.claim_id, serviceCode: l.service_code, units: int(l.units),
        chargeAmount: num(l.charge_amount), allowedAmount: num(l.allowed_amount),
      })),
    }),
  );

  // ---- payments ----
  const payments = read("payments.csv").filter(
    (p) => claimIds.has(p.claim_id) && payerIds.has(p.payer_id),
  );
  await batch(payments, 4000, (chunk) =>
    prisma.payment.createMany({
      data: chunk.map((p) => ({
        paymentId: p.payment_id, claimId: p.claim_id, payerId: p.payer_id,
        paidAmount: num(p.paid_amount), patientPaid: num(p.patient_paid),
        contractualAdj: num(p.contractual_adj), paymentDate: p.payment_date,
      })),
    }),
  );

  // ---- denials & rejections ----
  const denials = read("denials.csv").filter((d) => claimIds.has(d.claim_id));
  await batch(denials, 4000, (chunk) =>
    prisma.denial.createMany({
      data: chunk.map((d) => ({
        denialId: d.denial_id, claimId: d.claim_id, type: d.type,
        reasonCode: d.reason_code, reasonDesc: d.reason_desc, amount: num(d.amount),
        status: d.status, nextAction: str(d.next_action), flagDate: d.flag_date,
      })),
    }),
  );

  // ---- authorizations (compute days-to-expiration for actives) ----
  const auths = read("authorizations.csv").filter(
    (a) => memberIds.has(a.member_id) && payerIds.has(a.payer_id),
  );
  await batch(auths, 3000, (chunk) =>
    prisma.authorization.createMany({
      data: chunk.map((a) => {
        const dte =
          a.days_to_expiration !== "" && a.days_to_expiration !== undefined
            ? int(a.days_to_expiration)
            : a.status === "Active"
              ? daysBetween(a.end_date, TODAY)
              : null;
        return {
          authorizationId: a.authorization_id, memberId: a.member_id, episodeId: str(a.episode_id),
          payerId: a.payer_id, levelOfCare: a.level_of_care, authNumber: a.auth_number,
          conRon: str(a.con_ron), unitsAuthorized: int(a.units_authorized), unitsUsed: int(a.units_used),
          unitType: str(a.unit_type), startDate: a.start_date, endDate: a.end_date,
          status: a.status, daysToExpiration: dte,
        };
      }),
    }),
  );

  // ---- census events ----
  const census = read("census_events.csv").filter((c) => memberIds.has(c.member_id));
  await batch(census, 3000, (chunk) =>
    prisma.censusEvent.createMany({
      data: chunk.map((c) => ({
        censusEventId: c.census_event_id, memberId: c.member_id, episodeId: str(c.episode_id),
        levelOfCare: c.level_of_care, dateIn: c.date_in, dateOut: str(c.date_out), status: c.status,
      })),
    }),
  );

  await seedPlatform();

  const [nc, nl, np, nd, na, nce] = await Promise.all([
    prisma.claim.count(), prisma.claimLine.count(), prisma.payment.count(),
    prisma.denial.count(), prisma.authorization.count(), prisma.censusEvent.count(),
  ]);
  console.log(
    `Seeded: ${nc} claims · ${nl} lines · ${np} payments · ${nd} denials · ${na} auths · ${nce} census`,
  );
}

async function seedPlatform() {
  await prisma.$transaction([
    prisma.appUser.deleteMany(), prisma.connection.deleteMany(), prisma.apiKey.deleteMany(),
    prisma.webhookEvent.deleteMany(), prisma.auditLog.deleteMany(), prisma.scrubRule.deleteMany(),
    prisma.task.deleteMany(),
  ]);

  await prisma.appUser.createMany({
    data: [
      { name: "Dana Alvarez", email: "d.alvarez@chollabh.org", role: "client_viewer" },
      { name: "Ruth Okafor", email: "r.okafor@chollabh.org", role: "admin" },
      { name: "Ruth Okafor", email: "r.okafor+ops@chollabh.org", role: "operations" },
      { name: "Marcus Webb", email: "m.webb@chollabh.org", role: "billing_manager" },
      { name: "Angela Ruiz", email: "a.ruiz@chollabh.org", role: "junior_biller" },
    ],
  });

  await prisma.connection.createMany({
    data: [
      { name: "Waystar clearinghouse", kind: "Claims · 837 / 835", status: "Connected", lastSyncAt: "2 min ago", recordsToday: 312, errorCount: 0, enabled: true },
      { name: "Kipu EHR", kind: "Census · demographics", status: "Connected", lastSyncAt: "18 min ago", recordsToday: 176, errorCount: 0, enabled: true },
      { name: "n8n automations", kind: "Denial + auth webhooks", status: "Connected", lastSyncAt: "1 hr ago", recordsToday: 38, errorCount: 2, enabled: true },
      { name: "Make.com", kind: "Report delivery", status: "Paused", lastSyncAt: null, recordsToday: 0, errorCount: 0, enabled: false },
      { name: "Manual entry", kind: "Forms · Import Wizard", status: "Always on", lastSyncAt: "live", recordsToday: 44, errorCount: 0, enabled: true },
    ],
  });

  await prisma.apiKey.createMany({
    data: [
      { label: "Production key", scope: "claims:write", maskedKey: "pk_live_••••4821" },
      { label: "n8n ingest key", scope: "webhooks:write", maskedKey: "pk_n8n_••••9f2a" },
    ],
  });

  await prisma.webhookEvent.createMany({
    data: [
      { topic: "claim.denied", statusCode: 200 }, { topic: "auth.updated", statusCode: 200 },
      { topic: "payment.posted", statusCode: 200 }, { topic: "claim.denied", statusCode: 500, retried: true },
    ],
  });

  // ~default scrub rules (Addition 2.1)
  await prisma.scrubRule.createMany({
    data: [
      { name: "Auth on file & units available for DOS", category: "Authorization", severity: "Block" },
      { name: "Rendering provider credentialed with payer", category: "Credentialing", severity: "Block" },
      { name: "Documentation signed for all DOS", category: "Documentation", severity: "Block" },
      { name: "Timely filing window open", category: "Timely filing", severity: "Warn" },
      { name: "Eligibility verified within 30 days", category: "Eligibility", severity: "Warn" },
      { name: "Demographic completeness (DOB, member ID format)", category: "Data", severity: "Warn" },
      { name: "Duplicate DOS check", category: "Data", severity: "Block" },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { actorName: "M. Webb", action: "Posted payment", entityType: "payment", entityId: "CLM018833" },
      { actorName: "A. Ruiz", action: "Updated authorization", entityType: "authorization", entityId: "AZ822824-IOP" },
      { actorName: "System", action: "Ingested batch · Waystar", entityType: "import_batch", entityId: "312 claims" },
      { actorName: "R. Okafor", action: "Exported report", entityType: "report", entityId: "Billing Overview · 30d" },
      { actorName: "M. Webb", action: "Logged denial", entityType: "denial", entityId: "CLM000006" },
    ],
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
