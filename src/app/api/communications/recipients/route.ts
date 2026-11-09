import { query, route } from "@/lib/http";
import { requireSchoolPermission } from "@/lib/tenant";
import { audienceOptions, getRecipients } from "@/lib/communications";

export const GET = route(async (req) => {
  const context = await requireSchoolPermission("communication.read");
  const params = query(req);
  const audience = params.get("audience") ?? "";
  const [options, recipients] = await Promise.all([
    audienceOptions(context.school.id),
    audience ? getRecipients(audience, 200, context.school.id) : Promise.resolve([]),
  ]);
  return { ...options, recipients: recipients.slice(0, 50), count: recipients.length };
});
