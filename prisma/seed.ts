import "dotenv/config";
import { createPrismaClient } from "../src/lib/prisma-client";
import { seedDatabase } from "../src/lib/seed";

const prisma = createPrismaClient();

seedDatabase(prisma)
  .then((result) => {
    console.log(`Seed complete: ${result.students} students, demo fees, staff, exams and settings.`);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
