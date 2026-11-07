import { route } from "@/lib/http";
import { getSessionUser, rolePermissions } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getBetterAuthIdentity } from "@/lib/session";
import { resolveSchoolContext } from "@/lib/tenant";
import { uiPermissionsForRole } from "@/lib/permissions";
import { ApiError } from "@/lib/errors";

export const GET = route(async () => {
  const user = await getSessionUser();
  if (!user) return { user: null };

  if (user.source === "better-auth") {
    const identity = await getBetterAuthIdentity();
    const settings = await getSettings().catch(() => null);
    let school: Record<string, unknown> | null = null;
    let contextError: { message: string; code?: string; details?: unknown } | null = null;

    try {
      const context = await resolveSchoolContext();
      if (context) {
        school = {
          id: context.school.id,
          name: context.school.name,
          slug: context.school.slug,
          status: context.school.status,
          subscriptionPlan: context.school.subscriptionPlan,
          role: context.role,
          session: settings?.session ?? null,
        };
      }
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      contextError = {
        message: error.message,
        code:
          typeof error.details === "object" && error.details && "code" in error.details
            ? String((error.details as { code?: unknown }).code)
            : undefined,
        details: error.details,
      };
    }

    return {
      user,
      perms: uiPermissionsForRole(user.role),
      school,
      auth: {
        source: "better-auth",
        emailVerified: identity?.user.emailVerified ?? false,
        activeOrganizationId: identity?.session.activeOrganizationId ?? null,
        memberships:
          identity?.memberships.map((membership) => ({
            id: membership.school.id,
            name: membership.school.name,
            slug: membership.school.slug,
            role: membership.role,
            status: membership.status,
            schoolStatus: membership.school.status,
            subscriptionPlan: membership.school.subscriptionPlan,
          })) ?? [],
      },
      contextError,
    };
  }

  const [perms, settings] = await Promise.all([rolePermissions(user.role), getSettings()]);
  return {
    user,
    perms,
    school: { name: settings.name, session: settings.session, address: settings.address },
  };
});
