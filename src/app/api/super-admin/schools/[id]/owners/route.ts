import { readJson, route } from "@/lib/http";
import { requireSuperAdmin } from "@/lib/rbac";
import { manageSchoolOwner } from "@/lib/super-admin";
import { ApiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (req: Request, ctx: Ctx) => {
  const operator = await requireSuperAdmin(req);
  const { id } = await ctx.params;
  const body = await readJson(req);

  const action = String(body.action ?? "").toLowerCase();
  if (action !== "assign" && action !== "revoke") {
    throw new ApiError(422, "Action must be either 'assign' or 'revoke'.");
  }

  const targetEmail = String(body.targetUserEmail ?? body.email ?? "").trim();
  if (!targetEmail) {
    throw new ApiError(422, "targetUserEmail is required.");
  }

  const result = await manageSchoolOwner(
    id,
    action as "assign" | "revoke",
    targetEmail,
    operator,
  );

  return result;
});

