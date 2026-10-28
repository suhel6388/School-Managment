import { route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const GET = route(async () => {
  await requirePermission("sys");
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
});
