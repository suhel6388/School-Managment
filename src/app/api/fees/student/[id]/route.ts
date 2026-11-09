import { route } from "@/lib/http";
import { requireSchoolPermission, validateSameSchool } from "@/lib/tenant";
import { getStudentFees } from "@/lib/fees";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, ctx: Ctx) => {
  const context = await requireSchoolPermission("fees.read");
  const { id } = await ctx.params;
  await validateSameSchool(context.school.id, [{ model: "Student", id }]);
  return getStudentFees(id);
});
