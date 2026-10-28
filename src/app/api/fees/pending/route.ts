import { route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { pendingFees } from "@/lib/fees";

export const GET = route(async () => {
  await requirePermission("fees");
  const items = await pendingFees();
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
