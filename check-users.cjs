// Prisma ORM 7 generates the client as TypeScript, so this ad-hoc CJS check
// talks to MySQL through the same MariaDB driver the adapter uses.
require("dotenv").config({ quiet: true });
const bcrypt = require("bcryptjs");
const mariadb = require("mariadb");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");

  const pool = mariadb.createPool(url.replace(/^mysql:\/\//i, "mariadb://"));

  try {
    const users = await pool.query(
      "SELECT `username`, `active`, `role`, `passwordHash` FROM `app_users`",
    );

    for (const user of users) {
      console.log(
        user.username,
        "active=" + user.active,
        "role=" + user.role,
        "hashLen=" + user.passwordHash.length,
        "admin123=" + (await bcrypt.compare("admin123", user.passwordHash)),
        "teacher123=" + (await bcrypt.compare("teacher123", user.passwordHash)),
        "acc123=" + (await bcrypt.compare("acc123", user.passwordHash)),
      );
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
