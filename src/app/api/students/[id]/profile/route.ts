import { prisma } from "@/lib/prisma";
import { route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { getStudentFees } from "@/lib/fees";
import { toYmd } from "@/lib/dates";
import { serializeModel } from "@/lib/dmmf";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, ctx: Ctx) => {
  await requirePermission("stu");
  const { id } = await ctx.params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: { class: true, section: true, category: true, house: true, disReason: true },
  });
  if (!student) throw new ApiError(404, "Student not found.");

  const [fees, attendance, results, leaves, payments, transport, hostel] = await Promise.all([
    getStudentFees(id),
    prisma.studentAttendance.findMany({
      where: { studentId: id },
      orderBy: { date: "desc" },
      take: 30,
    }),
    prisma.examResult.findMany({
      where: { studentId: id },
      include: { sched: { include: { subject: true, group: true } } },
      orderBy: { sched: { date: "desc" } },
      take: 60,
    }),
    prisma.studentLeave.findMany({ where: { studentId: id }, orderBy: { from: "desc" }, take: 10 }),
    prisma.payment.findMany({ where: { studentId: id }, orderBy: { date: "desc" }, take: 20 }),
    prisma.transportAssignment.findMany({
      where: { studentId: id },
      include: { route: true, pickup: true },
    }),
    prisma.hostelAllocation.findMany({
      where: { studentId: id },
      include: { room: { include: { hostel: true, type: true } } },
    }),
  ]);

  const marked = attendance.length;
  const present = attendance.filter((a) => a.status === "Present").length;

  return {
    student: serializeModel("Student", student),
    fees,
    attendance: {
      percent: marked ? Math.round((present / marked) * 100) : null,
      present,
      absent: attendance.filter((a) => a.status === "Absent").length,
      late: attendance.filter((a) => a.status === "Late" || a.status === "Half Day").length,
      recent: attendance.slice(0, 12).map((a) => ({ date: toYmd(a.date), status: a.status })),
    },
    results: results.map((r) => ({
      id: r.id,
      group: r.sched.group.name,
      subject: r.sched.subject.name,
      date: toYmd(r.sched.date),
      marks: Number(r.marks),
      max: r.sched.max,
      absent: r.absent,
    })),
    leaves: leaves.map((l) => ({
      id: l.id,
      from: toYmd(l.from),
      to: toYmd(l.to),
      reason: l.reason ?? "",
      status: l.status,
    })),
    payments: payments.map((p) => ({
      id: p.id,
      rc: p.rc,
      amount: Number(p.amount),
      mode: p.mode,
      date: toYmd(p.date),
      feeKey: p.feeKey,
    })),
    transport: transport.map((t) => ({
      id: t.id,
      route: t.route.name,
      pickup: t.pickup.name,
      due: t.due ? toYmd(t.due) : "",
    })),
    hostel: hostel.map((h) => ({
      id: h.id,
      hostel: h.room.hostel.name,
      room: h.room.roomNo,
      type: h.room.type.name,
      date: toYmd(h.date),
    })),
  };
});
