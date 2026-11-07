import { prisma } from "@/lib/prisma";
import { route } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { resolveSchoolContext, modelHasSchoolId } from "@/lib/tenant";

export const GET = route(async (req) => {
  await requireUser();
  const tenantCtx = await resolveSchoolContext();
  const schoolId = tenantCtx?.school.id;

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return { results: [] };

  const studentWhere: Record<string, unknown> = {
    OR: [
      { name: { contains: q } },
      { admNo: { contains: q } },
      { phone: { contains: q } },
      { father: { contains: q } },
    ],
  };
  if (schoolId && modelHasSchoolId("Student")) {
    studentWhere.schoolId = schoolId;
  }

  const staffWhere: Record<string, unknown> = {
    OR: [{ name: { contains: q } }, { empId: { contains: q } }],
  };
  if (schoolId && modelHasSchoolId("Staff")) {
    staffWhere.schoolId = schoolId;
  }

  const bookWhere: Record<string, unknown> = {
    OR: [{ title: { contains: q } }, { author: { contains: q } }],
  };
  if (schoolId && modelHasSchoolId("Book")) {
    bookWhere.schoolId = schoolId;
  }

  const paymentWhere: Record<string, unknown> = {
    rc: { contains: q },
  };
  if (schoolId && modelHasSchoolId("Payment")) {
    paymentWhere.schoolId = schoolId;
  }

  const [students, staff, books, payments] = await Promise.all([
    prisma.student.findMany({
      where: studentWhere,
      include: { class: true, section: true },
      take: 6,
    }),
    prisma.staff.findMany({
      where: staffWhere,
      take: 4,
    }),
    prisma.book.findMany({
      where: bookWhere,
      take: 4,
    }),
    prisma.payment.findMany({
      where: paymentWhere,
      include: { student: true },
      take: 4,
    }),
  ]);

  // Defense-in-depth: exclude any record tagged with a foreign schoolId
  const scopedStudents = schoolId
    ? students.filter((s: Record<string, unknown>) => !s.schoolId || s.schoolId === schoolId)
    : students;
  const scopedStaff = schoolId
    ? staff.filter((s: Record<string, unknown>) => !s.schoolId || s.schoolId === schoolId)
    : staff;
  const scopedBooks = schoolId
    ? books.filter((b: Record<string, unknown>) => !b.schoolId || b.schoolId === schoolId)
    : books;
  const scopedPayments = schoolId
    ? payments.filter((p: Record<string, unknown>) => !p.schoolId || p.schoolId === schoolId)
    : payments;

  return {
    results: [
      ...scopedStudents.map((s) => ({
        type: "Student",
        label: s.name,
        sub: `${s.admNo} · ${s.class?.name ?? ""}${s.section ? ` (${s.section.name})` : ""}`,
        href: `/students?open=${s.id}`,
      })),
      ...scopedStaff.map((s) => ({
        type: "Staff",
        label: s.name,
        sub: `${s.empId}`,
        href: `/staff?open=${s.id}`,
      })),
      ...scopedBooks.map((b) => ({
        type: "Book",
        label: b.title,
        sub: b.author ?? "",
        href: `/books?open=${b.id}`,
      })),
      ...scopedPayments.map((p) => ({
        type: "Receipt",
        label: p.rc,
        sub: `${p.student.name} · ₹${Number(p.amount).toFixed(2)}`,
        href: `/feesearch?q=${p.rc}`,
      })),
    ],
  };
});
