const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function main() {
  const p = new PrismaClient();
  const users = await p.appUser.findMany();
  for (const u of users) {
    console.log(
      u.username,
      "active=" + u.active,
      "role=" + u.role,
      "hashLen=" + u.passwordHash.length,
      "admin123=" + (await bcrypt.compare("admin123", u.passwordHash)),
      "teacher123=" + (await bcrypt.compare("teacher123", u.passwordHash)),
      "acc123=" + (await bcrypt.compare("acc123", u.passwordHash)),
    );
  }
  await p.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
