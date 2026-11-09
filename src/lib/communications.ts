import { Prisma } from "@/lib/prisma-client";
import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { dmy, parseYmd, todayYmd, toYmd } from "./dates";
import { loadAllFeeData } from "./fees";
import { resolveSchoolContext, assertSameSchool, modelHasSchoolId } from "./tenant";

export type Recipient = {
  name: string;
  phone: string;
  email: string;
  obj: Record<string, unknown>;
};

export async function audienceOptions(tenantSchoolId?: string) {
  const tenantCtx = await resolveSchoolContext();
  const schoolId = tenantSchoolId ?? tenantCtx?.school.id;

  const classWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("SchoolClass")) classWhere.schoolId = schoolId;

  const settingWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("Setting")) settingWhere.schoolId = schoolId;
  else settingWhere.id = 1;

  const [classes, settings] = await Promise.all([
    prisma.schoolClass.findMany({ where: classWhere, orderBy: { order: "asc" } }),
    prisma.setting.findFirst({ where: settingWhere }),
  ]);
  return {
    audiences: [
      { value: "allstu", label: "All students" },
      { value: "allstaff", label: "All staff" },
      ...classes.map((c) => ({ value: `c:${c.id}`, label: `Class: ${c.name}` })),
    ],
    template: settings?.waMessage ?? "",
  };
}

export async function getRecipients(audience: string, limit = 200, tenantSchoolId?: string): Promise<Recipient[]> {
  const tenantCtx = await resolveSchoolContext();
  const schoolId = tenantSchoolId ?? tenantCtx?.school.id;

  if (audience === "allstaff") {
    const staffWhere: Record<string, unknown> = { status: "active" };
    if (schoolId && modelHasSchoolId("Staff")) staffWhere.schoolId = schoolId;

    const staff = await prisma.staff.findMany({
      where: staffWhere,
      orderBy: { name: "asc" },
      take: limit,
    });
    const scopedStaff = schoolId
      ? staff.filter((s: Record<string, unknown>) => !s.schoolId || s.schoolId === schoolId)
      : staff;

    return scopedStaff.map((s) => ({
      name: s.name,
      phone: s.phone ?? "",
      email: s.email ?? "",
      obj: {
        name: s.name,
        class: "",
        admNo: s.empId,
        father: "",
        dob: "",
        session: "",
        school: tenantCtx?.school.name ?? "",
        date: "",
        due: "0",
      },
    }));
  }

  const classId = audience.startsWith("c:") ? audience.slice(2) : undefined;
  const studentWhere: Record<string, unknown> = { status: "active", ...(classId ? { classId } : {}) };
  if (schoolId && modelHasSchoolId("Student")) studentWhere.schoolId = schoolId;

  const settingWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("Setting")) settingWhere.schoolId = schoolId;
  else settingWhere.id = 1;

  const [students, setting] = await Promise.all([
    prisma.student.findMany({
      where: studentWhere,
      include: { class: true, section: true },
      orderBy: { name: "asc" },
      take: limit,
    }),
    prisma.setting.findFirst({ where: settingWhere }),
  ]);

  const scopedStudents = schoolId
    ? students.filter((s: Record<string, unknown>) => !s.schoolId || s.schoolId === schoolId)
    : students;

  return scopedStudents.map((s) => ({
    name: `${s.name} (${s.father ?? ""})`,
    phone: s.phone ?? "",
    email: s.email ?? "",
    obj: {
      name: s.name,
      class: `${s.class?.name ?? ""}${s.section ? ` (${s.section.name})` : ""}`,
      admNo: s.admNo,
      father: s.father ?? "",
      dob: s.dob ? dmy(toYmd(s.dob)) : "",
      session: setting?.session ?? "",
      school: tenantCtx?.school.name ?? setting?.name ?? "ICE School",
      date: dmy(todayYmd()),
      due: "0",
    },
  }));
}

export function fillTemplate(template: string, recipient: Recipient, extra?: Record<string, string>) {
  const values: Record<string, string> = {
    name: "",
    class: "",
    admNo: "",
    father: "",
    dob: "",
    session: "",
    school: "",
    date: "",
    due: "0",
    ...recipient.obj,
    ...(extra ?? {}),
  } as Record<string, string>;
  return String(template).replace(/\{(\w+)\}/g, (match, key: string) =>
    values[key] !== undefined && values[key] !== null ? String(values[key]) : match,
  );
}

export async function sendMessages(input: {
  channel: "Email" | "SMS" | "WhatsApp";
  audience: string;
  subject?: string;
  body: string;
  username: string;
}, tenantSchoolId?: string) {
  const tenantCtx = await resolveSchoolContext();
  const schoolId = tenantSchoolId ?? tenantCtx?.school.id;

  if (!input.body.trim()) throw new ApiError(422, "Write a message before sending.");
  const recipients = await getRecipients(input.audience, 200, schoolId);
  if (!recipients.length) throw new ApiError(409, "No recipients matched this audience.");

  const settingWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("Setting")) settingWhere.schoolId = schoolId;
  else settingWhere.id = 1;

  const settings = await prisma.setting.findFirst({ where: settingWhere });
  const rows = recipients.map((r) => {
    const rowData: Record<string, unknown> = {
      channel: input.channel,
      to: r.name,
      phone: input.channel === "Email" ? r.email : r.phone,
      subject: input.subject?.trim() || null,
      body: fillTemplate(input.body, r, {
        session: settings?.session ?? "",
        school: tenantCtx?.school.name ?? settings?.name ?? "",
        date: dmy(todayYmd()),
      }),
      status: "Logged",
    };
    if (schoolId && modelHasSchoolId("MessageLog")) rowData.schoolId = schoolId;
    return rowData;
  });

  const auditData: Record<string, unknown> = {
    user: input.username,
    act: "send",
    entity: input.channel,
    description: `${rows.length} recipients`,
  };
  if (schoolId && modelHasSchoolId("AuditLog")) auditData.schoolId = schoolId;

  await prisma.$transaction([
    prisma.messageLog.createMany({ data: rows as any }),
    prisma.auditLog.create({
      data: auditData as any,
    }),
  ]);

  return { sent: rows.length, channel: input.channel };
}

export async function runFeeReminders(username: string, tenantSchoolId?: string) {
  const tenantCtx = await resolveSchoolContext();
  const schoolId = tenantSchoolId ?? tenantCtx?.school.id;

  const reminderWhere: Record<string, unknown> = { active: true };
  if (schoolId && modelHasSchoolId("FeeReminder")) reminderWhere.schoolId = schoolId;

  const settingWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("Setting")) settingWhere.schoolId = schoolId;
  else settingWhere.id = 1;

  const [reminders, settings, feeData] = await Promise.all([
    prisma.feeReminder.findMany({ where: reminderWhere }),
    prisma.setting.findFirst({ where: settingWhere }),
    loadAllFeeData(schoolId),
  ]);
  if (!reminders.length) throw new ApiError(409, "Add an active fee reminder first.");

  const template =
    settings?.waMessage ??
    "Dear {name}, fee of {due} is pending for {class}. Please pay at the earliest.";
  const now = parseYmd(todayYmd())!;
  const logs: Record<string, unknown>[] = [];

  for (const reminder of reminders) {
    for (const item of feeData) {
      for (const row of item.rows) {
        if (row.bal <= 0 || !row.due) continue;
        const due = parseYmd(row.due);
        if (!due) continue;
        const diff = Math.round((due.getTime() - now.getTime()) / 86400000);
        const hit =
          reminder.kind === "Before due"
            ? diff >= 0 && diff <= reminder.days
            : -diff >= reminder.days && diff < 0;
        if (!hit) continue;
        const body = template
          .replace(/\{name\}/g, item.student.name)
          .replace(/\{class\}/g, `${item.student.className ?? ""}${item.student.sectionName ? ` (${item.student.sectionName})` : ""}`)
          .replace(/\{due\}/g, `₹${row.bal.toLocaleString("en-IN")}`)
          .replace(/\{school\}/g, tenantCtx?.school.name ?? settings?.name ?? "ICE School")
          .replace(/\{date\}/g, dmy(todayYmd()));
        const to = `${item.student.name} (${item.student.father})`;
        if (reminder.sms) {
          const l: Record<string, unknown> = { channel: "SMS", to, phone: item.student.phone, subject: "Fee reminder", body, status: "Logged" };
          if (schoolId && modelHasSchoolId("MessageLog")) l.schoolId = schoolId;
          logs.push(l);
        }
        if (reminder.email) {
          const l: Record<string, unknown> = { channel: "Email", to, phone: "", subject: "Fee reminder", body, status: "Logged" };
          if (schoolId && modelHasSchoolId("MessageLog")) l.schoolId = schoolId;
          logs.push(l);
        }
        if (reminder.wa) {
          const l: Record<string, unknown> = { channel: "WhatsApp", to, phone: item.student.phone, subject: "Fee reminder", body, status: "Logged" };
          if (schoolId && modelHasSchoolId("MessageLog")) l.schoolId = schoolId;
          logs.push(l);
        }
      }
    }
  }

  if (!logs.length) return { logged: 0 };

  const auditData: Record<string, unknown> = {
    user: username,
    act: "reminder",
    entity: "fees",
    description: `${logs.length} messages generated`,
  };
  if (schoolId && modelHasSchoolId("AuditLog")) auditData.schoolId = schoolId;

  await prisma.$transaction([
    prisma.messageLog.createMany({ data: logs as any }),
    prisma.auditLog.create({
      data: auditData as any,
    }),
  ]);
  return { logged: logs.length };
}

export async function scheduledSend(id: string, username: string, tenantSchoolId?: string) {
  const tenantCtx = await resolveSchoolContext();
  const schoolId = tenantSchoolId ?? tenantCtx?.school.id;

  const message = await prisma.scheduledMessage.findUnique({ where: { id } });
  if (!message) throw new ApiError(404, "Scheduled message not found.");
  if (tenantCtx && (message as Record<string, unknown>).schoolId) {
    assertSameSchool(tenantCtx, String((message as Record<string, unknown>).schoolId));
  }
  if (message.status === "Sent") throw new ApiError(409, "This message was already sent.");

  const audience = message.audience === "All Staff" ? "allstaff" : "allstu";
  const recipients = await getRecipients(audience, 500, schoolId);

  const settingWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("Setting")) settingWhere.schoolId = schoolId;
  else settingWhere.id = 1;

  const settings = await prisma.setting.findFirst({ where: settingWhere });
  const rows = recipients.map((r) => {
    const rowData: Record<string, unknown> = {
      channel: message.channel,
      to: r.name,
      phone: message.channel === "Email" ? r.email : r.phone,
      subject: message.title,
      body: message.msg
        .replace(/\{name\}/g, String(r.obj.name ?? ""))
        .replace(/\{class\}/g, String(r.obj.class ?? ""))
        .replace(/\{school\}/g, tenantCtx?.school.name ?? settings?.name ?? "ICE School"),
      status: "Logged",
    };
    if (schoolId && modelHasSchoolId("MessageLog")) rowData.schoolId = schoolId;
    return rowData;
  });

  const auditData: Record<string, unknown> = {
    user: username,
    act: "send",
    entity: "scheduled",
    description: `${message.title} · ${rows.length} recipients`,
  };
  if (schoolId && modelHasSchoolId("AuditLog")) auditData.schoolId = schoolId;

  await prisma.$transaction([
    prisma.messageLog.createMany({ data: rows as any }),
    prisma.scheduledMessage.update({ where: { id }, data: { status: "Sent" } }),
    prisma.auditLog.create({
      data: auditData as any,
    }),
  ]);
  return { logged: rows.length };
}

export async function logCredentials(studentId: string, username: string, tenantSchoolId?: string) {
  const tenantCtx = await resolveSchoolContext();
  const schoolId = tenantSchoolId ?? tenantCtx?.school.id;

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new ApiError(404, "Student not found.");
  if (tenantCtx && (student as Record<string, unknown>).schoolId) {
    assertSameSchool(tenantCtx, String((student as Record<string, unknown>).schoolId));
  }

  const messageData: Record<string, unknown> = {
    channel: "SMS",
    to: student.father ?? student.name,
    phone: student.phone,
    subject: "Login credentials",
    body: `Login for ${student.name}: ${student.admNo} / ${student.portalPassword ?? ""}`,
    status: "Logged",
  };
  if (schoolId && modelHasSchoolId("MessageLog")) messageData.schoolId = schoolId;

  const auditData: Record<string, unknown> = {
    user: username,
    act: "send",
    entity: "credentials",
    description: student.admNo,
  };
  if (schoolId && modelHasSchoolId("AuditLog")) auditData.schoolId = schoolId;

  await prisma.$transaction([
    prisma.messageLog.create({
      data: messageData as any,
    }),
    prisma.auditLog.create({
      data: auditData as any,
    }),
  ]);
  return { ok: true };
}
