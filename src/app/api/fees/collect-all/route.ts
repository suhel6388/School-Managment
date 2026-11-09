import { readJson, route } from "@/lib/http";
import { requireSchoolPermission, validateSameSchool } from "@/lib/tenant";
import { ApiError } from "@/lib/errors";
import { collectAllDues } from "@/lib/fees";

export const POST = route(async (req) => {
  const context = await requireSchoolPermission("fees.create");
  const body = await readJson(req);
  const studentId = String(body.studentId ?? "");
  if (!studentId) throw new ApiError(422, "Choose a student.");

  await validateSameSchool(context.school.id, [{ model: "Student", id: studentId }]);

  return collectAllDues({
    studentId,
    mode: String(body.mode ?? ""),
    date: body.date ? String(body.date) : undefined,
    username: context.user.username,
  });
});
