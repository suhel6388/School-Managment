import { redirect } from "next/navigation";
import { getSessionUser, rolePermissions } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { uiPermissionsForRole } from "@/lib/permissions";
import { resolveSchoolContext } from "@/lib/tenant";
import { getBetterAuthIdentity } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { ToastProvider } from "@/components/ToastProvider";
import { LookupProvider } from "@/components/LookupProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const settings = await getSettings();
  const perms =
    user.source === "better-auth"
      ? uiPermissionsForRole(user.role)
      : await rolePermissions(user.role);

  let school = { name: settings.name, session: settings.session };
  if (user.source === "better-auth") {
    try {
      const context = await resolveSchoolContext();
      if (context) school = { name: context.school.name, session: settings.session };
    } catch {
      const identity = await getBetterAuthIdentity();
      if (
        identity &&
        identity.memberships.length === 0 &&
        user.role !== "Admin" &&
        user.role !== "super_admin"
      ) {
        redirect("/onboarding");
      }
    }
  }

  return (
    <ToastProvider>
      <LookupProvider>
        <AppShell
          user={{ username: user.username, name: user.name, role: user.role }}
          perms={perms}
          school={school}
        >
          {children}
        </AppShell>
      </LookupProvider>
    </ToastProvider>
  );
}
