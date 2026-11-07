import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";
import { createAccessControl } from "better-auth/plugins/access";

/**
 * Central permission model for school-scoped operations.
 *
 * The Better Auth organization plugin uses this access-control instance for
 * `hasPermission` checks and for the roles that can be assigned to a school
 * membership. Phase 4 builds on these statements so every API can call
 * centralized middleware functions (`requirePermission`, `requireRole`) instead
 * of hand-rolling role checks.
 */
export const statement = {
  ...defaultStatements,
  platform: ["read", "manage", "analytics"],
  school: ["create", "read", "update", "delete", "manage", "suspend", "activate"],
  subscription: ["create", "read", "update", "delete", "manage"],
  student: ["create", "read", "update", "delete", "manage"],
  teacher: ["create", "read", "update", "delete", "manage"],
  staff: ["create", "read", "update", "delete", "manage"],
  attendance: ["create", "read", "update", "delete"],
  fees: ["create", "read", "update", "delete", "manage"],
  expense: ["create", "read", "update", "delete", "manage"],
  exam: ["create", "read", "update", "delete", "manage"],
  homework: ["create", "read", "update", "delete"],
  report: ["read", "export"],
  setting: ["read", "update", "manage"],
  communication: ["create", "read", "update", "delete"],
  transport: ["create", "read", "update", "delete"],
  library: ["create", "read", "update", "delete"],
  system: ["read", "backup", "restore", "reset", "manage"],
} as const;

export const ac = createAccessControl(statement);

const ALL = Object.fromEntries(
  Object.entries(statement).map(([resource, actions]) => [resource, [...actions]]),
) as { [K in keyof typeof statement]: (typeof statement)[K][number][] };

export const roles = {
  /** Platform super administrator: manage all schools, subscriptions, school owners, analytics */
  super_admin: ac.newRole({
    ...ALL,
    platform: ["read", "manage", "analytics"],
    school: ["create", "read", "update", "delete", "manage", "suspend", "activate"],
    subscription: ["create", "read", "update", "delete", "manage"],
  }),

  /** School owner: full access within their school, manage school admins, staff, settings */
  owner: ac.newRole({
    ...ALL,
    platform: [],
    school: ["read", "update", "manage"],
    subscription: ["read"],
  }),

  /** School administrator: full operational access to school modules, students, staff, classes */
  admin: ac.newRole({
    ...ALL,
    platform: [],
    organization: ["update"],
    school: ["read", "update"],
    subscription: ["read"],
    setting: ["read", "update"],
    system: ["read", "backup"],
    member: ["create", "update"],
    invitation: ["create", "cancel"],
  }),

  /** Teacher: manage assigned classes, attendance, exams, homework, lessons, view student records */
  teacher: ac.newRole({
    organization: [],
    platform: [],
    school: ["read"],
    subscription: [],
    student: ["read"],
    teacher: ["read"],
    staff: [],
    attendance: ["create", "read", "update"],
    fees: [],
    expense: [],
    exam: ["create", "read", "update"],
    homework: ["create", "read", "update", "delete"],
    report: ["read"],
    setting: ["read"],
    communication: ["read"],
    transport: ["read"],
    library: ["read"],
    system: [],
    member: [],
    invitation: [],
    team: [],
    ac: [],
  }),

  /** Accountant: manage fees, payments, expenses, financial reports; cannot access admin settings */
  accountant: ac.newRole({
    organization: [],
    platform: [],
    school: ["read"],
    subscription: [],
    student: ["read"],
    teacher: [],
    staff: [],
    attendance: [],
    fees: ["create", "read", "update", "delete", "manage"],
    expense: ["create", "read", "update", "delete", "manage"],
    exam: [],
    homework: [],
    report: ["read", "export"],
    setting: ["read"],
    communication: ["read"],
    transport: ["read"],
    library: [],
    system: [],
    member: [],
    invitation: [],
    team: [],
    ac: [],
  }),

  /** Staff: create and read permitted records; cannot delete or perform unauthorized updates */
  staff: ac.newRole({
    organization: [],
    platform: [],
    school: ["read"],
    subscription: [],
    student: ["create", "read", "update"],
    teacher: ["read"],
    staff: ["read"],
    attendance: ["create", "read", "update"],
    fees: [],
    expense: [],
    exam: ["read"],
    homework: ["read"],
    report: ["read"],
    setting: ["read"],
    communication: ["create", "read"],
    transport: ["read"],
    library: ["create", "read", "update"],
    system: [],
    member: [],
    invitation: [],
    team: [],
    ac: [],
  }),

  /** General member (e.g. student or parent): basic read-only access */
  member: ac.newRole({
    organization: [],
    platform: [],
    school: ["read"],
    subscription: [],
    student: ["read"],
    teacher: ["read"],
    staff: [],
    attendance: ["read"],
    fees: [],
    expense: [],
    exam: ["read"],
    homework: ["read"],
    report: ["read"],
    setting: [],
    communication: ["read"],
    transport: ["read"],
    library: ["read"],
    system: [],
    member: [],
    invitation: [],
    team: [],
    ac: [],
  }),
} as const;

export type SchoolRole = keyof typeof roles;

/** Built-in Better Auth organization roles that we keep available. */
export const betterAuthDefaultRoles = { admin: adminAc, owner: ownerAc, member: memberAc };

const ROLE_ALIASES: Record<string, SchoolRole> = {
  super_admin: "super_admin",
  superadmin: "super_admin",
  owner: "owner",
  school_owner: "owner",
  schoolowner: "owner",
  admin: "admin",
  school_admin: "admin",
  schooladmin: "admin",
  administrator: "admin",
  teacher: "teacher",
  faculty: "teacher",
  accountant: "accountant",
  accounts: "accountant",
  account: "accountant",
  staff: "staff",
  employee: "staff",
  member: "member",
  student: "member",
  parent: "member",
};

/**
 * Roles come from the database (a school membership), never from request
 * input. Unknown legacy role names are mapped to the least-privileged role.
 */
export function normalizeRole(role: string | null | undefined): SchoolRole {
  const key = String(role ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return ROLE_ALIASES[key] ?? "member";
}

export type PermissionRequest = {
  [resource: string]: string[] | { actions: string[]; connector?: "AND" | "OR" } | undefined;
};

/**
 * Parses string permission keys into formal PermissionRequest statements.
 * Examples:
 *   "student.create" -> { student: ["create"] }
 *   "attendance.read" -> { attendance: ["read"] }
 *   "fees.delete" -> { fees: ["delete"] }
 *   "reports.read" -> { report: ["read"] }
 *   "settings.update" -> { setting: ["update"] }
 *   "staff.manage" -> { staff: ["manage"] }
 * Also supports legacy group identifiers like "stu", "fees", "att", "sys".
 */
export function parsePermissionKey(permission: string): PermissionRequest {
  const trimmed = permission.trim().toLowerCase();

  // Legacy module group mapping
  if (trimmed === "stu") return { student: ["read"] };
  if (trimmed === "fees") return { fees: ["read"] };
  if (trimmed === "att") return { attendance: ["read"] };
  if (trimmed === "exam") return { exam: ["read"] };
  if (trimmed === "rep") return { report: ["read"] };
  if (trimmed === "exp") return { expense: ["read"] };
  if (trimmed === "hw") return { homework: ["read"] };
  if (trimmed === "lib") return { library: ["read"] };
  if (trimmed === "trans") return { transport: ["read"] };
  if (trimmed === "comm") return { communication: ["read"] };
  if (trimmed === "sys") return { system: ["read"] };
  if (trimmed === "front") return { student: ["read"] };
  if (trimmed === "acad") return { student: ["read"] };
  if (trimmed === "lesson") return { homework: ["read"] };
  if (trimmed === "cert") return { student: ["read"] };
  if (trimmed === "inv") return { library: ["read"] };
  if (trimmed === "hostel") return { student: ["read"] };
  if (trimmed === "online") return { exam: ["read"] };
  if (trimmed === "dl") return { report: ["read"] };
  if (trimmed === "set" || trimmed === "settings") return { setting: ["read"] };

  const [rawResource, rawAction] = trimmed.split(/[.:]/);
  const resource =
    rawResource === "reports" ? "report"
    : rawResource === "settings" ? "setting"
    : rawResource === "students" ? "student"
    : rawResource === "teachers" ? "teacher"
    : rawResource === "expenses" ? "expense"
    : rawResource;

  const action = rawAction ?? "read";
  return { [resource]: [action] };
}

/**
 * Checks whether a role satisfies the given permission request or string key.
 */
export function roleHasPermission(
  role: string | null | undefined,
  request: string | PermissionRequest,
): boolean {
  const normalized = normalizeRole(role);
  if (normalized === "super_admin" || normalized === "owner") return true;

  const permRequest = typeof request === "string" ? parsePermissionKey(request) : request;
  const definition = roles[normalized];
  if (!definition) return false;
  return definition.authorize(permRequest as never).success;
}

/**
 * Helper to check permissions on any role or user object.
 */
export function hasPermission(
  roleOrUser: string | { role?: string | null } | null | undefined,
  permission: string | PermissionRequest,
): boolean {
  if (!roleOrUser) return false;
  const role = typeof roleOrUser === "string" ? roleOrUser : roleOrUser.role;
  return roleHasPermission(role, permission);
}

/**
 * Legacy navigation groups exposed to the current UI. These are a display
 * convenience only; every API must still enforce `requirePermission`.
 */
export function uiPermissionsForRole(role: string | null | undefined): string[] | "all" {
  switch (normalizeRole(role)) {
    case "super_admin":
    case "owner":
    case "admin":
      return "all";
    case "teacher":
      return ["stu", "att", "exam", "online", "lesson", "acad", "hw", "dl", "lib", "rep", "cert", "comm"];
    case "accountant":
      return ["stu", "fees", "exp", "trans", "rep", "comm"];
    case "staff":
      return ["front", "stu", "att", "hw", "dl", "lib", "inv", "trans", "hostel", "cert", "rep", "comm"];
    default:
      return ["stu", "rep"];
  }
}
