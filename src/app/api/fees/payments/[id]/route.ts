import { route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { paymentReceipt, revertPayment } from "@/lib/fees";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, ctx: Ctx) => {
  await requirePermission("fees");
  const { id } = await ctx.params;
  return paymentReceipt(id);
});

export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const user = await requirePermission("fees");
  const { id } = await ctx.params;
  return revertPayment(id, user.username);
});
