import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { dmy, parseYmd, todayYmd, toYmd } from "./dates";
import { loadAllFeeData } from "./fees";

export type Recipient = {
  name: string;
  phone: string;
  email: string;
  obj: Record<string, unknown>;
};

export async function audienceOptions() {
  const [classes, settings] = await Promise.all([
    prisma.schoolClass.findMany({ orderBy: { order: "asc" } }),
    prisma.setting.findUnique({ where: { id: 1 } }),
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

export async function getRecipients(audience: string, limit = 200): Promise<Recipient[]> {
  if (audience === "allstaff") {
    const staff = await prisma.staff.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
      take: limit,
    });
    return staff.map((s) => ({
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
        school: "",
        date: "",
        due: "0",
      },
    }));
  }

  const classId = audience.startsWith("c:") ? audience.slice(2) : undefined;
  const students = await prisma.student.findMany({
    where: { status: "active", ...(classId ? { classId } : {}) },
    include: { class: true, section: true },
    orderBy: { name: "asc" },
    take: limit,
  });
  const setting = await prisma.setting.findUnique({ where: { id: 1 } });
  return students.map((s) => ({
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
      school: setting?.name ?? "ICE School",
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
}) {
  if (!input.body.trim()) throw new ApiError(422, "Write a message before sending.");
  const recipients = await getRecipients(input.audience);
  if (!recipients.length) throw new ApiError(409, "No recipients matched this audience.");

  const settings = await prisma.setting.findUnique({ where: { id: 1 } });
  const rows = recipients.map((r) => ({
    channel: input.channel,
    to: r.name,
    phone: input.channel === "Email" ? r.email : r.phone,
    subject: input.subject?.trim() || null,
    body: fillTemplate(input.body, r, {
      session: settings?.session ?? "",
      school: settings?.name ?? "",
      date: dmy(todayYmd()),
    }),
    status: "Logged",
  }));

  await prisma.$transaction([
    prisma.messageLog.createMany({ data: rows }),
    prisma.auditLog.create({
      data: {
        user: input.username,
        act: "send",
        entity: input.channel,
        description: `${rows.length} recipients`,
      },
    }),
  ]);

  return { sent: rows.length, channel: input.channel };
}

export async function runFeeReminders(username: string) {
  const [reminders, settings, feeData] = await Promise.all([
    prisma.feeReminder.findMany({ where: { active: true } }),
    prisma.setting.findUnique({ where: { id: 1 } }),
    loadAllFeeData(),
  ]);
  if (!reminders.length) throw new ApiError(409, "Add an active fee reminder first.");

  const template =
    settings?.waMessage ??
    "Dear {name}, fee of {due} is pending for {class}. Please pay at the earliest.";
  const now = parseYmd(todayYmd())!;
  const logs: Prisma.MessageLogCreateManyInput[] = [];

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
          .replace(/\{school\}/g, settings?.name ?? "ICE School")
          .replace(/\{date\}/g, dmy(todayYmd()));
        const to = `${item.student.name} (${item.student.father})`;
        if (reminder.sms) {
          logs.push({ channel: "SMS", to, phone: item.student.phone, subject: "Fee reminder", body, status: "Logged" });
        }
        if (reminder.email) {
          logs.push({ channel: "Email", to, phone: "", subject: "Fee reminder", body, status: "Logged" });
        }
        if (reminder.wa) {
          logs.push({ channel: "WhatsApp", to, phone: item.student.phone, subject: "Fee reminder", body, status: "Logged" });
        }
      }
    }
  }

  if (!logs.length) return { logged: 0 };
  await prisma.$transaction([
    prisma.messageLog.createMany({ data: logs }),
    prisma.auditLog.create({
      data: {
        user: username,
        act: "reminder",
        entity: "fees",
        description: `${logs.length} messages generated`,
      },
    }),
  ]);
  return { logged: logs.length };
}

export async function scheduledSend(id: string, username: string) {
  const message = await prisma.scheduledMessage.findUnique({ where: { id } });
  if (!message) throw new ApiError(404, "Scheduled message not found.");
  if (message.status === "Sent") throw new ApiError(409, "This message was already sent.");
  const audience = message.audience === "All Staff" ? "allstaff" : "allstu";
  const recipients = await getRecipients(audience, 500);
  const settings = await prisma.setting.findUnique({ where: { id: 1 } });
  const rows = recipients.map((r) => ({
    channel: message.channel,
    to: r.name,
    phone: message.channel === "Email" ? r.email : r.phone,
    subject: message.title,
    body: message.msg
      .replace(/\{name\}/g, String(r.obj.name ?? ""))
      .replace(/\{class\}/g, String(r.obj.class ?? ""))
      .replace(/\{school\}/g, settings?.name ?? "ICE School"),
    status: "Logged",
  }));
  await prisma.$transaction([
    prisma.messageLog.createMany({ data: rows }),
    prisma.scheduledMessage.update({ where: { id }, data: { status: "Sent" } }),
    prisma.auditLog.create({
      data: {
        user: username,
        act: "send",
        entity: "scheduled",
        description: `${message.title} · ${rows.length} recipients`,
      },
    }),
  ]);
  return { logged: rows.length };
}

export async function logCredentials(studentId: string, username: string) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new ApiError(404, "Student not found.");
  await prisma.$transaction([
    prisma.messageLog.create({
      data: {
        channel: "SMS",
        to: student.father ?? student.name,
        phone: student.phone,
        subject: "Login credentials",
        body: `Login for ${student.name}: ${student.admNo} / ${student.portalPassword ?? ""}`,
        status: "Logged",
      },
    }),
    prisma.auditLog.create({
      data: {
        user: username,
        act: "send",
        entity: "credentials",
        description: student.admNo,
      },
    }),
  ]);
  return { ok: true };
}
