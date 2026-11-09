import { route } from "@/lib/http";
import { requireSchoolMembership } from "@/lib/rbac";
import { dashboardData } from "@/lib/dashboard";

export const GET = route(async () => {
  const context = await requireSchoolMembership();
  return dashboardData(context.school.id);
});
