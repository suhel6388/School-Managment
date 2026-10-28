import { readJson, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { logCredentials } from "@/lib/communications";

export const POST = route(async (req) => {
  const user = await requirePermission("comm");
  const body = await readJson(req);
  const studentId = String(body.studentId ?? "");
  if (!studentId) throw new ApiError(422, "Choose a student.");
  return logCredentials(studentId, user.username);
});
