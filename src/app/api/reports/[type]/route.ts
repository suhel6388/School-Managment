import { query, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { getReport } from "@/lib/reports";

const ALLOWED = new Set([
  "student",
  "finance",
  "attendance",
  "exam",
  "online",
  "lesson",
  "hr",
  "homework",
  "library",
  "inventory",
  "transport",
  "hostel",
  "alumni",
  "userlog",
  "audit",
]);

type Ctx = { params: Promise<{ type: string }> };

export const GET = route(async (req: Request, ctx: Ctx) => {
  await requirePermission("rep");
  const { type } = await ctx.params;
  if (!ALLOWED.has(type)) throw new ApiError(404, "Unknown report.");
  return getReport(type, query(req));
});
