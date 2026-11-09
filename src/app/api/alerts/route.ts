import { route } from "@/lib/http";
import { requireSchoolMembership } from "@/lib/rbac";
import { alertsOnly } from "@/lib/dashboard";

export const GET = route(async () => {
  const context = await requireSchoolMembership();
  return { alerts: await alertsOnly(context.school.id) };
});
