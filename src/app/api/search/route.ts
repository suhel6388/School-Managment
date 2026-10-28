import { prisma } from "@/lib/prisma";
import { route } from "@/lib/http";
import { requireUser } from "@/lib/auth";

export const GET = route(async (req) => {
  await requireUser();
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return { results: [] };

  const [students, staff, books, payments] = await Promise.all([
    prisma.student.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { admNo: { contains: q } },
          { phone: { contains: q } },
          { father: { contains: q } },
        ],
      },
      include: { class: true, section: true },
      take: 6,
    }),
    prisma.staff.findMany({
      where: { OR: [{ name: { contains: q } }, { empId: { contains: q } }] },
      take: 4,
    }),
    prisma.book.findMany({
      where: { OR: [{ title: { contains: q } }, { author: { contains: q } }] },
      take: 4,
    }),
    prisma.payment.findMany({
      where: { rc: { contains: q } },
      include: { student: true },
      take: 4,
    }),
  ]);

  return {
    results: [
      ...students.map((s) => ({
        type: "Student",
        label: s.name,
        sub: `${s.admNo} · ${s.class?.name ?? ""}${s.section ? ` (${s.section.name})` : ""}`,
        href: `/students?open=${s.id}`,
      })),
      ...staff.map((s) => ({
        type: "Staff",
        label: s.name,
        sub: `${s.empId}`,
        href: `/staff?open=${s.id}`,
      })),
      ...books.map((b) => ({
        type: "Book",
        label: b.title,
        sub: b.author ?? "",
        href: `/books?open=${b.id}`,
      })),
      ...payments.map((p) => ({
        type: "Receipt",
        label: p.rc,
        sub: `${p.student.name} · ₹${Number(p.amount).toFixed(2)}`,
        href: `/feesearch?q=${p.rc}`,
      })),
    ],
  };
});
