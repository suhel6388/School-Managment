import { prisma } from "@/lib/prisma";
import { query, route } from "@/lib/http";
import { requireSchoolPermission, validateSameSchool, modelHasSchoolId } from "@/lib/tenant";
import { ApiError } from "@/lib/errors";
import { toYmd } from "@/lib/dates";

export const GET = route(async (req) => {
  const context = await requireSchoolPermission("exam.read");
  const schoolId = context.school.id;
  const params = query(req);
  const groupId = params.get("groupId") ?? "";
  const classId = params.get("classId") ?? "";
  const sectionId = params.get("sectionId") ?? "";
  if (!groupId || !classId) throw new ApiError(422, "Choose an exam group and class.");

  await validateSameSchool(schoolId, [
    { model: "ExamGroup", id: groupId },
    { model: "SchoolClass", id: classId },
    ...(sectionId ? [{ model: "Section", id: sectionId }] : []),
  ]);

  const scheduleWhere: Record<string, unknown> = { groupId, classId };
  if (schoolId && modelHasSchoolId("ExamSchedule")) scheduleWhere.schoolId = schoolId;

  const studentWhere: Record<string, unknown> = {
    classId,
    status: "active",
    ...(sectionId ? { sectionId } : {}),
  };
  if (schoolId && modelHasSchoolId("Student")) studentWhere.schoolId = schoolId;

  const gradeWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("Grade")) gradeWhere.schoolId = schoolId;

  const divisionWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("Division")) divisionWhere.schoolId = schoolId;

  const [schedules, students, grades, divisions] = await Promise.all([
    prisma.examSchedule.findMany({
      where: scheduleWhere,
      include: { subject: true },
      orderBy: { date: "asc" },
    }),
    prisma.student.findMany({
      where: studentWhere,
      orderBy: { name: "asc" },
    }),
    prisma.grade.findMany({ where: gradeWhere, orderBy: { from: "desc" } }),
    prisma.division.findMany({ where: divisionWhere, orderBy: { from: "desc" } }),
  ]);

  const scopedStudents = schoolId
    ? students.filter((s: Record<string, unknown>) => !s.schoolId || s.schoolId === schoolId)
    : students;
  const scopedSchedules = schoolId
    ? schedules.filter((s: Record<string, unknown>) => !s.schoolId || s.schoolId === schoolId)
    : schedules;

  const results = scopedSchedules.length
    ? await prisma.examResult.findMany({
        where: { schedId: { in: scopedSchedules.map((s) => s.id) } },
      })
    : [];

  return {
    schedules: scopedSchedules.map((s) => ({
      id: s.id,
      subject: s.subject.name,
      subjectId: s.subjectId,
      date: toYmd(s.date),
      time: s.time ?? "",
      max: s.max,
      pass: s.pass,
    })),
    students: scopedStudents.map((s) => ({
      id: s.id,
      name: s.name,
      admNo: s.admNo,
      rollNo: s.rollNo ?? "",
    })),
    results: results.map((r) => ({
      id: r.id,
      scheduleId: r.schedId,
      studentId: r.studentId,
      marks: r.marks === null ? null : Number(r.marks),
      absent: r.absent,
    })),
    grades: grades.map((g) => ({
      name: g.name,
      from: Number(g.from),
      to: Number(g.to),
      point: g.point,
    })),
    divisions: divisions.map((d) => ({
      name: d.name,
      from: Number(d.from),
      to: Number(d.to),
    })),
  };
});
