import { readJson, route } from "@/lib/http";
import { registerAndAcceptInvitation } from "@/lib/staff-management";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const body = (await readJson(req)) as {
    name: string;
    password: string;
    confirmPassword?: string;
  };

  return registerAndAcceptInvitation(id, body);
});
