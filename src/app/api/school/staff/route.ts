import { readJson, route } from "@/lib/http";
import { requireSchoolPermission } from "@/lib/tenant";
import {
  listStaffMembers,
  listPendingInvitations,
  inviteStaffMember,
} from "@/lib/staff-management";

export const GET = route(async () => {
  const context = await requireSchoolPermission("staff.manage");
  const schoolId = context.school.id;

  const [staff, invitations] = await Promise.all([
    listStaffMembers(schoolId),
    listPendingInvitations(schoolId),
  ]);

  return { staff, invitations };
});

export const POST = route(async (req) => {
  const context = await requireSchoolPermission("staff.manage");
  const body = await readJson(req);

  const result = await inviteStaffMember(context.school.id, context.user, {
    email: String(body.email ?? ""),
    role: String(body.role ?? "staff"),
    name: body.name ? String(body.name) : undefined,
  });

  return result;
});
