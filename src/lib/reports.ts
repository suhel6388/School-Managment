import { prisma } from "./prisma";
import { pendingFees, loadAllFeeData } from "./fees";
import { attendanceReport } from "./attendance";
import { marksheetsForClass } from "./exams";
import { dmy, monthEnd, monthStart, parseYmd, toYmd, todayYmd } from "./dates";
import { resolveSchoolContext, modelHasSchoolId, withTenantFilter } from "./tenant";

type Cell = string | number;
export type ReportResult = {
  title: string;
  sum: [string, Cell][];
  cols: string[];
  rows: Cell[][];
};

function range(from?: string, to?: string): { gte: Date; lte: Date } {
  const now = new Date();
  const start = from ? parseYmd(from) : new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const end = to ? parseYmd(to) : new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));
  return { gte: start!, lte: end! };
}

const money = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export async function getReport(
  type: string,
  params: URLSearchParams,
  tenantSchoolId?: string,
): Promise<ReportResult> {
  const schoolId = tenantSchoolId ?? (await resolveSchoolContext())?.school.id;
  switch (type) {
    case "student":
      return studentReport(params, schoolId);
    case "finance":
      return financeReport(params, schoolId);
    case "attendance":
      return attendanceReportView(params, schoolId);
    case "exam":
      return examReport(params, schoolId);
    case "online":
      return onlineReport(schoolId);
    case "lesson":
      return lessonReport(schoolId);
    case "hr":
      return hrReport(params, schoolId);
    case "homework":
      return homeworkReport(schoolId);
    case "library":
      return libraryReport(schoolId);
    case "inventory":
      return inventoryReport(schoolId);
    case "transport":
      return transportReport(schoolId);
    case "hostel":
      return hostelReport(schoolId);
    case "alumni":
      return alumniReport(schoolId);
    case "userlog":
      return userLogReport(schoolId);
    case "audit":
      return auditReport(schoolId);
    default:
      throw new Error("Unknown report");
  }
}

async function studentReport(params: URLSearchParams, schoolId?: string): Promise<ReportResult> {
  const classId = params.get("classId") ?? "";
  const sectionId = params.get("sectionId") ?? "";
  const q = (params.get("q") ?? "").toLowerCase();
  const where: Record<string, unknown> = {
    status: "active",
    ...(classId ? { classId } : {}),
    ...(sectionId ? { sectionId } : {}),
  };
  if (schoolId && modelHasSchoolId("Student")) {
    where.schoolId = schoolId;
  }
  const students = await prisma.student.findMany({
    where,
    include: { class: true, section: true, category: true, house: true },
    orderBy: { name: "asc" },
  });
  const scopedStudents = schoolId
    ? students.filter((s: Record<string, unknown>) => !s.schoolId || s.schoolId === schoolId)
    : students;
  const filtered = scopedStudents.filter(
    (s) => !q || `${s.name} ${s.admNo} ${s.father ?? ""}`.toLowerCase().includes(q),
  );
  return {
    title: "Student information report",
    sum: [
      ["Students", filtered.length],
      ["Boys", filtered.filter((s) => s.gender === "Male").length],
      ["Girls", filtered.filter((s) => s.gender === "Female").length],
    ],
    cols: ["Adm No", "Name", "Class", "Gender", "Category", "House", "Father", "Phone"],
    rows: filtered.map((s) => [
      s.admNo,
      s.name,
      `${s.class?.name ?? ""}${s.section ? ` (${s.section.name})` : ""}`,
      s.gender,
      s.category?.name ?? "—",
      s.house?.name ?? "—",
      s.father ?? "—",
      s.phone ?? "—",
    ]),
  };
}

async function financeReport(params: URLSearchParams, schoolId?: string): Promise<ReportResult> {
  const { gte, lte } = range(params.get("from") ?? undefined, params.get("to") ?? undefined);
  const paymentWhere: Record<string, unknown> = { date: { gte, lte } };
  const expenseWhere: Record<string, unknown> = { date: { gte, lte } };
  if (schoolId && modelHasSchoolId("Payment")) paymentWhere.schoolId = schoolId;
  if (schoolId && modelHasSchoolId("Expense")) expenseWhere.schoolId = schoolId;
  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({ where: paymentWhere }),
    prisma.expense.findMany({ where: expenseWhere }),
  ]);
  const scopedPayments = schoolId
    ? payments.filter((p: Record<string, unknown>) => !p.schoolId || p.schoolId === schoolId)
    : payments;
  const scopedExpenses = schoolId
    ? expenses.filter((e: Record<string, unknown>) => !e.schoolId || e.schoolId === schoolId)
    : expenses;
  const months = Array.from(
    new Set([
      ...scopedPayments.map((p) => toYmd(p.date).slice(0, 7)),
      ...scopedExpenses.map((e) => toYmd(e.date).slice(0, 7)),
    ]),
  ).sort();
  const rows = months.map((m) => {
    const income = scopedPayments
      .filter((p) => toYmd(p.date).startsWith(m))
      .reduce((s, p) => s + Number(p.amount) + Number(p.fine), 0);
    const spent = scopedExpenses
      .filter((e) => toYmd(e.date).startsWith(m))
      .reduce((s, e) => s + Number(e.amount), 0);
    return [m, money(income), money(spent), money(income - spent)];
  });
  const collected = scopedPayments.reduce((s, p) => s + Number(p.amount) + Number(p.fine), 0);
  const spent = scopedExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const pending = await pendingFees();
  return {
    title: "Finance report",
    sum: [
      ["Fees collected", money(collected)],
      ["Expenses", money(spent)],
      ["Net", money(collected - spent)],
      ["Outstanding dues", money(pending.reduce((s, p) => s + p.dueNow, 0))],
    ],
    cols: ["Month", "Income", "Expenses", "Net"],
    rows,
  };
}

async function attendanceReportView(params: URLSearchParams, _schoolId?: string): Promise<ReportResult> {
  const month = params.get("month") || todayYmd().slice(0, 7);
  const classId = params.get("classId") ?? "";
  const sectionId = params.get("sectionId") ?? "";
  const rows = await attendanceReport(classId, sectionId, month);
  return {
    title: "Attendance report",
    sum: [
      ["Students", rows.length],
      ["Month", month],
    ],
    cols: ["Adm No", "Name", "Class", "Present", "Absent", "Late / half", "Attendance %"],
    rows: rows.map((r) => [
      r.admNo,
      r.name,
      `${r.className}${r.sectionName ? ` (${r.sectionName})` : ""}`,
      r.present,
      r.absent,
      r.late,
      r.marked ? `${r.percent}%` : "—",
    ]),
  };
}

async function examReport(params: URLSearchParams, _schoolId?: string): Promise<ReportResult> {
  const groupId = params.get("groupId") ?? "";
  const classId = params.get("classId") ?? "";
  if (!groupId || !classId) {
    return {
      title: "Examination report (rank list)",
      sum: [["Select an exam group and class", ""]],
      cols: ["Rank", "Student", "Total", "Max", "Percent", "Grade", "Result"],
      rows: [],
    };
  }
  const sheets = (await marksheetsForClass(groupId, classId))
    .filter((s) => s.rows.length)
    .sort((a, b) => b.got - a.got);
  sheets.forEach((s, i) => {
    s.rank = i + 1;
  });
  return {
    title: "Examination report (rank list)",
    sum: [
      ["Students", sheets.length],
      ["Pass", sheets.filter((s) => !s.fail).length],
      ["Fail", sheets.filter((s) => s.fail).length],
    ],
    cols: ["Rank", "Student", "Total", "Max", "Percent", "Grade", "Result"],
    rows: sheets.map((s) => [
      s.rank,
      s.name,
      s.got,
      s.max,
      `${s.pct.toFixed(1)}%`,
      s.grade,
      s.fail ? "Fail" : "Pass",
    ]),
  };
}

async function onlineReport(_schoolId?: string): Promise<ReportResult> {
  const results = await prisma.onlineExamResult.findMany({
    include: { exam: true, student: true },
    orderBy: { date: "desc" },
  });
  return {
    title: "Online examinations report",
    sum: [["Attempts", results.length]],
    cols: ["Exam", "Student", "Score", "Percent", "Date"],
    rows: results.map((r) => [
      r.exam.title,
      r.student.name,
      `${r.score} / ${r.total}`,
      `${Number(r.pct).toFixed(0)}%`,
      dmy(toYmd(r.date)),
    ]),
  };
}

async function lessonReport(_schoolId?: string): Promise<ReportResult> {
  const lessons = await prisma.lesson.findMany({
    include: { class: true, subject: true, topics: true },
    orderBy: { name: "asc" },
  });
  return {
    title: "Lesson plan report",
    sum: [["Lessons", lessons.length]],
    cols: ["Class", "Subject", "Lesson", "Topics", "Completed", "Progress"],
    rows: lessons.map((l) => {
      const done = l.topics.filter((t) => t.status === "Completed").length;
      return [
        l.class?.name ?? "—",
        l.subject?.name ?? "—",
        l.name,
        l.topics.length,
        done,
        l.topics.length ? `${Math.round((100 * done) / l.topics.length)}%` : "0%",
      ];
    }),
  };
}

async function hrReport(params: URLSearchParams, schoolId?: string): Promise<ReportResult> {
  const month = params.get("month") || todayYmd().slice(0, 7);
  const staffWhere: Record<string, unknown> = { status: "active" };
  const attWhere: Record<string, unknown> = { date: { gte: monthStart(month), lte: monthEnd(month) } };
  const payWhere: Record<string, unknown> = { month };
  if (schoolId && modelHasSchoolId("Staff")) staffWhere.schoolId = schoolId;
  if (schoolId && modelHasSchoolId("StaffAttendance")) attWhere.schoolId = schoolId;
  if (schoolId && modelHasSchoolId("Payroll")) payWhere.schoolId = schoolId;
  const [staff, attendance, payroll] = await Promise.all([
    prisma.staff.findMany({
      where: staffWhere,
      include: { designation: true },
      orderBy: { name: "asc" },
    }),
    prisma.staffAttendance.findMany({
      where: attWhere,
    }),
    prisma.payroll.findMany({ where: payWhere }),
  ]);
  const scopedStaff = schoolId
    ? staff.filter((s: Record<string, unknown>) => !s.schoolId || s.schoolId === schoolId)
    : staff;
  const paid = payroll.filter((p) => p.status === "Paid").reduce((s, p) => s + Number(p.net), 0);
  return {
    title: "Human resource report",
    sum: [
      ["Active staff", scopedStaff.length],
      ["Payroll paid", money(paid)],
    ],
    cols: ["Emp ID", "Name", "Designation", "Present", "Absent", "Net pay", "Pay status"],
    rows: scopedStaff.map((s) => {
      const own = attendance.filter((a) => a.staffId === s.id);
      const p = payroll.find((x) => x.staffId === s.id);
      return [
        s.empId,
        s.name,
        s.designation?.name ?? "—",
        own.filter((a) => a.status === "Present").length,
        own.filter((a) => a.status === "Absent").length,
        money(p ? Number(p.net) : Number(s.basic)),
        p?.status ?? "Not generated",
      ];
    }),
  };
}

async function homeworkReport(_schoolId?: string): Promise<ReportResult> {
  const homework = await prisma.homework.findMany({
    include: {
      class: true,
      subject: true,
      section: true,
      subs: true,
    },
    orderBy: { date: "desc" },
  });
  const students = await prisma.student.findMany({
    where: { status: "active" },
    select: { classId: true, sectionId: true },
  });
  return {
    title: "Homework report",
    sum: [["Homework", homework.length]],
    cols: ["Class", "Subject", "Date", "Due", "Submitted", "Pending"],
    rows: homework.map((h) => {
      const total = students.filter(
        (s) => s.classId === h.classId && (!h.sectionId || s.sectionId === h.sectionId),
      ).length;
      const done = h.subs.filter((s) => s.done).length;
      return [
        `${h.class?.name ?? ""}${h.section ? ` (${h.section.name})` : ""}`,
        h.subject?.name ?? "—",
        dmy(toYmd(h.date)),
        dmy(toYmd(h.due)),
        done,
        Math.max(0, total - done),
      ];
    }),
  };
}

async function libraryReport(_schoolId?: string): Promise<ReportResult> {
  const [books, issues, members, students, staff] = await Promise.all([
    prisma.book.findMany(),
    prisma.bookIssue.findMany({ include: { book: true }, orderBy: { issue: "desc" } }),
    prisma.libraryMember.findMany(),
    prisma.student.findMany({ select: { id: true, name: true } }),
    prisma.staff.findMany({ select: { id: true, name: true } }),
  ]);
  const today = todayYmd();
  const memberName = (id: string) => {
    const m = members.find((x) => x.id === id);
    if (!m) return "—";
    return (
      (m.kind === "student"
        ? students.find((s) => s.id === m.refId)?.name
        : staff.find((s) => s.id === m.refId)?.name) ?? "—"
    );
  };
  return {
    title: "Library report",
    sum: [
      ["Books", books.reduce((s, b) => s + b.qty, 0)],
      ["Issued now", issues.filter((i) => !i.ret).length],
      ["Overdue", issues.filter((i) => !i.ret && toYmd(i.due) < today).length],
    ],
    cols: ["Book", "Member", "Issued", "Due", "Status"],
    rows: issues.map((i) => [
      i.book.title,
      memberName(i.memberId),
      dmy(toYmd(i.issue)),
      dmy(toYmd(i.due)),
      i.ret ? "Returned" : toYmd(i.due) < today ? "Overdue" : "Issued",
    ]),
  };
}

async function inventoryReport(_schoolId?: string): Promise<ReportResult> {
  const [items, stock, issues] = await Promise.all([
    prisma.item.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    prisma.itemStock.findMany(),
    prisma.itemIssue.findMany(),
  ]);
  return {
    title: "Inventory report",
    sum: [
      ["Items", items.length],
      ["Stock value", money(stock.reduce((s, x) => s + x.qty * Number(x.price), 0))],
    ],
    cols: ["Item", "Category", "Purchased", "Issued", "In stock"],
    rows: items.map((item) => {
      const purchased = stock.filter((s) => s.itemId === item.id).reduce((s, x) => s + x.qty, 0);
      const issued = issues
        .filter((s) => s.itemId === item.id && s.status === "Issued")
        .reduce((s, x) => s + x.qty, 0);
      return [item.name, item.category?.name ?? "—", purchased, issued, purchased - issued];
    }),
  };
}

async function transportReport(_schoolId?: string): Promise<ReportResult> {
  const [assignments, fees, routes] = await Promise.all([
    prisma.transportAssignment.findMany({
      include: { student: { include: { class: true } }, route: true, pickup: true },
    }),
    prisma.transportFee.findMany(),
    prisma.transportRoute.count(),
  ]);
  return {
    title: "Transport report",
    sum: [
      ["Routes", routes],
      ["Students using transport", assignments.length],
    ],
    cols: ["Route", "Pickup point", "Student", "Class", "Yearly fee"],
    rows: assignments.map((a) => {
      const fee = fees.find((f) => f.pickupId === a.pickupId);
      return [
        a.route.name,
        a.pickup.name,
        a.student.name,
        a.student.class?.name ?? "—",
        fee ? money(Number(fee.monthlyFee) * fee.months) : "—",
      ];
    }),
  };
}

async function hostelReport(_schoolId?: string): Promise<ReportResult> {
  const rooms = await prisma.room.findMany({
    include: { hostel: true, allocations: true },
    orderBy: { roomNo: "asc" },
  });
  return {
    title: "Hostel report",
    sum: [["Rooms", rooms.length]],
    cols: ["Hostel", "Room", "Beds", "Occupied", "Vacant"],
    rows: rooms.map((r) => [
      r.hostel.name,
      r.roomNo,
      r.beds,
      r.allocations.length,
      Math.max(0, r.beds - r.allocations.length),
    ]),
  };
}

async function alumniReport(_schoolId?: string): Promise<ReportResult> {
  const alumni = await prisma.alumni.findMany({ orderBy: { name: "asc" } });
  return {
    title: "Alumni report",
    sum: [["Alumni", alumni.length]],
    cols: ["Name", "Passing year", "Occupation", "Phone", "Address"],
    rows: alumni.map((a) => [
      a.name,
      a.year ?? "—",
      a.occupation ?? "—",
      a.phone ?? "—",
      a.address ?? "—",
    ]),
  };
}

async function userLogReport(_schoolId?: string): Promise<ReportResult> {
  const logs = await prisma.userLog.findMany({ orderBy: { time: "desc" }, take: 500 });
  return {
    title: "User log",
    sum: [["Entries", logs.length]],
    cols: ["Time", "User", "Action"],
    rows: logs.map((l) => [l.time.toISOString().slice(0, 19).replace("T", " "), l.user, l.act]),
  };
}

async function auditReport(_schoolId?: string): Promise<ReportResult> {
  const logs = await prisma.auditLog.findMany({ orderBy: { time: "desc" }, take: 500 });
  return {
    title: "Audit trail report",
    sum: [["Entries", logs.length]],
    cols: ["Time", "User", "Action", "Entity", "Details"],
    rows: logs.map((l) => [
      l.time.toISOString().slice(0, 19).replace("T", " "),
      l.user,
      l.act,
      l.entity,
      l.description ?? "",
    ]),
  };
}

export async function reportBootstrap(tenantSchoolId?: string) {
  const schoolId = tenantSchoolId ?? (await resolveSchoolContext())?.school.id;
  const classWhere: Record<string, unknown> = {};
  const secWhere: Record<string, unknown> = {};
  const examWhere: Record<string, unknown> = {};
  const feeWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("SchoolClass")) classWhere.schoolId = schoolId;
  if (schoolId && modelHasSchoolId("Section")) secWhere.schoolId = schoolId;
  if (schoolId && modelHasSchoolId("ExamGroup")) examWhere.schoolId = schoolId;
  if (schoolId && modelHasSchoolId("FeeType")) feeWhere.schoolId = schoolId;
  const [classes, sections, examGroups, feeTypes] = await Promise.all([
    prisma.schoolClass.findMany({ where: classWhere, orderBy: { order: "asc" } }),
    prisma.section.findMany({ where: secWhere, orderBy: { name: "asc" } }),
    prisma.examGroup.findMany({ where: examWhere, orderBy: { name: "asc" } }),
    prisma.feeType.findMany({ where: feeWhere, orderBy: { name: "asc" } }),
  ]);
  return { classes, sections, examGroups, feeTypes };
}

export { loadAllFeeData };
