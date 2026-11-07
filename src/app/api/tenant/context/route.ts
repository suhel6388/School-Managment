import { route } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import { getBetterAuthIdentity } from "@/lib/session";
import { resolveSchoolContext } from "@/lib/tenant";
import { ApiError } from "@/lib/errors";

export const GET = route(async () => {
  const user = await getSessionUser();
  if (!user) return { user: null, context: null, memberships: [] };

  const identity = await getBetterAuthIdentity();
  const memberships =
    identity?.memberships.map((membership) => ({
      id: membership.school.id,
      name: membership.school.name,
      slug: membership.school.slug,
      role: membership.role,
      status: membership.status,
      schoolStatus: membership.school.status,
      subscriptionPlan: membership.school.subscriptionPlan,
    })) ?? [];

  try {
    const context = await resolveSchoolContext();
    return { user, context, memberships };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return {
      user,
      context: null,
      memberships,
      error: {
        message: error.message,
        details: error.details,
      },
    };
  }
});
