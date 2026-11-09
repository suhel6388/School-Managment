import { route } from "@/lib/http";
import { requireSchoolPermission } from "@/lib/tenant";
import { getInvitationById, cancelInvitation } from "@/lib/staff-management";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const invitation = await getInvitationById(id);
  return { invitation };
});

export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const context = await requireSchoolPermission("staff.manage");
  const { id } = await ctx.params;
  return cancelInvitation(context.school.id, id, context.user);
});

