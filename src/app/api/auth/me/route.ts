import { route } from "@/lib/http";
import { getSessionUser, rolePermissions } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const GET = route(async () => {
  const user = await getSessionUser();
  if (!user) return { user: null };
  const [perms, settings] = await Promise.all([rolePermissions(user.role), getSettings()]);
  return {
    user,
    perms,
    school: { name: settings.name, session: settings.session, address: settings.address },
  };
});
