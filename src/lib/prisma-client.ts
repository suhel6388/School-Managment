import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Prisma, PrismaClient } from "../generated/prisma-legacy/client";

export { Prisma, PrismaClient };

type PrismaClientOptions = {
  log?: Array<Prisma.LogLevel | Prisma.LogDefinition>;
};

/**
 * Prisma ORM 7 requires a driver adapter. The MariaDB connector speaks the
 * MySQL protocol, and its connection-string parser expects a `mariadb://`
 * scheme, so the application's `mysql://` URL is rewritten here.
 *
 * This gateway currently points at the legacy single-tenant client so the
 * running application keeps working during the multi-tenant transition. At
 * cutover, change the import above to `../generated/prisma/client`.
 */
export function createPrismaClient(
  options: PrismaClientOptions = {},
): PrismaClient {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not set.");
  }

  const adapter = new PrismaMariaDb(url.replace(/^mysql:\/\//i, "mariadb://"));

  return new PrismaClient({ adapter, ...options });
}
