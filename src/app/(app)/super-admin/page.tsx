import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import { SuperAdminView } from "@/components/super-admin/SuperAdminView";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  if (!isSuperAdmin(user)) {
    redirect("/");
  }

  return <SuperAdminView currentUser={user} />;
}

