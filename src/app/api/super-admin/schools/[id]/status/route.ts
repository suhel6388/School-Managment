import { readJson, route } from "@/lib/http";
import { requireSuperAdmin } from "@/lib/rbac";
import { updateSchoolStatus } from "@/lib/super-admin";
import { ApiError } from "@/lib/errors";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const operator = await requireSuperAdmin(req);
  const { id } = await ctx.params;
  const body = await readJson(req);

  const status = String(body.status ?? "").toLowerCase();
  if (status !== "active" && status !== "suspended" && status !== "inactive") {
    throw new ApiError(422, "Invalid status. Must be 'active', 'suspended', or 'inactive'.");
  }

  const result = await updateSchoolStatus(
    id,
    status as "active" | "suspended" | "inactive",
    body.reason ? String(body.reason) : undefined,
    operator,
  );

  return result;
});

