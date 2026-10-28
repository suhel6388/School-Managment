import { prisma } from "@/lib/prisma";
import { readJson, route } from "@/lib/http";
import { requireUser } from "@/lib/auth";
import { pendingFees } from "@/lib/fees";
import { todayAttendanceSummary } from "@/lib/attendance";
import { toYmd } from "@/lib/dates";

export const POST = route(async (req) => {
  await requireUser();
  const body = await readJson(req);
  const q = String(body.q ?? "").trim().toLowerCase();
  if (!q) return { answer: "Ask me about fees, students, staff, attendance, exams or events.", links: [] };

  const [students, staff, classes, pending, attendance, events] = await Promise.all([
    prisma.student.count({ where: { status: "active" } }),
    prisma.staff.count({ where: { status: "active" } }),
    prisma.schoolClass.findMany({ orderBy: { order: "asc" } }),
    pendingFees(),
    todayAttendanceSummary(),
    prisma.schoolEvent.findMany({ orderBy: { date: "asc" }, take: 5 }),
  ]);

  const links: { label: string; href: string }[] = [];

  if (/(pending|due|baki|outstanding|fee)/.test(q)) {
    const total = pending.reduce((s, p) => s + p.dueNow, 0);
    const top = pending
      .slice(0, 3)
      .map((p) => `${p.student.name} (₹${p.dueNow.toLocaleString("en-IN")})`)
      .join(", ");
    links.push({ label: "Open due fees", href: "/duefees" }, { label: "Collect fees", href: "/collect" });
    if (/collect|payment|receive/.test(q)) {
      return { answer: "Open Collect Fees to record a payment, or Due Fees for the full defaulters list.", links };
    }
    return {
      answer: `Pending fees are ₹${total.toLocaleString("en-IN")} from ${pending.length} students. Highest: ${top || "none"}.`,
      links,
    };
  }

  if (/(student|admission|class strength|enrol)/.test(q)) {
    links.push({ label: "Student list", href: "/students" }, { label: "New admission", href: "/admission" });
    const match = classes.find((c) => q.includes(c.name.toLowerCase()));
    if (match) {
      const count = await prisma.student.count({
        where: { classId: match.id, status: "active" },
      });
      return { answer: `${match.name} has ${count} active students.`, links };
    }
    return { answer: `There are ${students} active students across ${classes.length} classes.`, links };
  }

  if (/(staff|teacher|employee|payroll)/.test(q)) {
    links.push({ label: "Staff directory", href: "/staff" }, { label: "Payroll", href: "/payroll" });
    return { answer: `There are ${staff} active staff members. Payroll is generated from Human Resource → Payroll.`, links };
  }

  if (/(attendance|present|absent)/.test(q)) {
    links.push({ label: "Mark attendance", href: "/stuatt" }, { label: "Attendance report", href: "/attdate" });
    return {
      answer: attendance.marked
        ? `Today ${attendance.present} of ${attendance.marked} marked students are present (${attendance.percent}%).`
        : "Attendance has not been marked today yet.",
      links,
    };
  }

  if (/(event|calendar|holiday)/.test(q)) {
    links.push({ label: "Dashboard calendar", href: "/" });
    return {
      answer: events.length
        ? `Upcoming: ${events.map((e) => `${e.title} (${toYmd(e.date)})`).join(", ")}.`
        : "No upcoming events are scheduled.",
      links,
    };
  }

  if (/(exam|marks|result)/.test(q)) {
    links.push({ label: "Enter exam results", href: "/examresult" }, { label: "Print marksheets", href: "/marksprint" });
    return { answer: "Exam groups, schedules and marks are under Examinations. Enter marks in Exam Result, then print from Print Marksheet.", links };
  }

  links.push({ label: "Dashboard", href: "/" }, { label: "Reports", href: "/rep_student" });
  return {
    answer: "I can help with fees, admissions, attendance, staff, exams and events. Try “pending fees”, “class 5 strength” or “today attendance”.",
    links,
  };
});
