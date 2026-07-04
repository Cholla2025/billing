import { NextResponse } from "next/server";
import { requireSession, HttpError } from "@/lib/auth";
import { billingMetrics } from "@/domain/metrics";

// De-identified aggregates — safe for every authed role including client_viewer.
export async function GET() {
  try {
    await requireSession();
    return NextResponse.json(await billingMetrics());
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.reason }, { status: e.status });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
