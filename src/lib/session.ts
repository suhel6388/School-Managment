import { headers } from "next/headers";
import { auth } from "./auth-server";
import { prisma } from "./prisma";
import { normalizeRole, type SchoolRole } from "./permissions";

export type BetterAuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
};

export type BetterAuthSchool = {
  id: string;
  name: string;
  slug: string;
  status: string;
  subscriptionPlan: string;
};

export type BetterAuthMembership = {
  id: string;
  schoolId: string;
  userId: string;
  role: string;
  status: string;
  school: BetterAuthSchool;
};

export type BetterAuthIdentity = {
  source: "better-auth";
  user: BetterAuthUser;
  session: {
    id: string;
    token: string;
    activeOrganizationId?: string | null;
    expiresAt: Date;
  };
  /**
   * Every membership, including inactive/suspended ones. Tenant authorization
   * filters this server-side; the client never supplies a school id.
   */
  memberships: BetterAuthMembership[];
  activeRole: SchoolRole;
};

/**
 * Reads the Better Auth session from the request cookies and loads the user's
 * school memberships. Returns null when there is no valid Better Auth session.
 */
export async function getBetterAuthIdentity(): Promise<BetterAuthIdentity | null> {
  let result: Awaited<ReturnType<typeof auth.api.getSession>>;
  try {
    result = await auth.api.getSession({ headers: await headers() });
  } catch (error) {
    console.error("[auth] Failed to read Better Auth session:", error);
    return null;
  }
  if (!result?.user || !result.session) return null;

  const memberships = await prisma.member.findMany({
    where: { userId: result.user.id },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          subscriptionPlan: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const active = memberships.filter(
    (membership) => membership.status === "active" && membership.school.status === "active",
  );
  const requested = result.session.activeOrganizationId ?? null;
  const selected =
    (requested ? active.find((membership) => membership.schoolId === requested) : null) ??
    (active.length === 1 ? active[0] : null);

  return {
    source: "better-auth",
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      emailVerified: Boolean(result.user.emailVerified),
      image: result.user.image ?? null,
    },
    session: {
      id: result.session.id,
      token: result.session.token,
      activeOrganizationId: requested,
      expiresAt: result.session.expiresAt,
    },
    memberships: memberships.map((membership) => ({
      id: membership.id,
      schoolId: membership.schoolId,
      userId: membership.userId,
      role: membership.role,
      status: membership.status,
      school: membership.school,
    })),
    activeRole: normalizeRole(selected?.role),
  };
}
