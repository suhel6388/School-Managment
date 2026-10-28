import { query, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { marksheetsForClass } from "@/lib/exams";

export const GET = route(async (req) => {
  await requirePermission("exam");
  const params = query(req);
  const groupId = params.get("groupId") ?? "";
  const classId = params.get("classId") ?? "";
  const sectionId = params.get("sectionId") ?? "";
  const studentIds = (params.get("studentIds") ?? "").split(",").filter(Boolean);
  if (!groupId || !classId) throw new ApiError(422, "Choose an exam group and class.");
  let sheets = await marksheetsForClass(groupId, classId, sectionId || undefined);
  if (studentIds.length) {
    const wanted = new Set(studentIds);
    sheets = sheets.filter((s) => wanted.has(s.studentId));
  }
  return { sheets };
});
