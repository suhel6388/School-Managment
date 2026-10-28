import { query, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { audienceOptions, getRecipients } from "@/lib/communications";

export const GET = route(async (req) => {
  await requirePermission("comm");
  const params = query(req);
  const audience = params.get("audience") ?? "";
  const [options, recipients] = await Promise.all([
    audienceOptions(),
    audience ? getRecipients(audience) : Promise.resolve([]),
  ]);
  return { ...options, recipients: recipients.slice(0, 50), count: recipients.length };
});
