import { readJson, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { bankPaymentAction } from "@/lib/fees";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (req: Request, ctx: Ctx) => {
  const user = await requirePermission("fees");
  const { id } = await ctx.params;
  const body = await readJson(req);
  const action = String(body.action ?? "");
  if (action !== "approve" && action !== "reject") {
    throw new ApiError(422, "Action must be approve or reject.");
  }
  return bankPaymentAction(id, action, user.username);
});
