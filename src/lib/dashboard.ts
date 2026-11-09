import { prisma } from "./prisma";
import { pendingFees } from "./fees";
import { todayAttendanceSummary } from "./attendance";
import { lastMonths, parseYmd, toYmd, todayYmd, MON } from "./dates";
import { Prisma } from "@/lib/prisma-client";
import { resolveSchoolContext, modelHasSchoolId } from "./tenant";

export async function dashboardData(tenantSchoolId?: string) {
  const schoolContext = await resolveSchoolContext();
  const schoolId = tenantSchoolId ?? schoolContext?.school.id;

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const yearStart = new Date(Date.UTC(now.getFullYear(), 0, 1));
  const yearEnd = new Date(Date.UTC(now.getFullYear(), 11, 31));
  const monthStart = new Date(`${monthKey}-01T00:00:00.000Z`);
  const monthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));
  const today = parseYmd(todayYmd())!;

  const settingWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("Setting")) settingWhere.schoolId = schoolId;
  else settingWhere.id = 1;

  const studentWhere: Record<string, unknown> = { status: "active" };
  if (schoolId && modelHasSchoolId("Student")) studentWhere.schoolId = schoolId;

  const classWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("SchoolClass")) classWhere.schoolId = schoolId;

  const sectionWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("Section")) sectionWhere.schoolId = schoolId;

  const subjectWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("Subject")) subjectWhere.schoolId = schoolId;

  const staffWhere: Record<string, unknown> = { status: "active" };
  if (schoolId && modelHasSchoolId("Staff")) staffWhere.schoolId = schoolId;

  const monthPaymentWhere: Record<string, unknown> = { date: { gte: monthStart, lte: monthEnd } };
  if (schoolId && modelHasSchoolId("Payment")) monthPaymentWhere.schoolId = schoolId;

  const yearPaymentWhere: Record<string, unknown> = { date: { gte: yearStart, lte: yearEnd } };
  if (schoolId && modelHasSchoolId("Payment")) yearPaymentWhere.schoolId = schoolId;

  const eventWhere: Record<string, unknown> = { date: { gte: today } };
  if (schoolId && modelHasSchoolId("SchoolEvent")) eventWhere.schoolId = schoolId;

  const noticeWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("Notice")) noticeWhere.schoolId = schoolId;

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
    prisma.setting.findFirst({ where: settingWhere }),
    prisma.student.count({ where: studentWhere }),
    prisma.schoolClass.count({ where: classWhere }),
    prisma.section.count({ where: sectionWhere }),
    prisma.subject.count({ where: subjectWhere }),
    prisma.staff.count({ where: staffWhere }),
    prisma.payment.findMany({
      where: monthPaymentWhere,
      select: { amount: true, fine: true },
    }),
    prisma.payment.findMany({
      where: yearPaymentWhere,
      select: { date: true, amount: true, fine: true },
    }),
    prisma.schoolEvent.findMany({
      where: eventWhere,
      orderBy: { date: "asc" },
      take: 4,
    }),
    prisma.notice.findMany({ where: noticeWhere, orderBy: { date: "desc" }, take: 2 }),
    prisma.student.findMany({
      where: studentWhere,
      include: { class: true },
      orderBy: { admDate: "desc" },
      take: 5,
    }),
    todayAttendanceSummary(schoolId),
    pendingFees(schoolId),
    Promise.resolve([] as { label: string; route: string; count: number }[]),
  ]);

  const months = lastMonths(6, now);
  const admissionRows = await prisma.student.findMany({
    where: studentWhere,
    select: { admDate: true, classId: true },
  });
  const admissions = months.map((m) => ({
    label: m.label,
    value: admissionRows.filter((s) => toYmd(s.admDate).startsWith(m.key)).length,
  }));

  const classRows = await prisma.student.groupBy({
    by: ["classId"],
    where: studentWhere,
    _count: { _all: true },
  });
  const classList = await prisma.schoolClass.findMany({ where: classWhere, orderBy: { order: "asc" } });
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

  const enquiryWhere: Record<string, unknown> = { status: "Active", follow: { lte: today } };
  if (schoolId && modelHasSchoolId("Enquiry")) enquiryWhere.schoolId = schoolId;
  const enquiryFollowUps = await prisma.enquiry.count({ where: enquiryWhere });

  const staffLeaveWhere: Record<string, unknown> = { status: "Pending" };
  if (schoolId && modelHasSchoolId("StaffLeave")) staffLeaveWhere.schoolId = schoolId;
  const studentLeaveWhere: Record<string, unknown> = { status: "Pending" };
  if (schoolId && modelHasSchoolId("StudentLeave")) studentLeaveWhere.schoolId = schoolId;

  const leaveRequests =
    (await prisma.staffLeave.count({ where: staffLeaveWhere })) +
    (await prisma.studentLeave.count({ where: studentLeaveWhere }));

  const onlineWhere: Record<string, unknown> = { status: "Pending" };
  if (schoolId && modelHasSchoolId("OnlineAdmission")) onlineWhere.schoolId = schoolId;
  const onlineApplications = await prisma.onlineAdmission.count({ where: onlineWhere });

  const bookIssueWhere: Record<string, unknown> = { ret: null, due: { lt: today } };
  if (schoolId && modelHasSchoolId("BookIssue")) bookIssueWhere.schoolId = schoolId;
  const overdueBooks = await prisma.bookIssue.count({ where: bookIssueWhere });

  const complaintWhere: Record<string, unknown> = { status: "Pending" };
  if (schoolId && modelHasSchoolId("Complaint")) complaintWhere.schoolId = schoolId;
  const openComplaints = await prisma.complaint.count({ where: complaintWhere });

  if (enquiryFollowUps) alerts.push({ label: `${enquiryFollowUps} enquiry follow-ups due`, route: "enquiry", count: enquiryFollowUps });
  if (leaveRequests) alerts.push({ label: `${leaveRequests} leave requests awaiting approval`, route: "stuleave", count: leaveRequests });
  if (onlineApplications) alerts.push({ label: `${onlineApplications} online admission applications`, route: "onlineadm", count: onlineApplications });
  if (overdueBooks) alerts.push({ label: `${overdueBooks} library books overdue`, route: "issue", count: overdueBooks });
  if (openComplaints) alerts.push({ label: `${openComplaints} open complaints`, route: "complaint", count: openComplaints });

  const newThisMonth = admissionRows.filter((s) => toYmd(s.admDate).startsWith(monthKey)).length;
  const pendingTotal = pending.reduce((sum, p) => sum + p.dueNow, 0);

  return {
    school: {
      name: schoolContext?.school?.name ?? settings?.name ?? "ICE School",
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

export async function alertsOnly(tenantSchoolId?: string) {
  const schoolContext = await resolveSchoolContext();
  const schoolId = tenantSchoolId ?? schoolContext?.school.id;
  const today = parseYmd(todayYmd())!;

  const enquiryWhere: Record<string, unknown> = { status: "Active", follow: { lte: today } };
  if (schoolId && modelHasSchoolId("Enquiry")) enquiryWhere.schoolId = schoolId;

  const staffLeaveWhere: Record<string, unknown> = { status: "Pending" };
  if (schoolId && modelHasSchoolId("StaffLeave")) staffLeaveWhere.schoolId = schoolId;

  const studentLeaveWhere: Record<string, unknown> = { status: "Pending" };
  if (schoolId && modelHasSchoolId("StudentLeave")) studentLeaveWhere.schoolId = schoolId;

  const onlineWhere: Record<string, unknown> = { status: "Pending" };
  if (schoolId && modelHasSchoolId("OnlineAdmission")) onlineWhere.schoolId = schoolId;

  const bookIssueWhere: Record<string, unknown> = { ret: null, due: { lt: today } };
  if (schoolId && modelHasSchoolId("BookIssue")) bookIssueWhere.schoolId = schoolId;

  const complaintWhere: Record<string, unknown> = { status: "Pending" };
  if (schoolId && modelHasSchoolId("Complaint")) complaintWhere.schoolId = schoolId;

  const [enquiries, staffLeaves, studentLeaves, online, books, complaints] = await Promise.all([
    prisma.enquiry.count({ where: enquiryWhere }),
    prisma.staffLeave.count({ where: staffLeaveWhere }),
    prisma.studentLeave.count({ where: studentLeaveWhere }),
    prisma.onlineAdmission.count({ where: onlineWhere }),
    prisma.bookIssue.count({ where: bookIssueWhere }),
    prisma.complaint.count({ where: complaintWhere }),
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
