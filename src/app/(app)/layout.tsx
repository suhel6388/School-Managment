import { redirect } from "next/navigation";
import { getSessionUser, rolePermissions } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AppShell } from "@/components/AppShell";
import { ToastProvider } from "@/components/ToastProvider";
import { LookupProvider } from "@/components/LookupProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const [perms, settings] = await Promise.all([rolePermissions(user.role), getSettings()]);
  return (
    <ToastProvider>
      <LookupProvider>
        <AppShell
          user={{ username: user.username, name: user.name, role: user.role }}
          perms={perms}
          school={{ name: settings.name, session: settings.session }}
        >
          {children}
        </AppShell>
      </LookupProvider>
    </ToastProvider>
  );
}
