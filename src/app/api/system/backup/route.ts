import { route } from "@/lib/http";
import { requireSchoolPermission } from "@/lib/tenant";
import { buildBackup } from "@/lib/backup";

export const GET = route(async () => {
  const context = await requireSchoolPermission("sys");
  return buildBackup(context.school.id);
});
