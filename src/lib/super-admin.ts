import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { onboardSchool, type SchoolOnboardingInput } from "./onboarding";
import { normalizeRole } from "./permissions";
import type { SessionUser } from "./auth";

export type PlatformOverviewData = {
  kpis: {
    totalSchools: number;
    activeSchools: number;
    suspendedSchools: number;
    totalUsers: number;
    totalStudents: number;
    totalStaff: number;
  };
  subscriptions: {
    free: number;
    starter: number;
    pro: number;
    enterprise: number;
  };
  recentSchools: Array<{
    id: string;
    name: string;
    slug: string;
    email: string | null;
    status: string;
    subscriptionPlan: string;
    createdAt: Date;
    ownerName?: string | null;
    ownerEmail?: string | null;
    studentCount?: number;
  }>;
  registrationAnalytics: Array<{
    month: string;
    count: number;
  }>;
};

export type SchoolFilterOptions = {
  status?: string;
  plan?: string;
  search?: string;
  page?: number;
  limit?: number;
};

/**
 * Returns platform-level overview metrics, KPI cards, subscription distribution,
 * and school registration trends. Restricted exclusively to SUPER_ADMIN.
 */
export async function getPlatformOverview(db: any = prisma): Promise<PlatformOverviewData> {
  const [
    totalSchools,
    activeSchools,
    suspendedSchools,
    totalUsers,
    totalStudents,
    totalStaff,
    schools,
  ] = await Promise.all([
    db.school.count(),
    db.school.count({ where: { status: "active" } }),
    db.school.count({ where: { status: { in: ["suspended", "inactive"] } } }),
    db.user.count(),
    db.student.count(),
    db.staff.count(),
    db.school.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        members: {
          where: { role: "owner" },
          include: { user: { select: { name: true, email: true } } },
          take: 1,
        },
      },
    }),
  ]);

  // Subscription plan breakdown
  const subscriptions = { free: 0, starter: 0, pro: 0, enterprise: 0 };
  for (const s of schools) {
    const plan = (s.subscriptionPlan || "free").toLowerCase() as keyof typeof subscriptions;
    if (plan in subscriptions) {
      subscriptions[plan] += 1;
    } else {
      subscriptions.free += 1;
    }
  }

  // Registration analytics (month-by-month for past 6 months)
  const monthMap = new Map<string, number>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, 0);
  }

  for (const s of schools) {
    const created = new Date(s.createdAt);
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
    if (monthMap.has(key)) {
      monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
    }
  }

  const registrationAnalytics = Array.from(monthMap.entries()).map(([month, count]) => ({
    month,
    count,
  }));

  const recentSchools = schools.slice(0, 10).map((s: any) => {
    const ownerMember = s.members?.[0];
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      email: s.email,
      status: s.status,
      subscriptionPlan: s.subscriptionPlan,
      createdAt: s.createdAt,
      ownerName: ownerMember?.user?.name ?? null,
      ownerEmail: ownerMember?.user?.email ?? null,
    };
  });

  return {
    kpis: {
      totalSchools,
      activeSchools,
      suspendedSchools,
      totalUsers,
      totalStudents,
      totalStaff,
    },
    subscriptions,
    recentSchools,
    registrationAnalytics,
  };
}

/**
 * Lists all schools on the platform with filtering, pagination, and owner data.
 */
export async function listPlatformSchools(
  options: SchoolFilterOptions = {},
  db: any = prisma,
) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 25));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (options.status && options.status !== "all") {
    where.status = options.status;
  }
  if (options.plan && options.plan !== "all") {
    where.subscriptionPlan = options.plan;
  }
  if (options.search?.trim()) {
    const q = options.search.trim();
    where.OR = [
      { name: { contains: q } },
      { slug: { contains: q } },
      { email: { contains: q } },
    ];
  }

  const [total, schools] = await Promise.all([
    db.school.count({ where }),
    db.school.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        members: {
          where: { role: "owner" },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    }),
  ]);

  const items = await Promise.all(
    schools.map(async (s: any) => {
      const studentCount = db.student
        ? await db.student.count({ where: { schoolId: s.id } }).catch(() => 0)
        : 0;

      const owners = (s.members || []).map((m: any) => ({
        id: m.user?.id,
        name: m.user?.name,
        email: m.user?.email,
        status: m.status,
      }));

      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        email: s.email,
        phone: s.phone,
        status: s.status,
        subscriptionPlan: s.subscriptionPlan,
        createdAt: s.createdAt,
        owners,
        studentCount,
      };
    }),
  );

  return {
    schools: items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Returns complete school details, metrics, settings, and owners.
 */
export async function getPlatformSchoolDetails(
  schoolId: string,
  db: any = prisma,
) {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!school) throw new ApiError(404, "School not found.");

  const [studentCount, staffCount, settings, sessions] = await Promise.all([
    db.student
      ? db.student.count({ where: { schoolId } }).catch(() => 0)
      : 0,
    db.member ? db.member.count({ where: { schoolId } }) : 0,
    db.setting
      ? (db.setting as any).findFirst({ where: { schoolId } }).catch(() => null)
      : null,
    db.academicSession
      ? (db.academicSession as any).findMany({ where: { schoolId } }).catch(() => [])
      : [],
  ]);

  const owners = school.members
    .filter((m: any) => m.role === "owner")
    .map((m: any) => ({
      memberId: m.id,
      userId: m.user?.id,
      name: m.user?.name,
      email: m.user?.email,
      status: m.status,
      createdAt: m.createdAt,
    }));

  const staff = school.members
    .filter((m: any) => m.role !== "owner")
    .map((m: any) => ({
      memberId: m.id,
      userId: m.user?.id,
      name: m.user?.name,
      email: m.user?.email,
      role: normalizeRole(m.role),
      status: m.status,
      createdAt: m.createdAt,
    }));

  return {
    school: {
      id: school.id,
      name: school.name,
      slug: school.slug,
      email: school.email,
      phone: school.phone,
      address: school.address,
      status: school.status,
      subscriptionPlan: school.subscriptionPlan,
      createdAt: school.createdAt,
    },
    metrics: {
      studentCount,
      staffCount,
    },
    owners,
    staff,
    settings,
    sessions,
  };
}

/**
 * Provisions a new school directly from the Super Admin platform dashboard.
 */
export async function createPlatformSchool(
  input: SchoolOnboardingInput,
  operator: SessionUser,
  db: any = prisma,
) {
  return onboardSchool(input, { db });
}

/**
 * Activates or suspends a school on the platform.
 */
export async function updateSchoolStatus(
  schoolId: string,
  status: "active" | "suspended" | "inactive",
  reason?: string,
  operator?: SessionUser,
  db: any = prisma,
) {
  const school = await db.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new ApiError(404, "School not found.");

  await db.school.update({
    where: { id: schoolId },
    data: { status },
  });

  // If suspending, also deactivate all school memberships
  if (status === "suspended" || status === "inactive") {
    await db.member.updateMany({
      where: { schoolId },
      data: { status: "inactive" },
    });
  } else if (status === "active") {
    // Reactivate owners
    await db.member.updateMany({
      where: { schoolId, role: "owner" },
      data: { status: "active" },
    });
  }

  if (db.auditLog?.create) {
    await db.auditLog.create({
      data: {
        schoolId,
        user: operator?.username ?? "super_admin",
        act: status === "active" ? "activate" : "suspend",
        entity: "school",
        description: `School ${status} by platform admin. ${reason ? `Reason: ${reason}` : ""}`,
      },
    });
  }

  return {
    success: true,
    schoolId,
    status,
    message: `School ${school.name} is now ${status}.`,
  };
}

/**
 * Manages school subscriptions across plans: free, starter, pro, enterprise.
 */
export async function updateSchoolSubscription(
  schoolId: string,
  plan: "free" | "starter" | "pro" | "enterprise",
  expiresAt?: Date | string | null,
  operator?: SessionUser,
  db: any = prisma,
) {
  const school = await db.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new ApiError(404, "School not found.");

  const validPlans = ["free", "starter", "pro", "enterprise"];
  const normalizedPlan = plan.toLowerCase() as typeof plan;
  if (!validPlans.includes(normalizedPlan)) {
    throw new ApiError(422, `Invalid plan. Must be one of: ${validPlans.join(", ")}.`);
  }

  await db.school.update({
    where: { id: schoolId },
    data: { subscriptionPlan: normalizedPlan },
  });

  if (db.setting?.updateMany) {
    await db.setting.updateMany({
      where: { schoolId },
      data: {
        planName: normalizedPlan.toUpperCase(),
        planExpires: expiresAt ? new Date(expiresAt) : null,
      },
    });
  }

  if (db.auditLog?.create) {
    await db.auditLog.create({
      data: {
        schoolId,
        user: operator?.username ?? "super_admin",
        act: "subscription_update",
        entity: "school",
        description: `Subscription updated to ${normalizedPlan.toUpperCase()}`,
      },
    });
  }

  return {
    success: true,
    schoolId,
    subscriptionPlan: normalizedPlan,
    message: `Subscription for ${school.name} updated to ${normalizedPlan}.`,
  };
}

/**
 * Manages school owners (assigning or revoking owner status).
 */
export async function manageSchoolOwner(
  schoolId: string,
  action: "assign" | "revoke",
  targetUserEmail: string,
  operator?: SessionUser,
  db: any = prisma,
) {
  const email = targetUserEmail.trim().toLowerCase();
  const school = await db.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new ApiError(404, "School not found.");

  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(404, `User with email ${email} not found.`);

  if (action === "assign") {
    const existing = await db.member.findFirst({
      where: { schoolId, userId: user.id },
    });

    if (existing) {
      await db.member.update({
        where: { id: existing.id },
        data: { role: "owner", status: "active" },
      });
    } else {
      await db.member.create({
        data: {
          schoolId,
          userId: user.id,
          role: "owner",
          status: "active",
        },
      });
    }

    return { success: true, message: `${email} is now an owner of ${school.name}.` };
  } else {
    // Revoke owner
    const existing = await db.member.findFirst({
      where: { schoolId, userId: user.id, role: "owner" },
    });
    if (!existing) {
      throw new ApiError(404, `${email} is not currently an owner of ${school.name}.`);
    }

    const activeOwners = await db.member.count({
      where: { schoolId, role: "owner", status: "active" },
    });
    if (activeOwners <= 1) {
      throw new ApiError(400, "Cannot revoke the only active school owner.");
    }

    await db.member.delete({ where: { id: existing.id } });
    return { success: true, message: `Owner privileges revoked for ${email}.` };
  }
}
