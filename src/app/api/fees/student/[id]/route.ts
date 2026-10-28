import { route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { getStudentFees } from "@/lib/fees";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, ctx: Ctx) => {
  await requirePermission("fees");
  const { id } = await ctx.params;
  return getStudentFees(id);
});
