import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  const settings = await getSettings().catch(() => null);
  return (
    <LoginForm
      school={{
        name: settings?.name ?? "ICE School",
        session: settings?.session ?? "2026-27",
      }}
    />
  );
}
