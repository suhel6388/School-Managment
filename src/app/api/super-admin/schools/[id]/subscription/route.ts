import { readJson, route } from "@/lib/http";
import { requireSuperAdmin } from "@/lib/rbac";
import { updateSchoolSubscription } from "@/lib/super-admin";
import { ApiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const operator = await requireSuperAdmin(req);
  const { id } = await ctx.params;
  const body = await readJson(req);

  const plan = String(body.plan ?? "").toLowerCase();
  const validPlans = ["free", "starter", "pro", "enterprise"];
  if (!validPlans.includes(plan)) {
    throw new ApiError(422, `Invalid plan. Must be one of: ${validPlans.join(", ")}.`);
  }

  const result = await updateSchoolSubscription(
    id,
    plan as "free" | "starter" | "pro" | "enterprise",
    body.expiresAt ? String(body.expiresAt) : null,
    operator,
  );

  return result;
});

