import { query, route } from "@/lib/http";
import { requireSchoolPermission, validateSameSchool, modelHasSchoolId } from "@/lib/tenant";
import { ApiError } from "@/lib/errors";
import { admitCardData } from "@/lib/exams";
import { prisma } from "@/lib/prisma";

export const GET = route(async (req) => {
  const context = await requireSchoolPermission("exam.read");
  const schoolId = context.school.id;
  const params = query(req);
  const groupId = params.get("groupId") ?? "";
  const classId = params.get("classId") ?? "";
  const sectionId = params.get("sectionId") ?? "";
  if (!groupId || !classId) throw new ApiError(422, "Choose an exam group and class.");

  await validateSameSchool(schoolId, [
    { model: "ExamGroup", id: groupId },
    { model: "SchoolClass", id: classId },
    ...(sectionId ? [{ model: "Section", id: sectionId }] : []),
  ]);

  let studentIds = (params.get("studentIds") ?? "").split(",").filter(Boolean);
  if (!studentIds.length) {
    const studentWhere: Record<string, unknown> = {
      classId,
      status: "active",
      ...(sectionId ? { sectionId } : {}),
    };
    if (schoolId && modelHasSchoolId("Student")) studentWhere.schoolId = schoolId;

    studentIds = (
      await prisma.student.findMany({
        where: studentWhere,
        select: { id: true },
      })
    ).map((s) => s.id);
  }

  const data = await admitCardData(groupId, classId, studentIds, schoolId);
  return {
    ...data,
    school: {
      name: context.school.name,
      address: "",
    },
  };
});
