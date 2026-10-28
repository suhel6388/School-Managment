import { readJson, route } from "@/lib/http";
import { requirePermission, requireUser } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/settings";
import { serializeModel } from "@/lib/dmmf";
import { prisma } from "@/lib/prisma";

export const GET = route(async () => {
  await requireUser();
  const settings = await getSettings();
  const [students, staff, classes] = await Promise.all([
    prisma.student.count({ where: { status: "active" } }),
    prisma.staff.count({ where: { status: "active" } }),
    prisma.schoolClass.count(),
  ]);
  return {
    settings: serializeModel("Setting", settings),
    usage: { students, staff, classes },
  };
});

export const PATCH = route(async (req) => {
  const user = await requirePermission("sys");
  const settings = await updateSettings(await readJson(req), user.username);
  return { settings: serializeModel("Setting", settings) };
});
