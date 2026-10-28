import { readJson, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { collectFees } from "@/lib/fees";

export const POST = route(async (req) => {
  const user = await requirePermission("fees");
  const body = await readJson(req);
  const studentId = String(body.studentId ?? "");
  const feeKey = String(body.feeKey ?? "");
  const amount = Number(body.amount);
  if (!studentId || !feeKey) throw new ApiError(422, "Choose a student and a fee row.");
  if (!Number.isFinite(amount)) throw new ApiError(422, "Enter a valid amount.");
  return collectFees({
    studentId,
    feeKey,
    amount,
    discountId: body.discountId ? String(body.discountId) : null,
    fine: body.fine === undefined || body.fine === "" ? 0 : Number(body.fine),
    mode: String(body.mode ?? ""),
    date: body.date ? String(body.date) : undefined,
    note: body.note ? String(body.note) : undefined,
    username: user.username,
  });
});
