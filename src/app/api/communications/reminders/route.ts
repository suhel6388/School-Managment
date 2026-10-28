import { route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { runFeeReminders } from "@/lib/communications";

export const POST = route(async () => {
  const user = await requirePermission("comm");
  return runFeeReminders(user.username);
});
