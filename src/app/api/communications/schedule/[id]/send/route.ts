import { route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { scheduledSend } from "@/lib/communications";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (_req: Request, ctx: Ctx) => {
  const user = await requirePermission("comm");
  const { id } = await ctx.params;
  return scheduledSend(id, user.username);
});
