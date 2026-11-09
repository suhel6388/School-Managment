import { readJson, route } from "@/lib/http";
import { requireSchoolPermission, validateSameSchool } from "@/lib/tenant";
import { ApiError } from "@/lib/errors";
import { logCredentials } from "@/lib/communications";

export const POST = route(async (req) => {
  const context = await requireSchoolPermission("communication.create");
  const body = await readJson(req);
  const studentId = String(body.studentId ?? "");
  if (!studentId) throw new ApiError(422, "Choose a student.");

  await validateSameSchool(context.school.id, [{ model: "Student", id: studentId }]);

  return logCredentials(studentId, context.user.username, context.school.id);
});
