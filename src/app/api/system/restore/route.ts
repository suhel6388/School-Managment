import { readJson, route } from "@/lib/http";
import { requireSchoolPermission } from "@/lib/tenant";
import { ApiError } from "@/lib/errors";
import { restoreBackup } from "@/lib/backup";

export const POST = route(async (req) => {
  const context = await requireSchoolPermission("sys");
  const body = await readJson(req);
  if (!body.backup) throw new ApiError(422, "Upload a backup file first.");
  const result = await restoreBackup(body.backup, context.school.id);
  return { ...result, restoredBy: context.user.username };
});
