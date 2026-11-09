import { readJson, route } from "@/lib/http";
import { requireSchoolPermission } from "@/lib/tenant";
import { ApiError } from "@/lib/errors";
import {
  updateStaffRole,
  updateStaffStatus,
  removeStaffMember,
} from "@/lib/staff-management";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const context = await requireSchoolPermission("staff.manage");
  const { id: memberId } = await ctx.params;
  const body = await readJson(req);

  if ("role" in body) {
    return updateStaffRole(context.school.id, memberId, String(body.role), context.user);
  }

  if ("status" in body) {
    const status = String(body.status).toLowerCase();
    if (status !== "active" && status !== "inactive") {
      throw new ApiError(422, "Status must be 'active' or 'inactive'.");
    }
    return updateStaffStatus(context.school.id, memberId, status, context.user);
  }

  throw new ApiError(400, "Provide either 'role' or 'status' to update.");
});

export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const context = await requireSchoolPermission("staff.manage");
  const { id: memberId } = await ctx.params;
  return removeStaffMember(context.school.id, memberId, context.user);
});
