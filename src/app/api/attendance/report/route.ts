import { query, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { attendanceReport } from "@/lib/attendance";

export const GET = route(async (req) => {
  await requirePermission("att");
  const params = query(req);
  const month = params.get("month") ?? new Date().toISOString().slice(0, 7);
  return {
    month,
    rows: await attendanceReport(
      params.get("classId") ?? "",
      params.get("sectionId") ?? "",
      month,
    ),
  };
});
