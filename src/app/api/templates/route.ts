import { readJson, route } from "@/lib/http";
import { requirePermission, requireUser } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { getTemplates, updateTemplate } from "@/lib/settings";

export const GET = route(async () => {
  await requireUser();
  return getTemplates();
});

export const PATCH = route(async (req) => {
  const user = await requirePermission("exam");
  const body = await readJson(req);
  const type = String(body.type ?? "");
  if (type !== "admit" && type !== "mark" && type !== "id") {
    throw new ApiError(422, "Template type must be admit, mark or id.");
  }
  return updateTemplate(type, body, user.username);
});
