import { readJson, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { sendMessages } from "@/lib/communications";

export const POST = route(async (req) => {
  const user = await requirePermission("comm");
  const body = await readJson(req);
  const channel = String(body.channel ?? "");
  if (!["Email", "SMS", "WhatsApp"].includes(channel)) {
    throw new ApiError(422, "Channel must be Email, SMS or WhatsApp.");
  }
  return sendMessages({
    channel: channel as "Email" | "SMS" | "WhatsApp",
    audience: String(body.audience ?? ""),
    subject: body.subject ? String(body.subject) : undefined,
    body: String(body.body ?? ""),
    username: user.username,
  });
});
