import { route } from "@/lib/http";
import { requireSuperAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seed";

export const POST = route(async () => {
  await requireSuperAdmin();
  const result = await seedDatabase(prisma);
  return { ...result, reset: true };
});
