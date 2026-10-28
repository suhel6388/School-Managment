import { route } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { alertsOnly } from "@/lib/dashboard";

export const GET = route(async () => {
  await requireUser();
  return { alerts: await alertsOnly() };
});
