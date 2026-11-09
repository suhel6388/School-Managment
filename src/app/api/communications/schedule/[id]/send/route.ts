import { route } from "@/lib/http";
import { requireSchoolPermission } from "@/lib/tenant";
import { scheduledSend } from "@/lib/communications";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (_req: Request, ctx: Ctx) => {
  const context = await requireSchoolPermission("communication.create");
  const { id } = await ctx.params;
  return scheduledSend(id, context.user.username, context.school.id);
});
