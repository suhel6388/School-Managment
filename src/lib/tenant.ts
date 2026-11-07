import { ApiError } from "./errors";
import { getSessionUser } from "./auth";
import { getBetterAuthIdentity } from "./session";
import { prisma } from "./prisma";
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
  // Before Phase 10 data migration there may be no school row yet. Returning
  // null keeps the legacy UI working while making tenant-scoped endpoints
  // refuse access instead of guessing a school.
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

/**
 * Guards a record id that belongs to a school. The caller passes the id of the
 * record it is about to read/write; it must match the server-resolved school.
 */
export function assertSameSchool(context: SchoolContext, schoolId: string): void {
  if (context.school.id !== schoolId) {
    throw new ApiError(404, "Record not found.");
  }
}
