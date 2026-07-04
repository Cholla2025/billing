// Single source of truth for Role-Based Access Control (buildspec 04).
// Consumed by BOTH the API (server-side enforcement) and the web UI (conditional nav).
// The server is authoritative — the UI gating is defense-in-depth only.

export const ROLES = [
  "client_viewer",
  "operations",
  "junior_biller",
  "billing_manager",
  "admin",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_META: Record<
  Role,
  { name: string; label: string; avatar: string; defaultNav: string }
> = {
  client_viewer: {
    name: "Dana Alvarez",
    label: "Cholla Leadership",
    avatar: "#4C84C4",
    defaultNav: "client-billing",
  },
  operations: {
    name: "Ruth Okafor",
    label: "Clinical Director",
    avatar: "#3F9C93",
    defaultNav: "client-billing",
  },
  junior_biller: {
    name: "Angela Ruiz",
    label: "Junior Biller",
    avatar: "#7A6FB0",
    defaultNav: "ops",
  },
  billing_manager: {
    name: "Marcus Webb",
    label: "Billing Team",
    avatar: "#BE6A45",
    defaultNav: "ops",
  },
  admin: {
    name: "Ruth Okafor",
    label: "Platform Admin",
    avatar: "#21314F",
    defaultNav: "admin-home",
  },
};

// Every navigable surface in the platform.
export type NavId =
  | "client-billing"
  | "client-ur"
  | "concurrent-review"
  | "ops"
  | "eligibility"
  | "charge-capture"
  | "imports"
  | "connections"
  | "settings"
  | "credentialing"
  | "admin-home"
  | "my-work";

// Which roles may VIEW each surface. Enforced at the API + used to build the sidebar.
export const SURFACE_ACCESS: Record<NavId, Role[]> = {
  "client-billing": ["client_viewer", "operations", "junior_biller", "billing_manager", "admin"],
  "client-ur": ["client_viewer", "operations", "junior_biller", "billing_manager", "admin"],
  "concurrent-review": ["operations", "junior_biller", "billing_manager", "admin"],
  "my-work": ["operations", "junior_biller", "billing_manager", "admin"],
  ops: ["junior_biller", "billing_manager", "admin"],
  eligibility: ["junior_biller", "billing_manager", "admin"],
  "charge-capture": ["junior_biller", "billing_manager", "admin"],
  imports: ["junior_biller", "billing_manager", "admin"],
  connections: ["operations", "billing_manager", "admin"],
  settings: ["junior_biller", "billing_manager", "admin"], // junior = read-only (enforced per-action)
  credentialing: ["billing_manager", "admin"],
  "admin-home": ["operations", "billing_manager", "admin"], // ops/manager = read
};

// Fine-grained actions (buildspec 04 action matrix).
export type Permission =
  | "claim.create"
  | "claim.submit"
  | "denial.work"
  | "denial.appeal"
  | "denial.writeoff.any"
  | "payment.post"
  | "payment.reverse"
  | "auth.manage"
  | "queue.reassign.all"
  | "queue.bulk"
  | "import.commit"
  | "settings.write"
  | "users.manage"
  | "connections.manage"
  | "record.delete"
  | "report.export";

const PERMS: Record<Role, Permission[]> = {
  client_viewer: ["report.export"],
  operations: ["report.export"],
  junior_biller: [
    "claim.create",
    "claim.submit",
    "denial.work",
    "denial.appeal",
    "payment.post",
    "auth.manage",
    "report.export",
  ],
  billing_manager: [
    "claim.create",
    "claim.submit",
    "denial.work",
    "denial.appeal",
    "denial.writeoff.any",
    "payment.post",
    "payment.reverse",
    "auth.manage",
    "queue.reassign.all",
    "queue.bulk",
    "import.commit",
    "settings.write",
    "users.manage",
    "connections.manage",
    "record.delete",
    "report.export",
  ],
  admin: [
    "claim.create",
    "claim.submit",
    "denial.work",
    "denial.appeal",
    "denial.writeoff.any",
    "payment.post",
    "payment.reverse",
    "auth.manage",
    "queue.reassign.all",
    "queue.bulk",
    "import.commit",
    "settings.write",
    "users.manage",
    "connections.manage",
    "record.delete",
    "report.export",
  ],
};

// Configurable thresholds (buildspec 04: expose in Settings, not hard-coded).
export const THRESHOLDS = {
  juniorWriteOffCap: 250, // junior_biller may write off up to this without manager approval
};

export function can(role: Role, perm: Permission): boolean {
  return PERMS[role]?.includes(perm) ?? false;
}

export function canViewSurface(role: Role, nav: NavId): boolean {
  return SURFACE_ACCESS[nav]?.includes(role) ?? false;
}

// A client_viewer token must NEVER receive member-level rows (de-identification guard).
export function isMemberLevelBlocked(role: Role): boolean {
  return role === "client_viewer";
}

export function permissionsFor(role: Role): Permission[] {
  return PERMS[role] ?? [];
}
