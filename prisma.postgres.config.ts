import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 configuration for the archived PostgreSQL multi-tenant variant.
 * Kept separate from the active MySQL config so either schema can be
 * generated or deployed without mixing datasources.
 */
export default defineConfig({
  schema: "prisma/postgres/schema.prisma",
  migrations: {
    path: "prisma/postgres/migrations",
  },
  datasource: {
    url: process.env.POSTGRES_DATABASE_URL ?? "",
  },
});
