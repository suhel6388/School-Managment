// Prisma ORM 7 generates the client as TypeScript, so these ad-hoc CJS checks
// talk to MySQL through the same MariaDB driver the adapter uses.
require("dotenv").config({ quiet: true });
const mariadb = require("mariadb");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");

  const pool = mariadb.createPool(url.replace(/^mysql:\/\//i, "mariadb://"));

  try {
    const [users, students, roles, logs, settings] = await Promise.all([
      pool.query("SELECT COUNT(*) AS c FROM `app_users`"),
      pool.query("SELECT COUNT(*) AS c FROM `students`"),
      pool.query("SELECT COUNT(*) AS c FROM `Role`"),
      pool.query("SELECT COUNT(*) AS c FROM `user_logs`"),
      pool.query("SELECT COUNT(*) AS c FROM `settings`"),
    ]);

    console.log({
      users: Number(users[0].c),
      students: Number(students[0].c),
      roles: Number(roles[0].c),
      logs: Number(logs[0].c),
      settings: Number(settings[0].c),
    });

    const list = await pool.query(
      "SELECT `username`, `active`, `role` FROM `app_users`",
    );
    console.log(list);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
