import { route } from "@/lib/http";
import { resolveSchoolContext, modelHasSchoolId } from "@/lib/tenant";
import { requireUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { ApiError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export const GET = route(async () => {
  const user = await requireUser();
  const normalizedRole = user.role.toLowerCase().replace(/[\s-]+/g, "_");
  const superAdmin = normalizedRole === "super_admin" || user.role === "Admin";

  if (superAdmin) {
    const [students, staff, classes, sections, payments, roles, users, logs] = await Promise.all([
      prisma.student.count(),
      prisma.staff.count(),
      prisma.schoolClass.count(),
      prisma.section.count(),
      prisma.payment.count(),
      prisma.role.count(),
      prisma.appUser.count(),
      prisma.auditLog.count(),
    ]);
    return { students, staff, classes, sections, payments, roles, users, logs };
  }

  const context = await resolveSchoolContext();
  if (!context) {
    throw new ApiError(403, "School context required to view system stats.");
  }
  const allowed =
    hasPermission(context.role, "system.read") ||
    hasPermission(context.role, "reports.read");
  if (!allowed) {
    throw new ApiError(403, "Insufficient permissions to view system stats.");
  }

  const schoolId = context.school.id;
  const filter = (model: string): any => (modelHasSchoolId(model) ? { where: { schoolId } } : {});

  const [students, staff, classes, sections, payments, roles, users, logs] = await Promise.all([
    prisma.student.count(filter("Student")),
    prisma.staff.count(filter("Staff")),
    prisma.schoolClass.count(filter("SchoolClass")),
    prisma.section.count(filter("Section")),
    prisma.payment.count(filter("Payment")),
    prisma.role.count(filter("Role")),
    prisma.appUser.count(filter("AppUser")),
    prisma.auditLog.count(filter("AuditLog")),
  ]);
  return { students, staff, classes, sections, payments, roles, users, logs };
});
