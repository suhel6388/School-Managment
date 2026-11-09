import { route } from "@/lib/http";
import { requireSchoolPermission } from "@/lib/tenant";
import { getStaffActivityLogs } from "@/lib/staff-management";

export const GET = route(async (req) => {
  const context = await requireSchoolPermission("staff.manage");
  const url = new URL(req.url);
  const staffEmail = url.searchParams.get("email") || undefined;
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 50;

  const logs = await getStaffActivityLogs(context.school.id, { staffEmail, limit });
  return { logs };
});

