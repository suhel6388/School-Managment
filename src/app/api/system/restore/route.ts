import { readJson, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { restoreBackup } from "@/lib/backup";

export const POST = route(async (req) => {
  const user = await requirePermission("sys");
  const body = await readJson(req);
  if (!body.backup) throw new ApiError(422, "Upload a backup file first.");
  const result = await restoreBackup(body.backup);
  return { ...result, restoredBy: user.username };
});
