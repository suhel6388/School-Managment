import { route } from "@/lib/http";
import { requireSchoolPermission } from "@/lib/tenant";
import { paymentReceipt, revertPayment } from "@/lib/fees";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, ctx: Ctx) => {
  await requireSchoolPermission("fees.read");
  const { id } = await ctx.params;
  return paymentReceipt(id);
});

export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const context = await requireSchoolPermission("fees.delete");
  const { id } = await ctx.params;
  return revertPayment(id, context.user.username);
});
