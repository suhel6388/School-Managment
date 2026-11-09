import { query, route } from "@/lib/http";
import { requireSchoolPermission, validateSameSchool } from "@/lib/tenant";
import { dueFeeRows } from "@/lib/fees";

export const GET = route(async (req) => {
  const context = await requireSchoolPermission("fees.read");
  const params = query(req);
  const classId = params.get("classId") ?? undefined;
  const sectionId = params.get("sectionId") ?? undefined;

  if (classId) {
    await validateSameSchool(context.school.id, [
      { model: "SchoolClass", id: classId },
      ...(sectionId ? [{ model: "Section", id: sectionId }] : []),
    ]);
  }

  const rows = await dueFeeRows(
    {
      classId,
      sectionId,
      type: params.get("type") ?? undefined,
    },
    context.school.id,
  );
  return {
    rows,
    total: Math.round(rows.reduce((sum, r) => sum + r.balance, 0) * 100) / 100,
  };
});
