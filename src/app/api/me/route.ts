import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { permissionsFor } from "@/lib/rbac";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  return NextResponse.json({ ...s, permissions: permissionsFor(s.role) });
}
