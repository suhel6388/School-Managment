import { query, route } from "@/lib/http";
import { requireSchoolPermission, validateSameSchool } from "@/lib/tenant";
import { attendanceReport } from "@/lib/attendance";

export const GET = route(async (req) => {
  const context = await requireSchoolPermission("attendance.read");
  const params = query(req);
  const month = params.get("month") ?? new Date().toISOString().slice(0, 7);
  const classId = params.get("classId") ?? "";
  const sectionId = params.get("sectionId") ?? "";

  if (classId) {
    await validateSameSchool(context.school.id, [
      { model: "SchoolClass", id: classId },
      ...(sectionId ? [{ model: "Section", id: sectionId }] : []),
    ]);
  }

  return {
    month,
    rows: await attendanceReport(
      classId,
      sectionId,
      month,
      context.school.id,
    ),
  };
});
