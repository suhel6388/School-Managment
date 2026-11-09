import { AsyncLocalStorage } from "node:async_hooks";
import { NextResponse } from "next/server";
import { ApiError } from "./errors";
import { getSessionUser } from "./auth";
import { getBetterAuthIdentity } from "./session";
import { prisma } from "./prisma";
import { modelMeta } from "./dmmf";
import {
  normalizeRole,
  roleHasPermission,
  type PermissionRequest,
  type SchoolRole,
} from "./permissions";

export type SchoolSummary = {
  id: string;
  name: string;
  slug: string;
  status: string;
  subscriptionPlan: string;
};

export type SchoolContext = {
  source: "legacy" | "better-auth";
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
  };
  school: SchoolSummary;
  role: SchoolRole;
  membershipId: string | null;
  /** Organization id explicitly selected in the Better Auth session, if any. */
  requestedSchoolId: string | null;
};

export type TenantRequestContext = {
  user: SchoolContext["user"];
  school: {
    id: string;
    role: SchoolRole;
    name: string;
    slug: string;
    status: string;
  };
  context: SchoolContext;
};

export type AuthenticatedSchoolRequest = Request & {
  user?: TenantRequestContext["user"];
  school?: TenantRequestContext["school"];
  tenantContext?: SchoolContext;
};

export type TenantRouteHandler<C = unknown> = (
  req: AuthenticatedSchoolRequest,
  ctx: C,
  tenant: TenantRequestContext,
) => Promise<Response | unknown>;

/** Node.js AsyncLocalStorage store for tenant context across asynchronous boundaries. */
const tenantStorage = new AsyncLocalStorage<SchoolContext>();

/**
 * Runs an asynchronous function within the specified school tenant context.
 */
export function runWithTenantContext<T>(
  context: SchoolContext,
  fn: () => Promise<T> | T,
): Promise<T> {
  return tenantStorage.run(context, fn as () => Promise<T>);
}

/**
 * Retrieves the currently active school tenant context from AsyncLocalStorage.
 */
export function getTenantContext(): SchoolContext | null {
  return tenantStorage.getStore() ?? null;
}

/**
 * Requires an active school tenant context in the current execution scope,
 * throwing 500/403 if uninitialized.
 */
export function requireTenantContext(): SchoolContext {
  const ctx = getTenantContext();
  if (!ctx) {
    throw new ApiError(500, "Tenant context has not been initialized for this operation.", {
      code: "NO_TENANT_CONTEXT",
    });
  }
  return ctx;
}

/**
 * Returns the authorized school ID from the active AsyncLocalStorage tenant context.
 */
export function getAuthorizedSchoolId(): string | null {
  const ctx = getTenantContext();
  return ctx?.school?.id ?? null;
}

/**
 * Requires an authorized school ID from the active AsyncLocalStorage context.
 */
export function requireAuthorizedSchoolId(): string {
  const id = getAuthorizedSchoolId();
  if (!id) {
    throw new ApiError(403, "Active school authorization required.", {
      code: "NO_ACTIVE_SCHOOL",
    });
  }
  return id;
}

function resolveActiveSchoolId(schoolOrCtx?: string | SchoolContext): string | null {
  if (typeof schoolOrCtx === "string") return schoolOrCtx;
  if (schoolOrCtx && typeof schoolOrCtx === "object" && schoolOrCtx.school) {
    return schoolOrCtx.school.id;
  }
  return getAuthorizedSchoolId();
}

/**
 * Complete catalog of models intended to be tenant-scoped by schoolId.
 */
export const TENANT_SCOPED_MODELS = new Set([
  "Setting",
  "AcademicSession",
  "SchoolClass",
  "Section",
  "ClassSection",
  "Subject",
  "SubjectGroup",
  "SubjectGroupSection",
  "SubjectGroupSubject",
  "StudentCategory",
  "StudentHouse",
  "DisableReason",
  "Student",
  "Counter",
  "FeeGroup",
  "FeeType",
  "FeeDiscount",
  "FeeMaster",
  "Payment",
  "CarryForward",
  "BankPayment",
  "FeeReminder",
  "Department",
  "Designation",
  "LeaveType",
  "Staff",
  "StaffLeave",
  "StaffRating",
  "Payroll",
  "StaffAttendance",
  "StudentAttendance",
  "StudentLeave",
  "FrontOfficeSetup",
  "Enquiry",
  "Visitor",
  "PhoneCall",
  "PostalDispatch",
  "PostalReceive",
  "Complaint",
  "OnlineAdmission",
  "MultiClass",
  "ExpenseHead",
  "Expense",
  "ExamGroup",
  "ExamSchedule",
  "ExamResult",
  "Grade",
  "Division",
  "AdmitTemplate",
  "MarkTemplate",
  "OnlineExam",
  "Question",
  "OnlineExamResult",
  "Lesson",
  "Topic",
  "LessonPlan",
  "Notice",
  "EmailTemplate",
  "SmsTemplate",
  "ScheduledMessage",
  "MessageLog",
  "ContentType",
  "Content",
  "Homework",
  "HomeworkSubmission",
  "SchoolEvent",
  "Book",
  "LibraryMember",
  "BookIssue",
  "ItemCategory",
  "ItemStore",
  "ItemSupplier",
  "Item",
  "ItemStock",
  "ItemIssue",
  "TransportRoute",
  "Vehicle",
  "PickupPoint",
  "RoutePickup",
  "VehicleAssignment",
  "AssignmentVehicle",
  "TransportFee",
  "TransportAssignment",
  "Hostel",
  "RoomType",
  "Room",
  "HostelAllocation",
  "CertificateTemplate",
  "IdCardTemplate",
  "Alumni",
  "AlumniEvent",
  "CustomField",
  "Language",
  "Role",
  "AppUser",
  "AuditLog",
  "UserLog",
  "Member",
  "Invitation",
  "Verification",
]);

/**
 * Checks whether a given model is part of the multi-tenant architecture.
 */
export function isTenantScopedModel(modelName: string): boolean {
  const normalized = modelName.charAt(0).toUpperCase() + modelName.slice(1);
  return TENANT_SCOPED_MODELS.has(normalized);
}

/**
 * Checks if the model currently defines a schoolId field in the active schema.
 */
export function modelHasSchoolId(modelName: string): boolean {
  if (isTenantScopedModel(modelName)) return true;
  try {
    const meta = modelMeta(modelName);
    return meta.fields.some((f) => f.name === "schoolId");
  } catch {
    return false;
  }
}

/**
 * Appends schoolId filter to a query where clause if the model has a schoolId column.
 */
export function withTenantFilter<T extends Record<string, unknown>>(
  where: T,
  schoolId: string,
  modelName?: string,
): T & { schoolId?: string } {
  if (!schoolId) return where;
  if (modelName && !modelHasSchoolId(modelName)) {
    return where;
  }
  return {
    ...where,
    schoolId,
  };
}

function toContext(
  identity: NonNullable<Awaited<ReturnType<typeof getBetterAuthIdentity>>>,
  membership: (typeof identity.memberships)[number],
): SchoolContext {
  return {
    source: "better-auth",
    user: {
      id: identity.user.id,
      name: identity.user.name,
      email: identity.user.email,
      username: identity.user.email,
    },
    school: membership.school,
    role: normalizeRole(membership.role),
    membershipId: membership.id,
    requestedSchoolId: identity.session.activeOrganizationId ?? null,
  };
}

async function legacyContext(
  user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>,
): Promise<SchoolContext | null> {
  const school = await prisma.school.findFirst({
    where: { status: "active" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      subscriptionPlan: true,
    },
  });
  if (!school) return null;

  return {
    source: "legacy",
    user: {
      id: user.uid,
      name: user.name,
      email: user.email ?? "",
      username: user.username,
    },
    school,
    role: normalizeRole(user.role),
    membershipId: null,
    requestedSchoolId: null,
  };
}

/**
 * Resolves the authorized school context from trusted server-side state only.
 *
 * - Better Auth users are validated against their active membership rows.
 *   A school id supplied in a request body, query string or header is never
 *   read here.
 * - Legacy signed-cookie users keep working; they are mapped to the default
 *   active school until the Phase 10 data migration creates memberships.
 */
export async function resolveSchoolContext(): Promise<SchoolContext | null> {
  const existing = getTenantContext();
  if (existing) return existing;

  const identity = await getBetterAuthIdentity();

  if (identity) {
    const requested = identity.session.activeOrganizationId ?? null;

    if (requested) {
      const membership = identity.memberships.find((item) => item.schoolId === requested);
      if (!membership) {
        throw new ApiError(403, "You do not have access to the selected school.", {
          code: "SCHOOL_ACCESS_DENIED",
        });
      }
      if (membership.status !== "active" || membership.school.status !== "active") {
        throw new ApiError(403, "Your access to this school is inactive or suspended.", {
          code: "SCHOOL_INACTIVE",
        });
      }
      return toContext(identity, membership);
    }

    const active = identity.memberships.filter(
      (membership) => membership.status === "active" && membership.school.status === "active",
    );

    if (active.length === 0) {
      throw new ApiError(403, "You do not have an active school membership.", {
        code: "NO_ACTIVE_SCHOOL",
      });
    }

    if (active.length > 1) {
      throw new ApiError(409, "Select a school to continue.", {
        code: "SCHOOL_SELECTION_REQUIRED",
        schools: active.map((membership) => ({
          id: membership.school.id,
          name: membership.school.name,
          slug: membership.school.slug,
          role: normalizeRole(membership.role),
        })),
      });
    }

    return toContext(identity, active[0]);
  }

  const user = await getSessionUser();
  if (!user) return null;
  return legacyContext(user);
}

/** Requires an authenticated user with a validated school membership. */
export async function requireSchoolContext(): Promise<SchoolContext> {
  const context = await resolveSchoolContext();
  if (context) return context;

  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Please sign in to continue.");

  throw new ApiError(403, "This account has no school membership yet.", {
    code: "SCHOOL_MEMBERSHIP_REQUIRED",
  });
}

/** Requires the current membership role to grant every requested action. */
export async function requireSchoolPermission(
  request: PermissionRequest | string,
): Promise<SchoolContext> {
  const context = await requireSchoolContext();
  if (!roleHasPermission(context.role, request)) {
    throw new ApiError(403, "Your school role does not allow this action.", {
      code: "PERMISSION_DENIED",
      required: request,
    });
  }
  return context;
}

export { isSuperAdmin, assertTeacherClassAccess } from "./rbac";

/**
 * Guards a record id that belongs to a school. The caller passes the id of the
 * record it is about to read/write; it must match the server-resolved school.
 * Rejects cross-school access by throwing 404.
 */
export function assertSameSchool(
  contextOrSchoolId: SchoolContext | string,
  recordSchoolId: string | null | undefined,
): void {
  const authorizedId =
    typeof contextOrSchoolId === "string"
      ? contextOrSchoolId
      : contextOrSchoolId.school.id;

  if (recordSchoolId && authorizedId !== recordSchoolId) {
    throw new ApiError(404, "Record not found.");
  }
}

/**
 * Validates that related entities belong to the same authorized school.
 * Prevents cross-school record references (e.g., student linked to another school's class).
 */
export async function validateSameSchool(
  schoolId: string,
  checks: Array<{ model: string; id: string | null | undefined }>,
  tx: any = prisma,
): Promise<void> {
  if (!schoolId) return;

  for (const check of checks) {
    if (!check.id) continue;
    const modelKey = check.model.charAt(0).toLowerCase() + check.model.slice(1);
    const delegate = tx[modelKey];
    if (!delegate || typeof delegate.findUnique !== "function") continue;

    const row = await delegate.findUnique({
      where: { id: check.id },
    });

    if (!row) {
      throw new ApiError(404, `Referenced ${check.model} not found: ${check.id}`);
    }

    if (row.schoolId && row.schoolId !== schoolId) {
      throw new ApiError(403, `Cross-school reference forbidden: ${check.model} belongs to another school.`, {
        code: "CROSS_TENANT_REFERENCE_DENIED",
      });
    }
  }
}

/**
 * Centralized Tenant Middleware Wrapper:
 * 1. Verifies Better Auth session / trusted user session.
 * 2. Identifies authenticated user.
 * 3. Identifies active school membership.
 * 4. Verifies membership is active.
 * 5. Resolves authorized schoolId strictly from server-side data.
 * 6. Attaches conceptual request context (req.user and req.school = { id, role }).
 * 7. Rejects unauthorized access.
 */
export function withTenant<C = unknown>(handler: TenantRouteHandler<C>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      const schoolContext = await requireSchoolContext();

      const tenant: TenantRequestContext = {
        user: schoolContext.user,
        school: {
          id: schoolContext.school.id,
          role: schoolContext.role,
          name: schoolContext.school.name,
          slug: schoolContext.school.slug,
          status: schoolContext.school.status,
        },
        context: schoolContext,
      };

      const enrichedReq = req as AuthenticatedSchoolRequest;
      enrichedReq.user = tenant.user;
      enrichedReq.school = tenant.school;
      enrichedReq.tenantContext = schoolContext;

      return await runWithTenantContext(schoolContext, async () => {
        const result = await handler(enrichedReq, ctx, tenant);
        if (result instanceof Response) return result;
        return NextResponse.json(result ?? { ok: true });
      });
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message, details: error.details ?? undefined },
          { status: error.status },
        );
      }
      throw error;
    }
  };
}

/**
 * Executes a background task with explicit school tenant context.
 * Resolves the school strictly from server-side data, verifies it is active,
 * and attaches an authorized system context.
 */
export async function withSchoolContext<T>(
  schoolId: string,
  fn: (context: SchoolContext) => Promise<T>,
): Promise<T> {
  if (!schoolId) {
    throw new ApiError(400, "schoolId is required for background execution.");
  }

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      subscriptionPlan: true,
    },
  });

  if (!school) {
    throw new ApiError(404, `School not found: ${schoolId}`);
  }

  if (school.status !== "active") {
    throw new ApiError(403, `School is not active: ${schoolId}`, {
      code: "SCHOOL_INACTIVE",
    });
  }

  const context: SchoolContext = {
    source: "better-auth",
    user: {
      id: "system-job",
      name: "Background Worker",
      email: "system@school.internal",
      username: "system",
    },
    school,
    role: "super_admin",
    membershipId: null,
    requestedSchoolId: school.id,
  };

  return runWithTenantContext(context, () => fn(context));
}

/**
 * Creates a scoped Prisma client proxy that automatically scopes all queries
 * to the authorized schoolId.
 */
export function createTenantPrisma(targetSchoolId?: string | SchoolContext) {
  return new Proxy(prisma as any, {
    get(target, prop, receiver) {
      const orig = Reflect.get(target, prop, receiver);
      if (typeof prop !== "string") return orig;
      if (!orig || typeof orig !== "object") return orig;

      const modelKey = prop;
      const modelName = modelKey.charAt(0).toUpperCase() + modelKey.slice(1);
      const hasSchoolCol = modelHasSchoolId(modelName);

      return new Proxy(orig, {
        get(mTarget, mProp, mReceiver) {
          const mOrig = Reflect.get(mTarget, mProp, mReceiver);
          if (typeof mOrig !== "function") return mOrig;

          if (mProp === "findMany" || mProp === "findFirst" || mProp === "count") {
            return async (args: any = {}) => {
              const activeSchoolId = resolveActiveSchoolId(targetSchoolId);
              if (activeSchoolId && hasSchoolCol) {
                args = {
                  ...args,
                  where: {
                    ...(args.where || {}),
                    schoolId: activeSchoolId,
                  },
                };
              }
              return mOrig.call(mTarget, args);
            };
          }

          if (mProp === "create") {
            return async (args: any = {}) => {
              const activeSchoolId = resolveActiveSchoolId(targetSchoolId);
              if (activeSchoolId && hasSchoolCol) {
                args = {
                  ...args,
                  data: {
                    ...(args.data || {}),
                    schoolId: activeSchoolId,
                  },
                };
              }
              return mOrig.call(mTarget, args);
            };
          }

          if (mProp === "createMany") {
            return async (args: any = {}) => {
              const activeSchoolId = resolveActiveSchoolId(targetSchoolId);
              if (activeSchoolId && hasSchoolCol && args.data) {
                const data = Array.isArray(args.data)
                  ? args.data.map((item: any) => ({ ...item, schoolId: activeSchoolId }))
                  : { ...args.data, schoolId: activeSchoolId };
                args = { ...args, data };
              }
              return mOrig.call(mTarget, args);
            };
          }

          if (mProp === "updateMany" || mProp === "deleteMany") {
            return async (args: any = {}) => {
              const activeSchoolId = resolveActiveSchoolId(targetSchoolId);
              if (activeSchoolId && hasSchoolCol) {
                args = {
                  ...args,
                  where: {
                    ...(args.where || {}),
                    schoolId: activeSchoolId,
                  },
                };
              }
              return mOrig.call(mTarget, args);
            };
          }

          if (mProp === "findUnique") {
            return async (args: any = {}) => {
              const row = await mOrig.call(mTarget, args);
              if (!row) return null;
              const activeSchoolId = resolveActiveSchoolId(targetSchoolId);
              if (activeSchoolId && "schoolId" in row && row.schoolId && row.schoolId !== activeSchoolId) {
                return null;
              }
              return row;
            };
          }

          if (mProp === "update") {
            return async (args: any = {}) => {
              const activeSchoolId = resolveActiveSchoolId(targetSchoolId);
              if (activeSchoolId && args?.where) {
                const existing = await mTarget.findUnique({ where: args.where });
                if (!existing) throw new ApiError(404, "Record not found.");
                if ("schoolId" in existing && existing.schoolId && existing.schoolId !== activeSchoolId) {
                  throw new ApiError(404, "Record not found.");
                }
              }
              const data = { ...(args.data || {}) };
              delete data.schoolId; // Never overwrite schoolId on update
              return mOrig.call(mTarget, { ...args, data });
            };
          }

          if (mProp === "delete") {
            return async (args: any = {}) => {
              const activeSchoolId = resolveActiveSchoolId(targetSchoolId);
              if (activeSchoolId && args?.where) {
                const existing = await mTarget.findUnique({ where: args.where });
                if (!existing) throw new ApiError(404, "Record not found.");
                if ("schoolId" in existing && existing.schoolId && existing.schoolId !== activeSchoolId) {
                  throw new ApiError(404, "Record not found.");
                }
              }
              return mOrig.call(mTarget, args);
            };
          }

          return mOrig.bind(mTarget);
        },
      });
    },
  });
}

/**
 * Returns a tenant-scoped database client.
 */
export function tenantDb(targetSchoolId?: string | SchoolContext) {
  return createTenantPrisma(targetSchoolId);
}
