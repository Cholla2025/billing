import { chromium } from "playwright-core";

const EXE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const B = "http://localhost:3000";

const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });

async function run() {
  // 1. login screen
  await page.goto(B + "/login", { waitUntil: "networkidle" });
  const hasSignIn = await page.getByText("Sign in to your workspace").count();
  const hasChips = await page.getByText("preview as role").count();

  // 2. enter as billing manager
  await page.getByRole("button", { name: "Billing" }).first().click();
  await page.waitForURL(B + "/", { timeout: 15000 });
  await page.waitForLoadState("networkidle");

  // 3. dashboard should show live KPIs
  const body = await page.textContent("body");
  const checks = {
    loginTitle: hasSignIn > 0,
    roleChips: hasChips > 0,
    kpiCharges: body.includes("$20.09M"),
    kpiCollected: body.includes("$7.46M"),
    claimsBilled: body.includes("18,841"),
    teamOpsNav: body.includes("Team Ops"),
    billingOverview: body.includes("Billing Overview"),
  };

  // 4. navigate to UR dashboard
  await page.getByRole("button", { name: "Utilization Review" }).first().click();
  await page.waitForTimeout(600);
  const urBody = await page.textContent("body");
  checks.urExpiring = urBody.includes("authorizations expire within 5 days");
  checks.urCensus = urBody.includes("Census by level of care");

  // 5. navigate to Team Ops (real DB rows)
  await page.getByRole("button", { name: "Team Ops" }).first().click();
  await page.waitForTimeout(600);
  const opsBody = await page.textContent("body");
  checks.opsQueue = opsBody.includes("Work queue");
  checks.opsClaimRow = /CLM\d{6}/.test(opsBody);

  console.log(JSON.stringify({ checks, errors }, null, 2));
  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
  console.log(failed.length ? "FAILED: " + failed.join(", ") : "ALL CHECKS PASSED");
}

try { await run(); } catch (e) { console.log("EXCEPTION: " + e.message); }
await browser.close();
