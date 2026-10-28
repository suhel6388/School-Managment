import { route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seed";

export const POST = route(async () => {
  await requirePermission("sys");
  const result = await seedDatabase(prisma);
  return { ...result, reset: true };
});
