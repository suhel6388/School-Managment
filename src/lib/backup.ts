import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { serializeModel, modelMeta } from "./dmmf";
import { ApiError } from "./errors";

/** Data tables included in backup/restore. User accounts, roles and logs stay local. */
export const BACKUP_MODELS = [
  "Setting",
  "AcademicSession",
  "SchoolClass",
  "Section",
  "ClassSection",
  "Subject",
  "SubjectGroup",
  "SubjectGroupSection",
  "SubjectGroupSubject",
  "StudentCategory",
  "StudentHouse",
  "DisableReason",
  "Student",
  "Counter",
  "FeeGroup",
  "FeeType",
  "FeeDiscount",
  "FeeMaster",
  "Payment",
  "CarryForward",
  "BankPayment",
  "FeeReminder",
  "Department",
  "Designation",
  "LeaveType",
  "Staff",
  "StaffLeave",
  "StaffRating",
  "Payroll",
  "StaffAttendance",
  "StudentAttendance",
  "StudentLeave",
  "FrontOfficeSetup",
  "Enquiry",
  "Visitor",
  "PhoneCall",
  "PostalDispatch",
  "PostalReceive",
  "Complaint",
  "OnlineAdmission",
  "MultiClass",
  "ExpenseHead",
  "Expense",
  "ExamGroup",
  "ExamSchedule",
  "ExamResult",
  "Grade",
  "Division",
  "AdmitTemplate",
  "MarkTemplate",
  "OnlineExam",
  "Question",
  "OnlineExamResult",
  "Lesson",
  "Topic",
  "LessonPlan",
  "Notice",
  "EmailTemplate",
  "SmsTemplate",
  "ScheduledMessage",
  "MessageLog",
  "ContentType",
  "Content",
  "Homework",
  "HomeworkSubmission",
  "SchoolEvent",
  "Book",
  "LibraryMember",
  "BookIssue",
  "ItemCategory",
  "ItemStore",
  "ItemSupplier",
  "Item",
  "ItemStock",
  "ItemIssue",
  "TransportRoute",
  "Vehicle",
  "PickupPoint",
  "RoutePickup",
  "VehicleAssignment",
  "AssignmentVehicle",
  "TransportFee",
  "TransportAssignment",
  "Hostel",
  "RoomType",
  "Room",
  "HostelAllocation",
  "CertificateTemplate",
  "IdCardTemplate",
  "Alumni",
  "AlumniEvent",
  "CustomField",
  "Language",
] as const;

export type BackupPayload = {
  app: "ICE School Manager";
  version: 1;
  createdAt: string;
  counts: Record<string, number>;
  data: Record<string, Record<string, unknown>[]>;
};

function delegate(db: typeof prisma | Prisma.TransactionClient, model: string) {
  const key = model.charAt(0).toLowerCase() + model.slice(1);
  return (db as unknown as Record<string, unknown>)[key] as {
    findMany: (args?: unknown) => Promise<unknown[]>;
    deleteMany: (args?: unknown) => Promise<{ count: number }>;
    createMany: (args: unknown) => Promise<{ count: number }>;
  };
}

export async function buildBackup(): Promise<BackupPayload> {
  const data: Record<string, Record<string, unknown>[]> = {};
  const counts: Record<string, number> = {};
  for (const model of BACKUP_MODELS) {
    const rows = await delegate(prisma, model).findMany();
    data[model] = rows.map((row) => serializeModel(model, row) as Record<string, unknown>);
    counts[model] = rows.length;
  }
  return {
    app: "ICE School Manager",
    version: 1,
    createdAt: new Date().toISOString(),
    counts,
    data,
  };
}

function reviveRow(model: string, row: Record<string, unknown>): Record<string, unknown> {
  const fields = modelMeta(model).fields;
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.kind !== "scalar") continue;
    if (!(field.name in row)) continue;
    const value = row[field.name];
    if (value === null || value === undefined) {
      out[field.name] = null;
      continue;
    }
    if (field.name === "passwordHash") continue;
    switch (field.type) {
      case "DateTime": {
        const text = String(value);
        const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00.000Z` : text);
        if (Number.isNaN(date.getTime())) {
          throw new ApiError(422, `Invalid date in ${model}.${field.name}: ${text}`);
        }
        out[field.name] = date;
        break;
      }
      case "Decimal":
        out[field.name] = new Prisma.Decimal(String(value));
        break;
      case "Int":
      case "BigInt":
        out[field.name] = Math.trunc(Number(value));
        break;
      case "Float":
        out[field.name] = Number(value);
        break;
      case "Boolean":
        out[field.name] = value === true || value === "true" || value === 1;
        break;
      default:
        out[field.name] = value;
    }
  }
  return out;
}

export async function restoreBackup(payload: unknown): Promise<{ restored: Record<string, number> }> {
  if (!payload || typeof payload !== "object") throw new ApiError(422, "Backup file is not valid JSON.");
  const backup = payload as Partial<BackupPayload>;
  if (backup.app !== "ICE School Manager" || backup.version !== 1 || !backup.data) {
    throw new ApiError(422, "This file is not an ICE School Manager backup.");
  }
  const data = backup.data;
  const restored: Record<string, number> = {};

  for (const model of BACKUP_MODELS) {
    const rows = data[model];
    if (rows === undefined) continue;
    if (!Array.isArray(rows)) throw new ApiError(422, `Backup section ${model} must be a list.`);
    if (rows.length > 200000) throw new ApiError(422, `Backup section ${model} is too large.`);
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS=0");
      try {
        for (const model of BACKUP_MODELS) {
          if (data[model] === undefined) continue;
          await delegate(tx, model).deleteMany({});
        }
        for (const model of BACKUP_MODELS) {
          const rows = data[model];
          if (!rows || !rows.length) {
            restored[model] = 0;
            continue;
          }
          const revived = rows.map((row) => reviveRow(model, row));
          for (let i = 0; i < revived.length; i += 1000) {
            await delegate(tx, model).createMany({
              data: revived.slice(i, i + 1000),
            });
          }
          restored[model] = revived.length;
        }
      } finally {
        await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS=1");
      }
    },
    { timeout: 120000, maxWait: 20000 },
  );

  return { restored };
}
