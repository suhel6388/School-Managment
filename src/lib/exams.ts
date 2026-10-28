import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { toYmd } from "./dates";

type Grade = { name: string; from: number; to: number; point: number; remark: string };
type Division = { name: string; from: number; to: number };

export type Marksheet = {
  studentId: string;
  name: string;
  admNo: string;
  rollNo: string;
  className: string;
  sectionName: string;
  father: string;
  rows: {
    scheduleId: string;
    subject: string;
    date: string;
    max: number;
    pass: number;
    marks: number | null;
    absent: boolean;
    grade: string;
  }[];
  max: number;
  got: number;
  pct: number;
  fail: boolean;
  grade: string;
  division: string;
  rank: number;
};

function pctOf(got: number, max: number): number {
  return max > 0 ? Math.round((got / max) * 10000) / 100 : 0;
}

function gradeOf(grades: Grade[], pct: number): Grade {
  return (
    grades.find((g) => pct >= g.from && pct <= g.to) ?? {
      name: "-",
      from: 0,
      to: 0,
      point: 0,
      remark: "",
    }
  );
}

function divisionOf(divisions: Division[], pct: number): string {
  return divisions.find((d) => pct >= d.from && pct <= d.to)?.name ?? "-";
}

export async function loadExamMeta() {
  const [grades, divisions] = await Promise.all([
    prisma.grade.findMany({ orderBy: { from: "desc" } }),
    prisma.division.findMany({ orderBy: { from: "desc" } }),
  ]);
  return {
    grades: grades.map((g) => ({
      name: g.name,
      from: Number(g.from),
      to: Number(g.to),
      point: g.point,
      remark: g.remark ?? "",
    })),
    divisions: divisions.map((d) => ({ name: d.name, from: Number(d.from), to: Number(d.to) })),
  };
}

export async function marksheetsForClass(
  groupId: string,
  classId: string,
  sectionId?: string,
): Promise<Marksheet[]> {
  const [grades, divisions, students, schedules] = await Promise.all([
    prisma.grade.findMany({ orderBy: { from: "desc" } }),
    prisma.division.findMany({ orderBy: { from: "desc" } }),
    prisma.student.findMany({
      where: { classId, status: "active", ...(sectionId ? { sectionId } : {}) },
      include: { class: true, section: true },
      orderBy: { name: "asc" },
    }),
    prisma.examSchedule.findMany({
      where: { groupId, classId },
      include: { subject: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const results = schedules.length
    ? await prisma.examResult.findMany({
        where: { schedId: { in: schedules.map((s) => s.id) } },
      })
    : [];
  const resultMap = new Map(results.map((r) => [`${r.schedId}|${r.studentId}`, r]));

  const gradeList: Grade[] = grades.map((g) => ({
    name: g.name,
    from: Number(g.from),
    to: Number(g.to),
    point: g.point,
    remark: g.remark ?? "",
  }));
  const divisionList: Division[] = divisions.map((d) => ({
    name: d.name,
    from: Number(d.from),
    to: Number(d.to),
  }));

  const sheets = students.map((student) => {
    const rows = schedules.map((s) => {
      const result = resultMap.get(`${s.id}|${student.id}`);
      const marks = result ? Number(result.marks) : null;
      const absent = result?.absent ?? false;
      const pct = marks === null ? 0 : pctOf(marks, s.max);
      return {
        scheduleId: s.id,
        subject: s.subject.name,
        date: toYmd(s.date),
        max: s.max,
        pass: s.pass,
        marks,
        absent,
        grade: marks === null || absent ? "-" : gradeOf(gradeList, pct).name,
      };
    });
    const max = rows.reduce((t, r) => t + r.max, 0);
    const got = rows.reduce((t, r) => t + (r.marks ?? 0), 0);
    const pct = pctOf(got, max);
    const fail = rows.some((r) => r.marks === null || r.absent || r.marks < r.pass);
    return {
      studentId: student.id,
      name: student.name,
      admNo: student.admNo,
      rollNo: student.rollNo ?? "",
      className: student.class?.name ?? "",
      sectionName: student.section?.name ?? "",
      father: student.father ?? "",
      rows,
      max,
      got,
      pct,
      fail,
      grade: gradeOf(gradeList, pct).name,
      division: fail ? "Fail" : divisionOf(divisionList, pct),
      rank: 0,
    };
  });

  const ranking = sheets
    .filter((s) => s.rows.length > 0)
    .slice()
    .sort((a, b) => b.got - a.got);
  ranking.forEach((sheet, index) => {
    sheet.rank = index + 1;
  });

  return sheets.sort((a, b) => {
    const ac = a.className.localeCompare(b.className);
    if (ac !== 0) return ac;
    return a.name.localeCompare(b.name);
  });
}

export async function getMarksheets(groupId: string, classId: string, studentIds?: string[]) {
  const sheets = await marksheetsForClass(groupId, classId);
  if (studentIds?.length) {
    const wanted = new Set(studentIds);
    return sheets.filter((s) => wanted.has(s.studentId));
  }
  return sheets;
}

export async function saveExamResults(
  scheduleId: string,
  records: { studentId: string; marks: number | null; absent: boolean }[],
) {
  const schedule = await prisma.examSchedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) throw new ApiError(404, "Exam schedule not found.");

  const seen = new Set<string>();
  for (const record of records) {
    if (!record.studentId || seen.has(record.studentId)) {
      throw new ApiError(422, "Each student may only appear once.");
    }
    seen.add(record.studentId);
    if (record.marks !== null) {
      if (!Number.isFinite(record.marks) || record.marks < 0) {
        throw new ApiError(422, "Marks must be zero or greater.");
      }
      if (record.marks > schedule.max) {
        throw new ApiError(422, `Marks cannot be more than the maximum of ${schedule.max}.`);
      }
    }
  }

  return prisma.$transaction(async (tx) => {
    const valid = await tx.student.count({
      where: { id: { in: records.map((r) => r.studentId) }, classId: schedule.classId },
    });
    if (valid !== records.length) {
      throw new ApiError(422, "Marks can only be entered for students of this exam's class.");
    }
    let saved = 0;
    for (const record of records) {
      await tx.examResult.upsert({
        where: {
          schedId_studentId: { schedId: scheduleId, studentId: record.studentId },
        },
        create: {
          schedId: scheduleId,
          studentId: record.studentId,
          marks: new Prisma.Decimal(record.absent ? 0 : (record.marks ?? 0)),
          absent: record.absent,
        },
        update: {
          marks: new Prisma.Decimal(record.absent ? 0 : (record.marks ?? 0)),
          absent: record.absent,
        },
      });
      saved++;
    }
    return { saved };
  });
}

export async function admitCardData(groupId: string, classId: string, studentIds: string[]) {
  const [group, template, schedules, students] = await Promise.all([
    prisma.examGroup.findUnique({ where: { id: groupId } }),
    prisma.admitTemplate.findUnique({ where: { id: 1 } }),
    prisma.examSchedule.findMany({
      where: { groupId, classId },
      include: { subject: true },
      orderBy: { date: "asc" },
    }),
    prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: { class: true, section: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!group) throw new ApiError(404, "Exam group not found.");
  return {
    group: group.name,
    template: template ?? {
      title: "ADMIT CARD",
      exam: "",
      instructions: "",
      sign: "Principal",
    },
    schedules: schedules.map((s) => ({
      date: toYmd(s.date),
      subject: s.subject.name,
      time: s.time ?? "",
      room: s.room ?? "",
    })),
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      admNo: s.admNo,
      rollNo: s.rollNo ?? "",
      className: s.class?.name ?? "",
      sectionName: s.section?.name ?? "",
    })),
  };
}
