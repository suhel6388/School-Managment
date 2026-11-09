import { route } from "@/lib/http";
import { requireSuperAdmin } from "@/lib/rbac";
import { getPlatformOverview } from "@/lib/super-admin";

export const dynamic = "force-dynamic";

export const GET = route(async (req: Request) => {
  await requireSuperAdmin(req);
  const overview = await getPlatformOverview();
  return overview;
});

