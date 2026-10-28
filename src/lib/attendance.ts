import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { parseYmd, toYmd } from "./dates";

const STATUSES = ["Present", "Absent", "Late", "Half Day", "Holiday"];

export async function attendanceForDate(
  date: string,
  opts: { classId?: string; sectionId?: string; type?: "student" | "staff" },
) {
  const day = parseYmd(date);
  if (!day) throw new ApiError(422, "Date must be YYYY-MM-DD.");

  if (opts.type === "staff") {
    const [staff, attendance] = await Promise.all([
      prisma.staff.findMany({ where: { status: "active" }, orderBy: { name: "asc" } }),
      prisma.staffAttendance.findMany({ where: { date: day } }),
    ]);
    const map = new Map(attendance.map((a) => [a.staffId, a]));
    return {
      date,
      type: "staff",
      rows: staff.map((s) => ({
        id: s.id,
        code: s.empId,
        name: s.name,
        status: map.get(s.id)?.status ?? "",
        note: map.get(s.id)?.note ?? "",
      })),
      summary: summarize(attendance.map((a) => a.status)),
    };
  }

  const students = await prisma.student.findMany({
    where: {
      status: "active",
      ...(opts.classId ? { classId: opts.classId } : {}),
      ...(opts.sectionId ? { sectionId: opts.sectionId } : {}),
    },
    include: { class: true, section: true },
    orderBy: { name: "asc" },
  });
  const attendance = students.length
    ? await prisma.studentAttendance.findMany({
        where: { date: day, studentId: { in: students.map((s) => s.id) } },
      })
    : [];
  const map = new Map(attendance.map((a) => [a.studentId, a]));
  return {
    date,
    type: "student",
    rows: students.map((s) => ({
      id: s.id,
      code: s.admNo,
      name: s.name,
      className: s.class?.name ?? "",
      sectionName: s.section?.name ?? "",
      status: map.get(s.id)?.status ?? "",
      note: map.get(s.id)?.note ?? "",
    })),
    summary: summarize(attendance.map((a) => a.status)),
  };
}

function summarize(statuses: string[]) {
  return {
    marked: statuses.length,
    present: statuses.filter((s) => s === "Present").length,
    absent: statuses.filter((s) => s === "Absent").length,
    late: statuses.filter((s) => s === "Late" || s === "Half Day").length,
  };
}

export async function saveAttendance(input: {
  date: string;
  type: "student" | "staff";
  records: { id: string; status: string; note?: string }[];
  username: string;
}) {
  const day = parseYmd(input.date);
  if (!day) throw new ApiError(422, "Date must be YYYY-MM-DD.");
  if (!Array.isArray(input.records) || input.records.length === 0) {
    throw new ApiError(422, "No attendance rows were submitted.");
  }
  const seen = new Set<string>();
  for (const record of input.records) {
    if (!record.id) throw new ApiError(422, "Each attendance row needs a student or staff id.");
    if (seen.has(record.id)) throw new ApiError(422, "Duplicate attendance rows are not allowed.");
    seen.add(record.id);
    if (!STATUSES.includes(record.status)) {
      throw new ApiError(422, `Attendance status '${record.status}' is not valid.`);
    }
  }

  return prisma.$transaction(async (tx) => {
    if (input.type === "staff") {
      const count = await tx.staff.count({ where: { id: { in: input.records.map((r) => r.id) } } });
      if (count !== input.records.length) throw new ApiError(422, "One or more staff members do not exist.");
      for (const record of input.records) {
        await tx.staffAttendance.upsert({
          where: { staffId_date: { staffId: record.id, date: day } },
          create: { staffId: record.id, date: day, status: record.status, note: record.note ?? null },
          update: { status: record.status, note: record.note ?? null },
        });
      }
    } else {
      const count = await tx.student.count({
        where: { id: { in: input.records.map((r) => r.id) } },
      });
      if (count !== input.records.length) {
        throw new ApiError(422, "One or more students do not exist.");
      }
      for (const record of input.records) {
        await tx.studentAttendance.upsert({
          where: { studentId_date: { studentId: record.id, date: day } },
          create: {
            studentId: record.id,
            date: day,
            status: record.status,
            note: record.note ?? null,
          },
          update: { status: record.status, note: record.note ?? null },
        });
      }
    }
    await tx.auditLog.create({
      data: {
        user: input.username,
        act: "attendance",
        entity: input.type === "staff" ? "staffAttendance" : "studentAttendance",
        description: `${input.date} · ${input.records.length} records`,
      },
    });
    return { saved: input.records.length };
  });
}

export async function attendanceReport(classId: string, sectionId: string, month: string) {
  const start = parseYmd(`${month}-01`);
  if (!start) throw new ApiError(422, "Month must be YYYY-MM.");
  const [y, m] = month.split("-").map(Number);
  const end = new Date(Date.UTC(y, m, 0));
  const students = await prisma.student.findMany({
    where: {
      status: "active",
      ...(classId ? { classId } : {}),
      ...(sectionId ? { sectionId } : {}),
    },
    include: { class: true, section: true },
    orderBy: { name: "asc" },
  });
  const records = await prisma.studentAttendance.findMany({
    where: {
      studentId: { in: students.map((s) => s.id) },
      date: { gte: start, lte: end },
    },
  });
  return students.map((student) => {
    const own = records.filter((r) => r.studentId === student.id);
    const present = own.filter((r) => r.status === "Present").length;
    const absent = own.filter((r) => r.status === "Absent").length;
    const late = own.filter((r) => r.status === "Late" || r.status === "Half Day").length;
    return {
      admNo: student.admNo,
      name: student.name,
      className: student.class?.name ?? "",
      sectionName: student.section?.name ?? "",
      present,
      absent,
      late,
      percent: own.length ? Math.round((100 * present) / own.length) : 0,
      marked: own.length,
    };
  });
}

export async function todayAttendanceSummary() {
  const day = parseYmd(toYmd(new Date()));
  if (!day) return { marked: 0, present: 0, percent: null as number | null };
  const records = await prisma.studentAttendance.findMany({ where: { date: day } });
  if (!records.length) return { marked: 0, present: 0, percent: null as number | null };
  const present = records.filter((r) => r.status === "Present").length;
  return {
    marked: records.length,
    present,
    percent: Math.round((100 * present) / records.length),
  };
}

export type AttendanceRecord = Prisma.StudentAttendanceGetPayload<Record<string, never>>;
