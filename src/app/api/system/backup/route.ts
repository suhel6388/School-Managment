import { route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { buildBackup } from "@/lib/backup";

export const GET = route(async () => {
  await requirePermission("sys");
  return buildBackup();
});
