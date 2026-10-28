import { prisma } from "@/lib/prisma";
import { query, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { toYmd } from "@/lib/dates";

export const GET = route(async (req) => {
  await requirePermission("exam");
  const params = query(req);
  const groupId = params.get("groupId") ?? "";
  const classId = params.get("classId") ?? "";
  const sectionId = params.get("sectionId") ?? "";
  if (!groupId || !classId) throw new ApiError(422, "Choose an exam group and class.");

  const [schedules, students, grades, divisions] = await Promise.all([
    prisma.examSchedule.findMany({
      where: { groupId, classId },
      include: { subject: true },
      orderBy: { date: "asc" },
    }),
    prisma.student.findMany({
      where: { classId, status: "active", ...(sectionId ? { sectionId } : {}) },
      orderBy: { name: "asc" },
    }),
    prisma.grade.findMany({ orderBy: { from: "desc" } }),
    prisma.division.findMany({ orderBy: { from: "desc" } }),
  ]);

  const results = schedules.length
    ? await prisma.examResult.findMany({
        where: { schedId: { in: schedules.map((s) => s.id) } },
      })
    : [];

  return {
    schedules: schedules.map((s) => ({
      id: s.id,
      subject: s.subject.name,
      subjectId: s.subjectId,
      date: toYmd(s.date),
      time: s.time ?? "",
      max: s.max,
      pass: s.pass,
    })),
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      admNo: s.admNo,
      rollNo: s.rollNo ?? "",
    })),
    results: Object.fromEntries(
      results.map((r) => [
        `${r.schedId}|${r.studentId}`,
        { marks: Number(r.marks), absent: r.absent },
      ]),
    ),
    grades: grades.map((g) => ({
      name: g.name,
      from: Number(g.from),
      to: Number(g.to),
      point: g.point,
      remark: g.remark ?? "",
    })),
    divisions: divisions.map((d) => ({ name: d.name, from: Number(d.from), to: Number(d.to) })),
  };
});
