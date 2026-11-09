import { route } from "@/lib/http";
import { requireSchoolPermission } from "@/lib/tenant";
import { runFeeReminders } from "@/lib/communications";

export const POST = route(async () => {
  const context = await requireSchoolPermission("communication.create");
  return runFeeReminders(context.user.username, context.school.id);
});
