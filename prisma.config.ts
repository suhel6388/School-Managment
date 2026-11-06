import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 configuration for the active MySQL multi-tenant schema.
 *
 * Prisma ORM 7 no longer loads `.env` files automatically, so `dotenv/config`
 * is imported explicitly here. `process.env` (rather than the throwing `env()`
 * helper) is used so that `prisma generate` still works in CI environments
 * where no database URL is available.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
