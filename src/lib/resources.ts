import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { requirePermission, type SessionUser } from "./auth";
import { modelMeta } from "./dmmf";
import { serializeModel } from "./dmmf";
import { parseYmd, todayYmd } from "./dates";

type Tx = Prisma.TransactionClient;
type Input = Record<string, unknown>;

export type ResourceContext = {
  user: SessionUser;
  tx: Tx;
  input: Input;
  mode: "create" | "update";
  id?: string;
};

type Config = {
  model: string;
  group: string;
  label?: string;
  search?: string[];
  filters?: string[];
  dateField?: string;
  orderBy?: Record<string, "asc" | "desc">;
  include?: Record<string, unknown>;
  readOnly?: boolean;
  noCreate?: boolean;
  noDelete?: boolean;
  transform?: (row: Record<string, unknown>) => Record<string, unknown>;
  validate?: (data: Input, ctx: ResourceContext) => Promise<void> | void;
  prepareCreate?: (data: Input, ctx: ResourceContext) => Promise<Input> | Input;
  prepareUpdate?: (data: Input, ctx: ResourceContext) => Promise<Input> | Input;
  afterCreate?: (row: Record<string, unknown>, ctx: ResourceContext) => Promise<void> | void;
  afterUpdate?: (row: Record<string, unknown>, ctx: ResourceContext) => Promise<void> | void;
  beforeDelete?: (id: string, ctx: ResourceContext) => Promise<void> | void;
};

const NON_WRITABLE = new Set(["id", "createdAt", "updatedAt", "passwordHash"]);

function delegate(tx: Tx | typeof prisma, model: string) {
  const key = model.charAt(0).toLowerCase() + model.slice(1);
  return (tx as unknown as Record<string, unknown>)[key] as {
    findMany: (args: unknown) => Promise<unknown[]>;
    findUnique: (args: unknown) => Promise<unknown>;
    findFirst: (args: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
    count: (args: unknown) => Promise<number>;
  };
}

function fieldMeta(model: string, field: string) {
  return modelMeta(model).fields.find((f) => f.name === field);
}

function coerceValue(
  model: string,
  fieldName: string,
  raw: unknown,
  ctx: { creating: boolean; input: Input },
): unknown {
  const meta = fieldMeta(model, fieldName);
  if (!meta) return undefined;
  const label = fieldName;

  if (raw === null || raw === undefined) {
    if (meta.isRequired && !meta.hasDefaultValue && !meta.isUpdatedAt) {
      throw new ApiError(422, `${label} is required.`);
    }
    return null;
  }

  if (typeof raw === "string" && raw.trim() === "") {
    if (meta.isRequired && !meta.hasDefaultValue && !meta.isUpdatedAt) {
      throw new ApiError(422, `${label} is required.`);
    }
    return null;
  }

  switch (meta.type) {
    case "String": {
      const value = typeof raw === "string" ? raw.trim() : String(raw).trim();
      const native = Array.isArray(meta.nativeType) ? meta.nativeType : [];
      const max = native[0] === "VarChar" || native[0] === "Char" ? Number(native[1]) : 0;
      if (max && value.length > max) {
        throw new ApiError(422, `${label} must be at most ${max} characters.`);
      }
      return value;
    }
    case "Int":
    case "BigInt": {
      const value = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isInteger(value)) throw new ApiError(422, `${label} must be a whole number.`);
      return value;
    }
    case "Float": {
      const value = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(value)) throw new ApiError(422, `${label} must be a number.`);
      return value;
    }
    case "Decimal": {
      try {
        const value = new Prisma.Decimal(String(raw));
        if (!value.isFinite()) throw new Error("not finite");
        return value;
      } catch {
        throw new ApiError(422, `${label} must be a valid amount.`);
      }
    }
    case "Boolean": {
      if (typeof raw === "boolean") return raw;
      if (raw === 1 || raw === "1" || raw === "true") return true;
      if (raw === 0 || raw === "0" || raw === "false") return false;
      throw new ApiError(422, `${label} must be true or false.`);
    }
    case "DateTime": {
      const text = String(raw);
      const native = Array.isArray(meta.nativeType) ? String(meta.nativeType[0]) : "";
      let date: Date | null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(text)) date = parseYmd(text);
      else date = new Date(text);
      if (!date || Number.isNaN(date.getTime())) {
        throw new ApiError(422, `${label} must be a valid date${native === "Date" ? " (YYYY-MM-DD)" : ""}.`);
      }
      return date;
    }
    case "Json":
      return raw;
    default:
      return raw;
  }
}

export function coerceInput(model: string, input: Input, creating: boolean): Input {
  const meta = modelMeta(model);
  const out: Input = {};
  for (const field of meta.fields) {
    if (field.kind !== "scalar" || NON_WRITABLE.has(field.name)) continue;
    if (!(field.name in input)) continue;
    out[field.name] = coerceValue(model, field.name, input[field.name], { creating, input });
  }
  if (creating) {
    for (const field of meta.fields) {
      if (field.kind !== "scalar" || NON_WRITABLE.has(field.name)) continue;
      if (!(field.name in out) && field.isRequired && !field.hasDefaultValue && !field.isUpdatedAt) {
        throw new ApiError(422, `${field.name} is required.`);
      }
    }
  }
  return out;
}

async function log(
  tx: Tx,
  user: SessionUser,
  act: string,
  entity: string,
  description?: string,
): Promise<void> {
  await tx.auditLog.create({
    data: { user: user.username, act, entity, description: description || null },
  });
}

async function nextNumber(tx: Tx, key: string, start: number): Promise<number> {
  const row = await tx.counter.upsert({
    where: { key },
    create: { key, value: start },
    update: { value: { increment: 1 } },
  });
  return row.value;
}

async function assertSection(tx: Tx, classId: string, sectionId: string): Promise<void> {
  const link = await tx.classSection.findUnique({
    where: { classId_sectionId: { classId, sectionId } },
  });
  if (!link) throw new ApiError(422, "The selected section is not linked to this class.");
}

function optText(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function recordId(row: unknown): string {
  return String((row as { id?: string })?.id ?? "");
}

// ─────────────────────────────── resource configurations ───────────────────────────────

export const RESOURCES: Record<string, Config> = {
  // Students & academics
  students: {
    model: "Student",
    group: "stu",
    label: "student",
    search: ["name", "admNo", "rollNo", "phone", "father"],
    dateField: "admDate",
    orderBy: { admNo: "asc" },
    validate: async (data, ctx) => {
      const gender = optText(data.gender) || "Male";
      if (!["Male", "Female", "Other"].includes(gender)) {
        throw new ApiError(422, "Gender must be Male, Female or Other.");
      }
      if (data.phone && !/^[0-9+\-()\s]{6,20}$/.test(String(data.phone))) {
        throw new ApiError(422, "Phone number is not valid.");
      }
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email))) {
        throw new ApiError(422, "Email address is not valid.");
      }
      const sectionId = data.sectionId as string | undefined;
      const classId = data.classId as string | undefined;
      if (classId && sectionId) await assertSection(ctx.tx, classId, sectionId);
    },
    prepareCreate: async (data, ctx) => {
      const classId = optText(data.classId);
      const sectionId = optText(data.sectionId);
      if (!classId) throw new ApiError(422, "Class is required.");
      if (!sectionId) throw new ApiError(422, "Section is required.");
      await assertSection(ctx.tx, classId, sectionId);

      let admNo = optText(data.admNo);
      if (!admNo) {
        const n = await nextNumber(ctx.tx, "adm", 1001);
        admNo = `ICE${n}`;
      }
      const duplicate = await ctx.tx.student.findUnique({ where: { admNo } });
      if (duplicate) throw new ApiError(409, "Admission number already exists.");

      const phone = optText(data.phone);
      if (!phone) throw new ApiError(422, "Guardian phone is required.");
      const admDate = (data.admDate as Date | undefined) ?? parseYmd(todayYmd())!;
      return {
        ...data,
        admNo,
        admDate,
        classId,
        sectionId,
        gender: optText(data.gender) || "Male",
        status: optText(data.status) || "active",
        portalPassword: optText(data.portalPassword) || `ice@${admNo}`,
      };
    },
    prepareUpdate: async (data, ctx) => {
      if (data.sectionId || data.classId) {
        const current = await ctx.tx.student.findUnique({ where: { id: ctx.id! } });
        if (!current) throw new ApiError(404, "Student not found.");
        const classId = (data.classId as string | undefined) ?? current.classId;
        const sectionId = (data.sectionId as string | undefined) ?? current.sectionId;
        if (classId && sectionId) await assertSection(ctx.tx, classId, sectionId);
      }
      if (data.admNo) {
        const duplicate = await ctx.tx.student.findFirst({
          where: { admNo: String(data.admNo), NOT: { id: ctx.id! } },
        });
        if (duplicate) throw new ApiError(409, "Admission number already exists.");
      }
      return data;
    },
    afterCreate: async (row, ctx) => {
      await log(ctx.tx, ctx.user, "create", "student", optText(ctx.input.name));
    },
    afterUpdate: async (row, ctx) => {
      await log(ctx.tx, ctx.user, "update", "student", optText(ctx.input.name));
    },
    beforeDelete: async (id, ctx) => {
      const student = await ctx.tx.student.findUnique({ where: { id } });
      await log(ctx.tx, ctx.user, "delete", "student", student?.name ?? id);
    },
  },

  categories: {
    model: "StudentCategory",
    group: "stu",
    search: ["name"],
    orderBy: { name: "asc" },
  },
  houses: { model: "StudentHouse", group: "stu", search: ["name"], orderBy: { name: "asc" } },
  disReasons: {
    model: "DisableReason",
    group: "stu",
    search: ["name"],
    orderBy: { name: "asc" },
  },
  multiclass: {
    model: "MultiClass",
    group: "stu",
  },
  onlineAdm: {
    model: "OnlineAdmission",
    group: "stu",
    search: ["name", "phone", "father"],
    dateField: "date",
    orderBy: { date: "desc" },
  },

  classes: {
    model: "SchoolClass",
    group: "acad",
    search: ["name"],
    orderBy: { order: "asc" },
    include: { sections: true },
    transform: (row) => ({
      ...row,
      sectionIds: Array.isArray(row.sections)
        ? (row.sections as { sectionId: string }[]).map((s) => s.sectionId)
        : [],
    }),
    prepareCreate: (data, ctx) => {
      const ids = Array.isArray(ctx.input.sectionIds)
        ? ctx.input.sectionIds.map(String)
        : [];
      return { ...data, sections: { create: ids.map((sectionId) => ({ sectionId })) } };
    },
    prepareUpdate: (data, ctx) => {
      if (!Array.isArray(ctx.input.sectionIds)) return data;
      const ids = ctx.input.sectionIds.map(String);
      return {
        ...data,
        sections: {
          deleteMany: {},
          create: ids.map((sectionId) => ({ sectionId })),
        },
      };
    },
    beforeDelete: async (id, ctx) => {
      const count = await ctx.tx.student.count({ where: { classId: id } });
      if (count > 0) {
        throw new ApiError(409, "This class has students. Move or delete them first.");
      }
      const masters = await ctx.tx.feeMaster.count({ where: { classId: id } });
      if (masters > 0) {
        throw new ApiError(409, "This class has fees configured. Remove those fee rows first.");
      }
    },
  },
  sections: { model: "Section", group: "acad", search: ["name"], orderBy: { name: "asc" } },
  subjects: { model: "Subject", group: "acad", search: ["name", "code"], orderBy: { name: "asc" } },
  subGroups: {
    model: "SubjectGroup",
    group: "acad",
    search: ["name"],
    orderBy: { name: "asc" },
    include: { sections: true, subjects: true },
    transform: (row) => ({
      ...row,
      sectionIds: Array.isArray(row.sections)
        ? (row.sections as { sectionId: string }[]).map((s) => s.sectionId)
        : [],
      subjectIds: Array.isArray(row.subjects)
        ? (row.subjects as { subjectId: string }[]).map((s) => s.subjectId)
        : [],
    }),
    prepareCreate: (data, ctx) => ({
      ...data,
      sections: {
        create: (Array.isArray(ctx.input.sectionIds) ? ctx.input.sectionIds : []).map(
          (sectionId) => ({ sectionId: String(sectionId) }),
        ),
      },
      subjects: {
        create: (Array.isArray(ctx.input.subjectIds) ? ctx.input.subjectIds : []).map(
          (subjectId) => ({ subjectId: String(subjectId) }),
        ),
      },
    }),
    prepareUpdate: (data, ctx) => {
      const next: Input = { ...data };
      if (Array.isArray(ctx.input.sectionIds)) {
        next.sections = {
          deleteMany: {},
          create: ctx.input.sectionIds.map((sectionId) => ({ sectionId: String(sectionId) })),
        };
      }
      if (Array.isArray(ctx.input.subjectIds)) {
        next.subjects = {
          deleteMany: {},
          create: ctx.input.subjectIds.map((subjectId) => ({ subjectId: String(subjectId) })),
        };
      }
      return next;
    },
  },
  sessions: {
    model: "AcademicSession",
    group: "sys",
    search: ["name"],
    orderBy: { name: "desc" },
  },

  // Fees
  feesGroup: { model: "FeeGroup", group: "fees", search: ["name"], orderBy: { name: "asc" } },
  feestype: { model: "FeeType", group: "fees", search: ["name", "code"], orderBy: { name: "asc" } },
  feesdisc: {
    model: "FeeDiscount",
    group: "fees",
    search: ["name", "code"],
    orderBy: { name: "asc" },
    validate: (data) => {
      if (data.type && !["Fixed", "Percent"].includes(String(data.type))) {
        throw new ApiError(422, "Discount type must be Fixed or Percent.");
      }
      if (data.amount && Number(data.amount) < 0) {
        throw new ApiError(422, "Discount amount cannot be negative.");
      }
    },
  },
  feesmaster: {
    model: "FeeMaster",
    group: "fees",
    orderBy: { due: "asc" },
    dateField: "due",
    validate: (data) => {
      if (data.amount !== undefined && Number(data.amount) < 0) {
        throw new ApiError(422, "Fee amount cannot be negative.");
      }
      if (data.fine !== undefined && Number(data.fine) < 0) {
        throw new ApiError(422, "Fine cannot be negative.");
      }
    },
  },
  carry: {
    model: "CarryForward",
    group: "fees",
    dateField: "due",
    orderBy: { createdAt: "desc" },
    validate: (data) => {
      if (data.amount !== undefined && Number(data.amount) <= 0) {
        throw new ApiError(422, "Balance amount must be greater than zero.");
      }
    },
  },
  bankPay: {
    model: "BankPayment",
    group: "fees",
    search: ["bank", "ref"],
    dateField: "date",
    orderBy: { date: "desc" },
    include: { student: { select: { id: true, name: true, admNo: true } } },
    transform: (row) => {
      const student = (row.student ?? {}) as Record<string, unknown>;
      return {
        ...row,
        studentName: student.name ?? "",
        studentAdm: student.admNo ?? "",
      };
    },
    validate: (data) => {
      if (data.amount !== undefined && Number(data.amount) <= 0) {
        throw new ApiError(422, "Amount must be greater than zero.");
      }
    },
  },
  feeremind: {
    model: "FeeReminder",
    group: "fees",
    search: ["name"],
    orderBy: { name: "asc" },
    validate: (data) => {
      if (data.kind && !["Before due", "After due"].includes(String(data.kind))) {
        throw new ApiError(422, "Reminder timing must be 'Before due' or 'After due'.");
      }
    },
  },
  payments: {
    model: "Payment",
    group: "fees",
    search: ["rc", "mode", "note"],
    dateField: "date",
    orderBy: { date: "desc" },
    include: { student: { include: { class: true, section: true } } },
    transform: (row) => {
      const student = (row.student ?? {}) as Record<string, unknown>;
      const cls = (student.class ?? {}) as Record<string, unknown>;
      const sec = (student.section ?? {}) as Record<string, unknown>;
      return {
        ...row,
        studentName: student.name ?? "",
        studentAdm: student.admNo ?? "",
        studentClass: cls.name
          ? `${String(cls.name)}${sec.name ? ` (${String(sec.name)})` : ""}`
          : "",
      };
    },
    readOnly: true,
    noCreate: true,
    noDelete: true,
  },

  // Front office
  enquiries: {
    model: "Enquiry",
    group: "front",
    search: ["name", "phone", "desc"],
    dateField: "date",
    orderBy: { date: "desc" },
  },
  visitors: {
    model: "Visitor",
    group: "front",
    search: ["name", "phone", "idCard"],
    dateField: "date",
    orderBy: { date: "desc" },
  },
  calls: {
    model: "PhoneCall",
    group: "front",
    search: ["name", "phone", "desc"],
    dateField: "date",
    orderBy: { date: "desc" },
  },
  dispatch: {
    model: "PostalDispatch",
    group: "front",
    search: ["toTitle", "refNo", "fromTitle"],
    dateField: "date",
    orderBy: { date: "desc" },
  },
  receive: {
    model: "PostalReceive",
    group: "front",
    search: ["fromTitle", "refNo", "toTitle"],
    dateField: "date",
    orderBy: { date: "desc" },
  },
  complaint: {
    model: "Complaint",
    group: "front",
    search: ["by", "desc"],
    dateField: "date",
    orderBy: { date: "desc" },
  },
  frontsetup: {
    model: "FrontOfficeSetup",
    group: "front",
    search: ["name"],
    orderBy: { kind: "asc" },
  },

  // Expenses
  addexp: {
    model: "Expense",
    group: "exp",
    search: ["name", "invoice"],
    dateField: "date",
    orderBy: { date: "desc" },
    validate: (data) => {
      if (data.amount !== undefined && Number(data.amount) <= 0) {
        throw new ApiError(422, "Expense amount must be greater than zero.");
      }
    },
  },
  expHeads: { model: "ExpenseHead", group: "exp", search: ["name"], orderBy: { name: "asc" } },

  // HR
  staff: {
    model: "Staff",
    group: "hr",
    search: ["name", "empId", "phone", "email"],
    orderBy: { name: "asc" },
    validate: (data) => {
      if (data.basic !== undefined && Number(data.basic) < 0) {
        throw new ApiError(422, "Basic salary cannot be negative.");
      }
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email))) {
        throw new ApiError(422, "Email address is not valid.");
      }
    },
    prepareCreate: async (data, ctx) => {
      let empId = optText(data.empId);
      if (!empId) {
        const n = await nextNumber(ctx.tx, "emp", 101);
        empId = `EMP${n}`;
      }
      const duplicate = await ctx.tx.staff.findUnique({ where: { empId } });
      if (duplicate) throw new ApiError(409, "Employee ID already exists.");
      return { ...data, empId, status: optText(data.status) || "active" };
    },
  },
  departments: {
    model: "Department",
    group: "hr",
    search: ["name"],
    orderBy: { name: "asc" },
  },
  designations: {
    model: "Designation",
    group: "hr",
    search: ["name"],
    orderBy: { name: "asc" },
  },
  leaveTypes: {
    model: "LeaveType",
    group: "hr",
    search: ["name"],
    orderBy: { name: "asc" },
  },
  staffLeaves: {
    model: "StaffLeave",
    group: "hr",
    dateField: "from",
    orderBy: { from: "desc" },
    validate: (data) => {
      if (data.from && data.to && new Date(data.from as string) > new Date(data.to as string)) {
        throw new ApiError(422, "Leave end date cannot be before the start date.");
      }
    },
  },
  rating: {
    model: "StaffRating",
    group: "hr",
    dateField: "date",
    orderBy: { date: "desc" },
    validate: (data) => {
      if (data.rating !== undefined) {
        const r = Number(data.rating);
        if (!Number.isInteger(r) || r < 1 || r > 5) {
          throw new ApiError(422, "Rating must be between 1 and 5.");
        }
      }
    },
  },
  payroll: {
    model: "Payroll",
    group: "hr",
    orderBy: { month: "desc" },
    include: { staff: { select: { id: true, name: true, empId: true } } },
    transform: (row) => {
      const staff = (row.staff ?? {}) as Record<string, unknown>;
      return {
        ...row,
        staffName: staff.name ?? "",
        staffEmpId: staff.empId ?? "",
      };
    },
  },
  studentLeaves: {
    model: "StudentLeave",
    group: "att",
    dateField: "from",
    orderBy: { from: "desc" },
    validate: (data) => {
      if (data.from && data.to && new Date(data.from as string) > new Date(data.to as string)) {
        throw new ApiError(422, "Leave end date cannot be before the start date.");
      }
    },
  },

  // Exams
  examGroups: {
    model: "ExamGroup",
    group: "exam",
    search: ["name", "session"],
    orderBy: { name: "asc" },
  },
  examSched: {
    model: "ExamSchedule",
    group: "exam",
    dateField: "date",
    orderBy: { date: "asc" },
    validate: (data) => {
      if (data.max !== undefined && Number(data.max) <= 0) {
        throw new ApiError(422, "Maximum marks must be greater than zero.");
      }
      if (
        data.max !== undefined &&
        data.pass !== undefined &&
        Number(data.pass) > Number(data.max)
      ) {
        throw new ApiError(422, "Pass marks cannot be greater than maximum marks.");
      }
    },
    beforeDelete: async (id, ctx) => {
      const count = await ctx.tx.examResult.count({ where: { schedId: id } });
      if (count > 0) {
        throw new ApiError(409, "This exam has marks entered. Delete the results first.");
      }
    },
  },
  grades: {
    model: "Grade",
    group: "exam",
    orderBy: { from: "desc" },
    validate: (data) => {
      if (data.from !== undefined && data.to !== undefined && Number(data.from) > Number(data.to)) {
        throw new ApiError(422, "Grade range start cannot be greater than its end.");
      }
    },
  },
  divisions: {
    model: "Division",
    group: "exam",
    orderBy: { from: "desc" },
    validate: (data) => {
      if (data.from !== undefined && data.to !== undefined && Number(data.from) > Number(data.to)) {
        throw new ApiError(422, "Division range start cannot be greater than its end.");
      }
    },
  },
  onlineExams: {
    model: "OnlineExam",
    group: "online",
    search: ["title"],
    orderBy: { createdAt: "desc" },
  },
  qbank: {
    model: "Question",
    group: "online",
    search: ["question"],
    orderBy: { createdAt: "desc" },
    validate: (data) => {
      if (data.ans && !["A", "B", "C", "D"].includes(String(data.ans))) {
        throw new ApiError(422, "Correct answer must be A, B, C or D.");
      }
      if (data.marks !== undefined && Number(data.marks) <= 0) {
        throw new ApiError(422, "Marks must be greater than zero.");
      }
    },
  },

  // Lessons
  lessons: {
    model: "Lesson",
    group: "lesson",
    search: ["name"],
    orderBy: { name: "asc" },
  },
  topics: {
    model: "Topic",
    group: "lesson",
    search: ["name"],
    dateField: "planDate",
    orderBy: { planDate: "asc" },
  },
  lessonPlans: {
    model: "LessonPlan",
    group: "lesson",
    dateField: "date",
    orderBy: { date: "desc" },
  },

  // Communication
  notices: {
    model: "Notice",
    group: "comm",
    search: ["title", "msg"],
    dateField: "date",
    orderBy: { date: "desc" },
  },
  emailTpl: { model: "EmailTemplate", group: "comm", search: ["title"], orderBy: { title: "asc" } },
  smsTpl: { model: "SmsTemplate", group: "comm", search: ["title"], orderBy: { title: "asc" } },
  sched: {
    model: "ScheduledMessage",
    group: "comm",
    search: ["title"],
    dateField: "date",
    orderBy: { date: "desc" },
  },
  msgLog: {
    model: "MessageLog",
    group: "comm",
    search: ["to", "phone", "subject", "body"],
    orderBy: { time: "desc" },
    readOnly: true,
    noCreate: true,
    noDelete: true,
  },
  ctypes: { model: "ContentType", group: "dl", search: ["name"], orderBy: { name: "asc" } },
  contents: {
    model: "Content",
    group: "dl",
    search: ["title", "desc", "fileName"],
    dateField: "date",
    orderBy: { date: "desc" },
  },

  // Homework & calendar
  homework: {
    model: "Homework",
    group: "hw",
    search: ["desc"],
    dateField: "date",
    orderBy: { date: "desc" },
    validate: (data) => {
      if (data.date && data.due && new Date(data.date as string) > new Date(data.due as string)) {
        throw new ApiError(422, "Submission date cannot be before the homework date.");
      }
    },
  },
  hwSub: {
    model: "HomeworkSubmission",
    group: "hw",
    readOnly: true,
    noCreate: true,
    noDelete: true,
  },
  events: {
    model: "SchoolEvent",
    group: "front",
    search: ["title", "place"],
    dateField: "date",
    orderBy: { date: "asc" },
  },

  // Library
  books: {
    model: "Book",
    group: "lib",
    search: ["title", "no", "author", "isbn"],
    orderBy: { title: "asc" },
    validate: (data) => {
      if (data.qty !== undefined && Number(data.qty) < 0) {
        throw new ApiError(422, "Quantity cannot be negative.");
      }
    },
  },
  libMembers: {
    model: "LibraryMember",
    group: "lib",
    search: ["card"],
    orderBy: { card: "asc" },
  },
  bookIssues: {
    model: "BookIssue",
    group: "lib",
    dateField: "issue",
    orderBy: { issue: "desc" },
    include: { member: true, book: true },
    transform: (row) => {
      const member = row.member as { card?: string } | undefined;
      const book = row.book as { title?: string } | undefined;
      const { member: _member, book: _book, ...rest } = row;
      return { ...rest, memberCard: member?.card ?? "", bookTitle: book?.title ?? "" };
    },
    validate: async (data, ctx) => {
      if (ctx.mode !== "create") return;
      const bookId = optText(data.bookId);
      if (!bookId) throw new ApiError(422, "Book is required.");
      const book = await ctx.tx.book.findUnique({ where: { id: bookId } });
      if (!book) throw new ApiError(404, "Book not found.");
      const open = await ctx.tx.bookIssue.count({ where: { bookId, ret: null } });
      if (open >= book.qty) throw new ApiError(409, "No copies of this book are available.");
      if (data.issue && data.due && new Date(data.issue as string) > new Date(data.due as string)) {
        throw new ApiError(422, "Due date cannot be before the issue date.");
      }
    },
  },

  // Inventory
  itemCats: { model: "ItemCategory", group: "inv", search: ["name"], orderBy: { name: "asc" } },
  itemStores: { model: "ItemStore", group: "inv", search: ["name", "code"], orderBy: { name: "asc" } },
  itemSup: { model: "ItemSupplier", group: "inv", search: ["name", "contact"], orderBy: { name: "asc" } },
  items: { model: "Item", group: "inv", search: ["name"], orderBy: { name: "asc" } },
  itemStock: {
    model: "ItemStock",
    group: "inv",
    dateField: "date",
    orderBy: { date: "desc" },
    validate: (data) => {
      if (data.qty !== undefined && Number(data.qty) <= 0) {
        throw new ApiError(422, "Stock quantity must be greater than zero.");
      }
    },
  },
  itemIssue: {
    model: "ItemIssue",
    group: "inv",
    dateField: "issue",
    orderBy: { issue: "desc" },
    validate: async (data, ctx) => {
      if (ctx.mode !== "create") return;
      const itemId = optText(data.itemId);
      const qty = Number(data.qty ?? 0);
      if (!itemId) throw new ApiError(422, "Item is required.");
      if (qty <= 0) throw new ApiError(422, "Quantity must be greater than zero.");
      const stockRows = await ctx.tx.itemStock.aggregate({
        where: { itemId },
        _sum: { qty: true },
      });
      const issued = await ctx.tx.itemIssue.aggregate({
        where: { itemId, status: "Issued" },
        _sum: { qty: true },
      });
      const available = (stockRows._sum.qty ?? 0) - (issued._sum.qty ?? 0);
      if (qty > available) {
        throw new ApiError(409, `Only ${available} unit(s) are in stock.`);
      }
    },
  },

  // Transport
  routes: { model: "TransportRoute", group: "trans", search: ["name"], orderBy: { name: "asc" } },
  vehicles: { model: "Vehicle", group: "trans", search: ["number", "driver"], orderBy: { number: "asc" } },
  pickups: { model: "PickupPoint", group: "trans", search: ["name"], orderBy: { name: "asc" } },
  routePick: { model: "RoutePickup", group: "trans", orderBy: { id: "asc" } },
  assignVeh: {
    model: "VehicleAssignment",
    group: "trans",
    include: { vehicles: true },
    orderBy: { id: "asc" },
    transform: (row) => ({
      ...row,
      vehicleIds: Array.isArray(row.vehicles)
        ? (row.vehicles as { vehicleId: string }[]).map((v) => v.vehicleId)
        : [],
    }),
    prepareCreate: (data, ctx) => {
      const ids = Array.isArray(ctx.input.vehicleIds) ? ctx.input.vehicleIds.map(String) : [];
      if (!ids.length) throw new ApiError(422, "Select at least one vehicle.");
      return { ...data, vehicles: { create: ids.map((vehicleId) => ({ vehicleId })) } };
    },
    prepareUpdate: (data, ctx) => {
      if (!Array.isArray(ctx.input.vehicleIds)) return data;
      const ids = ctx.input.vehicleIds.map(String);
      return {
        ...data,
        vehicles: { deleteMany: {}, create: ids.map((vehicleId) => ({ vehicleId })) },
      };
    },
  },
  transportFees: {
    model: "TransportFee",
    group: "trans",
    validate: (data) => {
      if (data.monthlyFee !== undefined && Number(data.monthlyFee) < 0) {
        throw new ApiError(422, "Monthly fee cannot be negative.");
      }
      if (data.months !== undefined && Number(data.months) < 1) {
        throw new ApiError(422, "Months charged must be at least 1.");
      }
    },
  },
  transportAssign: {
    model: "TransportAssignment",
    group: "trans",
    dateField: "due",
    orderBy: { createdAt: "desc" },
    validate: async (data, ctx) => {
      if (ctx.mode !== "create") return;
      const pickupId = optText(data.pickupId);
      if (!pickupId) throw new ApiError(422, "Pickup point is required.");
      const fee = await ctx.tx.transportFee.findUnique({ where: { pickupId } });
      if (!fee) {
        throw new ApiError(422, "Set a fee for this pickup point in Transport > Fees Master first.");
      }
    },
  },

  // Hostel
  hostels: { model: "Hostel", group: "hostel", search: ["name"], orderBy: { name: "asc" } },
  roomTypes: { model: "RoomType", group: "hostel", search: ["name"], orderBy: { name: "asc" } },
  rooms: { model: "Room", group: "hostel", search: ["roomNo"], orderBy: { roomNo: "asc" } },
  hostelAlloc: {
    model: "HostelAllocation",
    group: "hostel",
    dateField: "date",
    orderBy: { date: "desc" },
    validate: async (data, ctx) => {
      if (ctx.mode !== "create") return;
      const roomId = optText(data.roomId);
      if (!roomId) throw new ApiError(422, "Room is required.");
      const room = await ctx.tx.room.findUnique({ where: { id: roomId } });
      if (!room) throw new ApiError(404, "Room not found.");
      const occupied = await ctx.tx.hostelAllocation.count({ where: { roomId } });
      if (occupied >= room.beds) throw new ApiError(409, "This room is full.");
    },
  },

  // Certificates / alumni
  certTpl: {
    model: "CertificateTemplate",
    group: "cert",
    search: ["name"],
    orderBy: { name: "asc" },
  },
  alumni: { model: "Alumni", group: "alumni", search: ["name", "phone"], orderBy: { name: "asc" } },
  alumniEvents: {
    model: "AlumniEvent",
    group: "alumni",
    search: ["title"],
    dateField: "from",
    orderBy: { from: "desc" },
  },

  // System
  customFields: {
    model: "CustomField",
    group: "sys",
    search: ["name"],
    orderBy: { name: "asc" },
    validate: (data) => {
      if (data.for && String(data.for) !== "Student") {
        throw new ApiError(422, "Custom fields can only belong to Student.");
      }
      if (data.type && !["Text", "Number", "Date"].includes(String(data.type))) {
        throw new ApiError(422, "Field type must be Text, Number or Date.");
      }
    },
  },
  languages: {
    model: "Language",
    group: "sys",
    search: ["name", "code"],
    orderBy: { name: "asc" },
  },
  roles: {
    model: "Role",
    group: "sys",
    search: ["name"],
    orderBy: { name: "asc" },
    validate: async (data, ctx) => {
      const perms = data.perms;
      if (
        perms !== undefined &&
        perms !== "all" &&
        !(Array.isArray(perms) && perms.every((p) => typeof p === "string"))
      ) {
        throw new ApiError(422, "Permissions must be 'all' or a list of module ids.");
      }
    },
    prepareUpdate: async (data, ctx) => {
      const current = await ctx.tx.role.findUnique({ where: { id: ctx.id! } });
      if (current?.name === "Admin") return { ...data, name: "Admin", perms: "all" };
      return data;
    },
    beforeDelete: async (id, ctx) => {
      const role = await ctx.tx.role.findUnique({ where: { id } });
      if (!role) throw new ApiError(404, "Role not found.");
      if (role.name === "Admin") throw new ApiError(409, "The Admin role cannot be deleted.");
      const users = await ctx.tx.appUser.count({ where: { role: role.name } });
      if (users > 0) throw new ApiError(409, "Users still have this role. Reassign them first.");
    },
  },
  users: {
    model: "AppUser",
    group: "sys",
    search: ["name", "username"],
    orderBy: { name: "asc" },
    validate: async (data, ctx) => {
      if (ctx.mode === "create") {
        const password = optText(ctx.input.password);
        if (password.length < 4) throw new ApiError(422, "Password must be at least 4 characters.");
      }
      const username = optText(data.username);
      if (username && !/^[a-zA-Z0-9._-]{3,64}$/.test(username)) {
        throw new ApiError(422, "Username must be 3-64 characters (letters, numbers, . _ -).");
      }
      const roleName = optText(data.role);
      if (roleName) {
        const role = await ctx.tx.role.findUnique({ where: { name: roleName } });
        if (!role) throw new ApiError(422, "Choose an existing role.");
      }
    },
    prepareCreate: async (data, ctx) => {
      const password = optText(ctx.input.password);
      const duplicate = await ctx.tx.appUser.findUnique({
        where: { username: String(data.username ?? "") },
      });
      if (duplicate) throw new ApiError(409, "Username already taken.");
      return { ...data, passwordHash: await bcrypt.hash(password, 10) };
    },
    prepareUpdate: async (data, ctx) => {
      const password = optText(ctx.input.password);
      if (data.username) {
        const duplicate = await ctx.tx.appUser.findFirst({
          where: { username: String(data.username), NOT: { id: ctx.id! } },
        });
        if (duplicate) throw new ApiError(409, "Username already taken.");
      }
      if (password) {
        if (password.length < 4) throw new ApiError(422, "Password must be at least 4 characters.");
        return { ...data, passwordHash: await bcrypt.hash(password, 10) };
      }
      return data;
    },
    beforeDelete: async (id, ctx) => {
      const target = await ctx.tx.appUser.findUnique({ where: { id } });
      if (!target) throw new ApiError(404, "User not found.");
      if (target.username === "admin") throw new ApiError(409, "The admin user cannot be deleted.");
      if (target.id === ctx.user.uid) throw new ApiError(409, "You cannot delete your own account.");
      if (
        target.role === "Admin" &&
        (await ctx.tx.appUser.count({ where: { role: "Admin", active: true } })) <= 1
      ) {
        throw new ApiError(409, "At least one active administrator is required.");
      }
    },
  },
};

export type ResourceName = keyof typeof RESOURCES;

export function getResourceConfig(name: string): Config {
  const config = RESOURCES[name];
  if (!config) throw new ApiError(404, "Unknown resource.");
  return config;
}

function serialized(config: Config, row: unknown): Record<string, unknown> {
  const value = serializeModel(config.model, row) as Record<string, unknown>;
  return config.transform ? config.transform(value) : value;
}

function buildWhere(config: Config, params: URLSearchParams): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  const meta = modelMeta(config.model);
  const reserved = new Set(["q", "page", "pageSize", "sort", "dir", "from", "to"]);

  for (const [key, value] of params.entries()) {
    if (reserved.has(key) || value === "") continue;
    if (config.filters && !config.filters.includes(key)) continue;
    const field = meta.fields.find((f) => f.name === key && f.kind === "scalar");
    if (!field || key === "passwordHash") continue;
    try {
      const parsed: unknown = coerceValue(config.model, key, value, { creating: false, input: {} });
      if (parsed !== null && parsed !== undefined) where[key] = parsed;
    } catch {
      throw new ApiError(400, `Invalid filter value for ${key}.`);
    }
  }

  if (config.dateField) {
    const from = params.get("from");
    const to = params.get("to");
    if (from || to) {
      const range: Record<string, Date> = {};
      if (from) {
        const d = parseYmd(from);
        if (!d) throw new ApiError(400, "Invalid 'from' date.");
        range.gte = d;
      }
      if (to) {
        const d = parseYmd(to);
        if (!d) throw new ApiError(400, "Invalid 'to' date.");
        range.lte = d;
      }
      where[config.dateField] = range;
    }
  }

  const q = (params.get("q") ?? "").trim();
  if (q && config.search?.length) {
    where.OR = config.search.map((field) => ({ [field]: { contains: q } }));
  }
  return where;
}

export async function listResource(name: string, params: URLSearchParams) {
  const config = getResourceConfig(name);
  await requirePermission(config.group);

  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const pageSize = Math.min(500, Math.max(1, Number(params.get("pageSize") ?? 12) || 12));
  const where = buildWhere(config, params);

  let orderBy: Record<string, "asc" | "desc"> = config.orderBy ?? { id: "desc" };
  const sort = params.get("sort");
  if (sort && fieldMeta(config.model, sort)) {
    orderBy = { [sort]: params.get("dir") === "asc" ? "asc" : "desc" };
  }

  const db = delegate(prisma, config.model);
  const [total, rows] = await Promise.all([
    db.count({ where }) as Promise<number>,
    db.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: config.include,
    }) as Promise<unknown[]>,
  ]);

  return {
    items: rows.map((row: unknown) => {
      const item = serialized(config, row);
      // Never ship stored file bodies with list responses.
      if (config.model === "Content" && "file" in item) {
        item.hasFile = Boolean(item.file);
        delete item.file;
      }
      return item;
    }),
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getResource(name: string, id: string) {
  const config = getResourceConfig(name);
  await requirePermission(config.group);
  const row = await delegate(prisma, config.model).findUnique({
    where: { id },
    include: config.include,
  });
  if (!row) throw new ApiError(404, "Record not found.");
  return serialized(config, row);
}

export async function createResource(name: string, input: Input) {
  const config = getResourceConfig(name);
  const user = await requirePermission(config.group);
  if (config.readOnly || config.noCreate) throw new ApiError(405, "This list is read-only.");

  const row = await prisma.$transaction(async (tx) => {
    const ctx: ResourceContext = { user, tx, input, mode: "create" };
    let data = coerceInput(config.model, input, true);
    if (config.validate) await config.validate(data, ctx);
    if (config.prepareCreate) data = await config.prepareCreate(data, ctx);
    const created = await delegate(tx, config.model).create({
      data,
      include: config.include,
    });
    if (config.afterCreate) await config.afterCreate(created as Record<string, unknown>, ctx);
    await log(tx, user, "create", config.label ?? name, optText(input.name) || optText(input.title));
    return created;
  });
  return serialized(config, row);
}

export async function updateResource(name: string, id: string, input: Input) {
  const config = getResourceConfig(name);
  const user = await requirePermission(config.group);
  if (config.readOnly) throw new ApiError(405, "This list is read-only.");

  const row = await prisma.$transaction(async (tx) => {
    const existing = await delegate(tx, config.model).findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Record not found.");
    const ctx: ResourceContext = { user, tx, input, mode: "update", id };
    let data = coerceInput(config.model, input, false);
    if (config.validate) await config.validate(data, ctx);
    if (config.prepareUpdate) data = await config.prepareUpdate(data, ctx);
    if (Object.keys(data).length === 0) throw new ApiError(400, "No changes were submitted.");
    const updated = await delegate(tx, config.model).update({
      where: { id },
      data,
      include: config.include,
    });
    if (config.afterUpdate) await config.afterUpdate(updated as Record<string, unknown>, ctx);
    await log(tx, user, "update", config.label ?? name, optText(input.name) || optText(input.title));
    return updated;
  });
  return serialized(config, row);
}

export async function deleteResource(name: string, id: string) {
  const config = getResourceConfig(name);
  const user = await requirePermission(config.group);
  if (config.readOnly || config.noDelete) throw new ApiError(405, "This list is read-only.");

  await prisma.$transaction(async (tx) => {
    const ctx: ResourceContext = { user, tx, input: {}, mode: "update", id };
    const existing = await delegate(tx, config.model).findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Record not found.");
    if (config.beforeDelete) await config.beforeDelete(id, ctx);
    await delegate(tx, config.model).delete({ where: { id } });
    await log(tx, user, "delete", config.label ?? name, recordId(existing));
    return existing;
  });
  return { ok: true };
}

export { nextNumber, assertSection, optText };
