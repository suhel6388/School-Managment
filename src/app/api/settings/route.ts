import { readJson, route } from "@/lib/http";
import { requireSchoolMembership } from "@/lib/rbac";
import { requireSchoolPermission, modelHasSchoolId } from "@/lib/tenant";
import { getSettings, updateSettings } from "@/lib/settings";
import { serializeModel } from "@/lib/dmmf";
import { prisma } from "@/lib/prisma";

export const GET = route(async () => {
  const context = await requireSchoolMembership();
  const schoolId = context.school.id;
  const settings = await getSettings(schoolId);
  const [students, staff, classes] = await Promise.all([
    prisma.student.count({
      where: {
        status: "active",
        ...(modelHasSchoolId("Student") ? { schoolId } : {}),
      } as any,
    }),
    prisma.staff.count({
      where: {
        status: "active",
        ...(modelHasSchoolId("Staff") ? { schoolId } : {}),
      } as any,
    }),
    prisma.schoolClass.count({
      where: {
        ...(modelHasSchoolId("SchoolClass") ? { schoolId } : {}),
      } as any,
    }),
  ]);
  return {
    settings: serializeModel("Setting", settings),
    usage: { students, staff, classes },
  };
});

export const PATCH = route(async (req) => {
  const context = await requireSchoolPermission("settings.update");
  const settings = await updateSettings(
    await readJson(req),
    context.user.username,
    context.school.id,
  );
  return { settings: serializeModel("Setting", settings) };
});
