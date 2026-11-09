import { readJson, route } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { switchActiveSchool } from "@/lib/staff-management";

export const POST = route(async (req) => {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Please sign in to switch schools.");

  const body = await readJson(req);
  const targetSchoolId = String(body.schoolId ?? body.organizationId ?? "");
  if (!targetSchoolId) {
    throw new ApiError(422, "Please provide the target school id.");
  }

  const result = await switchActiveSchool(user.uid, targetSchoolId);
  return result;
});
