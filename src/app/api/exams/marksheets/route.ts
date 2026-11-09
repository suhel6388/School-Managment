import { query, route } from "@/lib/http";
import { requireSchoolPermission, validateSameSchool } from "@/lib/tenant";
import { ApiError } from "@/lib/errors";
import { marksheetsForClass } from "@/lib/exams";

export const GET = route(async (req) => {
  const context = await requireSchoolPermission("exam.read");
  const schoolId = context.school.id;
  const params = query(req);
  const groupId = params.get("groupId") ?? "";
  const classId = params.get("classId") ?? "";
  const sectionId = params.get("sectionId") ?? "";
  const studentIds = (params.get("studentIds") ?? "").split(",").filter(Boolean);
  if (!groupId || !classId) throw new ApiError(422, "Choose an exam group and class.");

  await validateSameSchool(schoolId, [
    { model: "ExamGroup", id: groupId },
    { model: "SchoolClass", id: classId },
    ...(sectionId ? [{ model: "Section", id: sectionId }] : []),
  ]);

  let sheets = await marksheetsForClass(groupId, classId, sectionId || undefined, schoolId);
  if (studentIds.length) {
    const wanted = new Set(studentIds);
    sheets = sheets.filter((s) => wanted.has(s.studentId));
  }
  return { sheets };
});
