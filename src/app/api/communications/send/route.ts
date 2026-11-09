import { readJson, route } from "@/lib/http";
import { requireSchoolPermission } from "@/lib/tenant";
import { ApiError } from "@/lib/errors";
import { sendMessages } from "@/lib/communications";

export const POST = route(async (req) => {
  const context = await requireSchoolPermission("communication.create");
  const body = await readJson(req);
  const channel = String(body.channel ?? "");
  if (!["Email", "SMS", "WhatsApp"].includes(channel)) {
    throw new ApiError(422, "Channel must be Email, SMS or WhatsApp.");
  }
  return sendMessages(
    {
      channel: channel as "Email" | "SMS" | "WhatsApp",
      audience: String(body.audience ?? ""),
      subject: body.subject ? String(body.subject) : undefined,
      body: String(body.body ?? ""),
      username: context.user.username,
    },
    context.school.id,
  );
});
