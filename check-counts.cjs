const { PrismaClient } = require("@prisma/client");
async function main() {
  const p = new PrismaClient();
  const [users, students, roles, logs, settings] = await Promise.all([
    p.appUser.count(),
    p.student.count(),
    p.role.count(),
    p.userLog.count(),
    p.setting.count(),
  ]);
  console.log({ users, students, roles, logs, settings });
  const list = await p.appUser.findMany({ select: { username: true, active: true, role: true } });
  console.log(list);
  await p.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
