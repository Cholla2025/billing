import { NextResponse } from "next/server";
import { requireSession, HttpError } from "@/lib/auth";
import { urMetrics } from "@/domain/metrics";

export async function GET() {
  try {
    await requireSession();
    return NextResponse.json(await urMetrics());
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.reason }, { status: e.status });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
