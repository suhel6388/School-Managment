import { readJson, route } from "@/lib/http";
import { requireSchoolMembership } from "@/lib/rbac";
import { requireSchoolPermission } from "@/lib/tenant";
import { ApiError } from "@/lib/errors";
import { getTemplates, updateTemplate } from "@/lib/settings";

export const GET = route(async () => {
  const context = await requireSchoolMembership();
  return getTemplates(context.school.id);
});

export const PATCH = route(async (req) => {
  const context = await requireSchoolPermission("settings.update");
  const body = await readJson(req);
  const type = String(body.type ?? "");
  if (type !== "admit" && type !== "mark" && type !== "id") {
    throw new ApiError(422, "Template type must be admit, mark or id.");
  }
  return updateTemplate(type, body, context.user.username, context.school.id);
});
