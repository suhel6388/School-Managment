import { readJson, route } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import { onboardSchool, type SchoolOnboardingInput } from "@/lib/onboarding";

export const POST = route(async (req) => {
  const body = (await readJson(req)) as SchoolOnboardingInput;
  const currentUser = await getSessionUser();
  const result = await onboardSchool(body, { currentUser });
  return result;
});

