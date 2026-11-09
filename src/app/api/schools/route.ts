import { readJson, route } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { onboardSchool, type SchoolOnboardingInput } from "@/lib/onboarding";

export const GET = route(async () => {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Please sign in to view your schools.");

  const normalized = user.role.toLowerCase().replace(/[\s-]+/g, "_");
  const isSuperAdmin = normalized === "super_admin" || user.role === "Admin";

  if (isSuperAdmin) {
    const schools = await prisma.school.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        status: true,
        subscriptionPlan: true,
        createdAt: true,
      },
    });
    return { schools };
  }

  const memberships = await prisma.member.findMany({
    where: { userId: user.uid },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          phone: true,
          status: true,
          subscriptionPlan: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    schools: memberships.map((m) => ({
      ...m.school,
      role: m.role,
      membershipStatus: m.status,
    })),
  };
});

export const POST = route(async (req) => {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Please sign in to register a school.");

  const body = (await readJson(req)) as SchoolOnboardingInput;
  const result = await onboardSchool(body, { currentUser: user });
  return result;
});
