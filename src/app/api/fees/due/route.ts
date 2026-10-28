import { query, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { dueFeeRows } from "@/lib/fees";

export const GET = route(async (req) => {
  await requirePermission("fees");
  const params = query(req);
  const rows = await dueFeeRows({
    classId: params.get("classId") ?? undefined,
    sectionId: params.get("sectionId") ?? undefined,
    type: params.get("type") ?? undefined,
  });
  return {
    rows,
    total: Math.round(rows.reduce((sum, r) => sum + r.balance, 0) * 100) / 100,
  };
});
