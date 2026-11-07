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
 * membership. Phase 4 builds on the same statements, so every API can call
 * `requirePermission()` instead of hand-rolling role checks.
 */
export const statement = {
  ...defaultStatements,
  school: ["read", "update", "manage"],
  student: ["create", "read", "update", "delete", "manage"],
  teacher: ["create", "read", "update", "delete", "manage"],
  staff: ["create", "read", "update", "delete", "manage"],
  attendance: ["create", "read", "update", "delete"],
  fees: ["create", "read", "update", "delete", "manage"],
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
  owner: ac.newRole(ALL),
  admin: ac.newRole({
    ...ALL,
    // Organization settings are owned by the school owner.
    organization: ["update"],
  }),
  teacher: ac.newRole({
    organization: [],
    school: ["read"],
    student: ["read"],
    teacher: ["read"],
    staff: [],
    attendance: ["create", "read", "update"],
    fees: [],
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
  accountant: ac.newRole({
    organization: [],
    school: ["read"],
    student: ["read"],
    teacher: [],
    staff: [],
    attendance: [],
    fees: ["create", "read", "update", "delete", "manage"],
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
  staff: ac.newRole({
    organization: [],
    school: ["read"],
    student: ["create", "read", "update"],
    teacher: [],
    staff: [],
    attendance: ["create", "read", "update"],
    fees: [],
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
  member: ac.newRole({
    organization: [],
    school: ["read"],
    student: ["read"],
    teacher: ["read"],
    staff: [],
    attendance: ["read"],
    fees: [],
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
  owner: "owner",
  school_owner: "owner",
  schoolowner: "owner",
  super_admin: "owner",
  superadmin: "owner",
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

export function roleHasPermission(
  role: string | null | undefined,
  request: PermissionRequest,
): boolean {
  const definition = roles[normalizeRole(role)];
  return definition.authorize(request as never).success;
}

/**
 * Legacy navigation groups exposed to the current UI. These are a display
 * convenience only; every API must still enforce `requirePermission`.
 */
export function uiPermissionsForRole(role: string | null | undefined): string[] | "all" {
  switch (normalizeRole(role)) {
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
