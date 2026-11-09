import { route } from "@/lib/http";
import { requireSuperAdmin } from "@/lib/rbac";
import { getPlatformSchoolDetails } from "@/lib/super-admin";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (req: Request, ctx: Ctx) => {
  await requireSuperAdmin(req);
  const { id } = await ctx.params;
  const details = await getPlatformSchoolDetails(id);
  return details;
});

