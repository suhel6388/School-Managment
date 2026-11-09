import { query, readJson, route } from "@/lib/http";
import { requireSchoolPermission, validateSameSchool } from "@/lib/tenant";
import { ApiError } from "@/lib/errors";
import { attendanceForDate, saveAttendance } from "@/lib/attendance";

export const GET = route(async (req) => {
  const context = await requireSchoolPermission("attendance.read");
  const params = query(req);
  const date = params.get("date") ?? "";
  const type = params.get("type") === "staff" ? "staff" : "student";
  if (!date) throw new ApiError(422, "Choose a date.");

  const classId = params.get("classId") ?? undefined;
  const sectionId = params.get("sectionId") ?? undefined;
  if (classId) {
    await validateSameSchool(context.school.id, [
      { model: "SchoolClass", id: classId },
      ...(sectionId ? [{ model: "Section", id: sectionId }] : []),
    ]);
  }

  return attendanceForDate(date, {
    type,
    classId,
    sectionId,
  });
});

export const POST = route(async (req) => {
  const context = await requireSchoolPermission("attendance.create");
  const body = await readJson(req);
  const type = body.type === "staff" ? "staff" : "student";
  const records = Array.isArray(body.records)
    ? (body.records as Record<string, unknown>[]).map((r) => ({
        id: String(r.id ?? ""),
        status: String(r.status ?? ""),
        note: r.note ? String(r.note) : undefined,
      }))
    : [];
  return saveAttendance({
    date: String(body.date ?? ""),
    type,
    records,
    username: context.user.username,
  });
});
