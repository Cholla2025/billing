import { cookies } from "next/headers";
import crypto from "node:crypto";
import { Role, ROLE_META, ROLES, Permission, can } from "./rbac";

// ---------------------------------------------------------------------------
// Lightweight signed-cookie session (HMAC-SHA256). This is the local/dev auth
// path + the demo "preview as role" switcher. Production swaps in real OIDC
// (Microsoft Entra) behind this same getSession() interface — see docs.
// ---------------------------------------------------------------------------

const COOKIE = "cholla_session";
const SECRET = process.env.SESSION_SECRET || "dev-only-change-me-in-production";

export interface Session {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function signSession(session: Session): string {
  const payload = b64url(JSON.stringify(session));
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  // constant-time compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (!ROLES.includes(parsed.role)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Build a session for a role (used by demo preview + as the identity template).
export function sessionForRole(role: Role): Session {
  const m = ROLE_META[role];
  return {
    userId: `demo-${role}`,
    name: m.name,
    email: `${m.name.toLowerCase().replace(/[^a-z]+/g, ".")}@chollabh.org`,
    role,
  };
}

// Server-side session read (route handlers / server components).
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySession(store.get(COOKIE)?.value);
}

export async function setSessionCookie(session: Session): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, signSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export const COOKIE_NAME = COOKIE;

// ---- API guards ----------------------------------------------------------

export class HttpError extends Error {
  constructor(public status: number, public reason: string) {
    super(reason);
  }
}

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new HttpError(401, "Not authenticated");
  return s;
}

export async function requirePermission(perm: Permission): Promise<Session> {
  const s = await requireSession();
  if (!can(s.role, perm)) throw new HttpError(403, `Missing permission: ${perm}`);
  return s;
}
