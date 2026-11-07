import { ApiError } from "./errors";
import { getSessionUser, type SessionUser } from "./auth";
import { requireSchoolContext, type SchoolContext } from "./tenant";
import {
  normalizeRole,
  roleHasPermission,
  hasPermission as checkPermission,
  type PermissionRequest,
  type SchoolRole,
} from "./permissions";

export type { SchoolRole, PermissionRequest };

/**
 * 1. authenticateUser
 *
 * Central middleware to validate the user session. Supports both Better Auth
 * sessions and legacy signed cookies.
 * Throws 401 Unauthorized if the user is not authenticated.
 */
export async function authenticateUser(req?: Request): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new ApiError(401, "Please sign in to continue.", { code: "UNAUTHORIZED" });
  }
  return user;
}

/**
 * 2. requireSuperAdmin
 *
 * Central middleware to ensure the user possesses platform-wide super administrator
 * privileges. Validates credentials from server-side trusted state only; never
 * trusts client-supplied role values.
 *
 * Permissions:
 * - Manage all schools
 * - Manage subscriptions
 * - Manage school owners
 * - Access platform-wide analytics
 * - Suspend and activate schools
 */
export async function requireSuperAdmin(req?: Request): Promise<SessionUser> {
  const user = await authenticateUser(req);
  const normalized = normalizeRole(user.role);
  if (normalized !== "super_admin" && user.role !== "Admin") {
    throw new ApiError(403, "Access restricted to platform super administrators.", {
      code: "FORBIDDEN_SUPER_ADMIN",
    });
  }
  return user;
}

/**
 * 3. requireSchoolMembership
 *
 * Central middleware to identify and validate the active school membership.
 *
 * Requirements:
 * - Validates membership server-side; never trusts schoolId from request bodies,
 *   query parameters, or headers.
 * - Ensures both the school and membership status are active.
 * - Handles multi-school selection resolution cleanly.
 */
export async function requireSchoolMembership(req?: Request): Promise<SchoolContext> {
  return requireSchoolContext();
}

/**
 * 4. requireRole
 *
 * Central middleware to validate that the user's active membership matches
 * one of the required organization roles.
 *
 * Supported initial roles:
 * - SUPER_ADMIN
 * - SCHOOL_OWNER
 * - SCHOOL_ADMIN
 * - STAFF
 * - TEACHER
 * - ACCOUNTANT
 */
export async function requireRole(
  allowedRoles: SchoolRole | SchoolRole[] | string | string[],
  req?: Request,
): Promise<SchoolContext> {
  const context = await requireSchoolMembership(req);
  const allowedList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const normalizedAllowed = new Set(allowedList.map((r) => normalizeRole(r)));

  // Super admin and school owner have platform/tenant oversight
  if (context.role === "super_admin" || context.role === "owner") {
    return context;
  }

  if (!normalizedAllowed.has(context.role)) {
    throw new ApiError(403, "Your school role does not allow this action.", {
      code: "ROLE_UNAUTHORIZED",
      role: context.role,
      allowed: allowedList,
    });
  }
  return context;
}

/**
 * 5. requirePermission
 *
 * Central middleware to validate fine-grained permission keys within the active
 * school context.
 *
 * Security rule:
 * - Never checks permissions solely based on role name.
 * - Validates against granular permission keys (e.g. "student.create",
 *   "student.read", "student.update", "student.delete", "teacher.create",
 *   "attendance.create", "fees.create", "reports.read", "settings.update",
 *   "staff.manage", etc.).
 */
export async function requirePermission(
  permission: string | PermissionRequest,
  req?: Request,
): Promise<SchoolContext> {
  const context = await requireSchoolMembership(req);
  if (!roleHasPermission(context.role, permission)) {
    const permString = typeof permission === "string" ? permission : JSON.stringify(permission);
    throw new ApiError(403, "Your school role does not allow this action.", {
      code: "PERMISSION_DENIED",
      required: permString,
      role: context.role,
    });
  }
  return context;
}

/**
 * Helper to test permissions against a user, context, or role without throwing.
 */
export function hasPermission(
  userOrRole: string | SessionUser | SchoolContext | null | undefined,
  permission: string | PermissionRequest,
): boolean {
  return checkPermission(userOrRole, permission);
}

export {
  withTenant,
  withSchoolContext,
  getTenantContext,
  requireTenantContext,
  runWithTenantContext,
  tenantDb,
  assertSameSchool,
  validateSameSchool,
  type TenantRequestContext,
  type AuthenticatedSchoolRequest,
  type TenantRouteHandler,
} from "./tenant";

