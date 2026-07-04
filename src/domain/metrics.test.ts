import { test } from "node:test";
import assert from "node:assert/strict";
import { computeLiveBilling, urMetrics } from "./metrics";
import { GOLDEN } from "./golden";

// Golden-file test (buildspec 09): the LIVE Postgres computations must reproduce
// the validated aggregates. Run with `npm test` (requires a seeded DATABASE_URL).

test("billing headline totals match golden", async () => {
  const live = await computeLiveBilling();
  assert.equal(live.kpi.claimsBilled, GOLDEN.kpi.claimsBilled, "claimsBilled");
  assert.equal(live.kpi.totalCharges, GOLDEN.kpi.totalCharges, "totalCharges");
  assert.equal(live.kpi.totalCollected, GOLDEN.kpi.totalCollected, "totalCollected");
  assert.equal(live.kpi.openAR, GOLDEN.kpi.openAR, "openAR");
  assert.equal(live.kpi.grossCR, GOLDEN.kpi.grossCR, "grossCR");
});

test("work-queue counts match golden", async () => {
  const live = await computeLiveBilling();
  assert.deepEqual(live.counts, GOLDEN.counts);
});

test("monthly series matches golden", async () => {
  const live = await computeLiveBilling();
  assert.deepEqual(live.monthly, GOLDEN.monthly);
});

test("payer mix matches golden", async () => {
  const live = await computeLiveBilling();
  assert.deepEqual(live.payerMix, GOLDEN.payerMix as unknown as typeof live.payerMix);
});

test("UR headline numbers match golden", async () => {
  const ur = await urMetrics();
  assert.equal(ur.ur.activeAuth, GOLDEN.ur.activeAuth, "activeAuth");
  assert.equal(ur.ur.unitsRemaining, GOLDEN.ur.unitsRemaining, "unitsRemaining");
  assert.equal(ur.ur.expiring5, GOLDEN.ur.expiring5, "expiring5");
  assert.equal(ur.ur.currentCensus, GOLDEN.ur.currentCensus, "currentCensus");
});
