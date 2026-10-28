import { readJson, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { collectAllDues } from "@/lib/fees";

export const POST = route(async (req) => {
  const user = await requirePermission("fees");
  const body = await readJson(req);
  const studentId = String(body.studentId ?? "");
  if (!studentId) throw new ApiError(422, "Choose a student.");
  return collectAllDues({
    studentId,
    mode: String(body.mode ?? ""),
    date: body.date ? String(body.date) : undefined,
    username: user.username,
  });
});
