import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ROLES } from "@/lib/rbac";
import { sessionForRole, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";

const Body = z.object({
  role: z.enum(ROLES).optional(),
  email: z.string().optional(),
});

// Email/password fallback + demo "preview as role". Production swaps in OIDC (Entra)
// behind getSession(); the demo role switch is gated by NEXT_PUBLIC_DEMO_ROLE_SWITCH.
export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const demoEnabled = process.env.NEXT_PUBLIC_DEMO_ROLE_SWITCH !== "false";
  const role = parsed.data.role && demoEnabled ? parsed.data.role : "billing_manager";
  const session = sessionForRole(role);
  if (parsed.data.email) session.email = parsed.data.email;

  await setSessionCookie(session);
  await prisma.auditLog
    .create({ data: { actorName: session.name, action: "Signed in", entityType: "session", entityId: role } })
    .catch(() => {});

  return NextResponse.json({ ok: true, role, name: session.name });
}
