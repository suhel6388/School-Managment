import { prisma } from "./prisma";
import { pendingFees } from "./fees";
import { todayAttendanceSummary } from "./attendance";
import { lastMonths, parseYmd, toYmd, todayYmd, MON } from "./dates";
import { Prisma } from "@prisma/client";

export async function dashboardData() {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const yearStart = new Date(Date.UTC(now.getFullYear(), 0, 1));
  const yearEnd = new Date(Date.UTC(now.getFullYear(), 11, 31));
  const monthStart = new Date(`${monthKey}-01T00:00:00.000Z`);
  const monthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));
  const today = parseYmd(todayYmd())!;

  const [
    settings,
    activeStudents,
    classes,
    sections,
    subjects,
    staff,
    monthPayments,
    yearPayments,
    events,
    notices,
    recent,
    todayAttendance,
    pending,
    alerts,
  ] = await Promise.all([
    prisma.setting.findUnique({ where: { id: 1 } }),
    prisma.student.count({ where: { status: "active" } }),
    prisma.schoolClass.count(),
    prisma.section.count(),
    prisma.subject.count(),
    prisma.staff.count({ where: { status: "active" } }),
    prisma.payment.findMany({
      where: { date: { gte: monthStart, lte: monthEnd } },
      select: { amount: true, fine: true },
    }),
    prisma.payment.findMany({
      where: { date: { gte: yearStart, lte: yearEnd } },
      select: { date: true, amount: true, fine: true },
    }),
    prisma.schoolEvent.findMany({
      where: { date: { gte: today } },
      orderBy: { date: "asc" },
      take: 4,
    }),
    prisma.notice.findMany({ orderBy: { date: "desc" }, take: 2 }),
    prisma.student.findMany({
      where: { status: "active" },
      include: { class: true },
      orderBy: { admDate: "desc" },
      take: 5,
    }),
    todayAttendanceSummary(),
    pendingFees(),
    Promise.resolve([] as { label: string; route: string; count: number }[]),
  ]);

  const months = lastMonths(6, now);
  const admissionRows = await prisma.student.findMany({
    where: { status: "active" },
    select: { admDate: true, classId: true },
  });
  const admissions = months.map((m) => ({
    label: m.label,
    value: admissionRows.filter((s) => toYmd(s.admDate).startsWith(m.key)).length,
  }));

  const classRows = await prisma.student.groupBy({
    by: ["classId"],
    where: { status: "active" },
    _count: { _all: true },
  });
  const classList = await prisma.schoolClass.findMany({ orderBy: { order: "asc" } });
  const classChart = classList
    .map((c) => ({
      label: c.name,
      value: classRows.find((r) => r.classId === c.id)?._count._all ?? 0,
    }))
    .filter((c) => c.value > 0);

  const monthCollection = MON.map((label, index) => {
    const key = `${now.getFullYear()}-${String(index + 1).padStart(2, "0")}`;
    const total = yearPayments
      .filter((p) => toYmd(p.date).startsWith(key))
      .reduce((sum, p) => sum.plus(p.amount).plus(p.fine), new Prisma.Decimal(0));
    return { month: index, label, value: Number(total.toFixed(2)) };
  });

  const collectedThisMonth = monthPayments
    .reduce((sum, p) => sum.plus(p.amount).plus(p.fine), new Prisma.Decimal(0))
    .toNumber();

  const enquiryFollowUps = await prisma.enquiry.count({
    where: {
      status: "Active",
      follow: { lte: today },
    },
  });
  const leaveRequests =
    (await prisma.staffLeave.count({ where: { status: "Pending" } })) +
    (await prisma.studentLeave.count({ where: { status: "Pending" } }));
  const onlineApplications = await prisma.onlineAdmission.count({ where: { status: "Pending" } });
  const overdueBooks = await prisma.bookIssue.count({ where: { ret: null, due: { lt: today } } });
  const openComplaints = await prisma.complaint.count({ where: { status: "Pending" } });

  if (enquiryFollowUps) alerts.push({ label: `${enquiryFollowUps} enquiry follow-ups due`, route: "enquiry", count: enquiryFollowUps });
  if (leaveRequests) alerts.push({ label: `${leaveRequests} leave requests awaiting approval`, route: "stuleave", count: leaveRequests });
  if (onlineApplications) alerts.push({ label: `${onlineApplications} online admission applications`, route: "onlineadm", count: onlineApplications });
  if (overdueBooks) alerts.push({ label: `${overdueBooks} library books overdue`, route: "issue", count: overdueBooks });
  if (openComplaints) alerts.push({ label: `${openComplaints} open complaints`, route: "complaint", count: openComplaints });

  const newThisMonth = admissionRows.filter((s) => toYmd(s.admDate).startsWith(monthKey)).length;
  const pendingTotal = pending.reduce((sum, p) => sum + p.dueNow, 0);

  return {
    school: {
      name: settings?.name ?? "ICE School",
      session: settings?.session ?? "2026-27",
      address: settings?.address ?? "",
      phone: settings?.phone ?? "",
    },
    kpis: {
      activeStudents,
      newThisMonth,
      classes,
      sections,
      subjects,
      staff,
      collectedThisMonth,
      pendingTotal: Math.round(pendingTotal * 100) / 100,
      pendingStudents: pending.length,
    },
    charts: {
      admissions,
      classes: classChart,
      monthly: monthCollection,
    },
    recentAdmissions: recent.map((s) => ({
      id: s.id,
      name: s.name,
      className: s.class?.name ?? "",
      admDate: toYmd(s.admDate),
    })),
    pendingTop: pending.slice(0, 5).map((p) => ({
      id: p.student.id,
      name: p.student.name,
      className: p.student.className ?? "",
      due: Math.round(p.dueNow * 100) / 100,
    })),
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      date: toYmd(e.date),
      time: e.time ?? "",
      place: e.place ?? "",
    })),
    notices: notices.map((n) => ({ id: n.id, title: n.title, date: toYmd(n.date) })),
    attendance: todayAttendance,
    alerts,
  };
}

export async function alertsOnly() {
  const today = parseYmd(todayYmd())!;
  const [enquiries, staffLeaves, studentLeaves, online, books, complaints] = await Promise.all([
    prisma.enquiry.count({ where: { status: "Active", follow: { lte: today } } }),
    prisma.staffLeave.count({ where: { status: "Pending" } }),
    prisma.studentLeave.count({ where: { status: "Pending" } }),
    prisma.onlineAdmission.count({ where: { status: "Pending" } }),
    prisma.bookIssue.count({ where: { ret: null, due: { lt: today } } }),
    prisma.complaint.count({ where: { status: "Pending" } }),
  ]);
  const alerts: { label: string; route: string; count: number }[] = [];
  if (enquiries) alerts.push({ label: `${enquiries} enquiry follow-ups due`, route: "enquiry", count: enquiries });
  if (staffLeaves + studentLeaves)
    alerts.push({ label: `${staffLeaves + studentLeaves} leave requests waiting for approval`, route: "stuleave", count: staffLeaves + studentLeaves });
  if (online) alerts.push({ label: `${online} online admission applications`, route: "onlineadm", count: online });
  if (books) alerts.push({ label: `${books} library books overdue`, route: "issue", count: books });
  if (complaints) alerts.push({ label: `${complaints} open complaints`, route: "complaint", count: complaints });
  return alerts;
}
