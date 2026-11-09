import { route } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { acceptInvitation } from "@/lib/staff-management";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (_req: Request, ctx: Ctx) => {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Please sign in to accept this invitation.");

  const { id } = await ctx.params;
  return acceptInvitation(id, {
    id: user.uid,
    email: user.email || user.username,
    name: user.name,
  });
});
