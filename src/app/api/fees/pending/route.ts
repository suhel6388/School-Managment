import { route } from "@/lib/http";
import { requireSchoolPermission } from "@/lib/tenant";
import { pendingFees } from "@/lib/fees";

export const GET = route(async () => {
  const context = await requireSchoolPermission("fees.read");
  const items = await pendingFees(context.school.id);
  return {
    items: items.map((i) => ({
      studentId: i.student.id,
      name: i.student.name,
      admNo: i.student.admNo,
      className: i.student.className,
      sectionName: i.student.sectionName,
      phone: i.student.phone,
      due: i.dueNow,
      total: i.totals.bal,
    })),
    total: Math.round(items.reduce((sum, i) => sum + i.dueNow, 0) * 100) / 100,
    students: items.length,
  };
});
