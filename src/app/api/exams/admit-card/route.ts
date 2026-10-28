import { query, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { admitCardData } from "@/lib/exams";
import { prisma } from "@/lib/prisma";

export const GET = route(async (req) => {
  await requirePermission("exam");
  const params = query(req);
  const groupId = params.get("groupId") ?? "";
  const classId = params.get("classId") ?? "";
  const sectionId = params.get("sectionId") ?? "";
  if (!groupId || !classId) throw new ApiError(422, "Choose an exam group and class.");

  let studentIds = (params.get("studentIds") ?? "").split(",").filter(Boolean);
  if (!studentIds.length) {
    studentIds = (
      await prisma.student.findMany({
        where: { classId, status: "active", ...(sectionId ? { sectionId } : {}) },
        select: { id: true },
      })
    ).map((s) => s.id);
  }
  const data = await admitCardData(groupId, classId, studentIds);
  const settings = await prisma.setting.findUnique({ where: { id: 1 } });
  return { ...data, school: { name: settings?.name ?? "ICE School", address: settings?.address ?? "" } };
});
