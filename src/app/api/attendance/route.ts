import { query, readJson, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { attendanceForDate, saveAttendance } from "@/lib/attendance";

export const GET = route(async (req) => {
  await requirePermission("att");
  const params = query(req);
  const date = params.get("date") ?? "";
  const type = params.get("type") === "staff" ? "staff" : "student";
  if (!date) throw new ApiError(422, "Choose a date.");
  return attendanceForDate(date, {
    type,
    classId: params.get("classId") ?? undefined,
    sectionId: params.get("sectionId") ?? undefined,
  });
});

export const POST = route(async (req) => {
  const user = await requirePermission("att");
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
    username: user.username,
  });
});
