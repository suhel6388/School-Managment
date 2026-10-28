import { readJson, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { saveExamResults } from "@/lib/exams";

export const POST = route(async (req) => {
  await requirePermission("exam");
  const body = await readJson(req);
  const scheduleId = String(body.scheduleId ?? "");
  if (!scheduleId) throw new ApiError(422, "Choose an exam subject.");
  if (!Array.isArray(body.records)) throw new ApiError(422, "No marks were submitted.");
  const records = (body.records as Record<string, unknown>[]).map((r) => ({
    studentId: String(r.studentId ?? ""),
    marks: r.marks === null || r.marks === "" || r.marks === undefined ? null : Number(r.marks),
    absent: r.absent === true || r.absent === "true",
  }));
  return saveExamResults(scheduleId, records);
});
