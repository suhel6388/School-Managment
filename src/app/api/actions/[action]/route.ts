import { prisma } from "@/lib/prisma";
import { readJson, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { deleteResource } from "@/lib/resources";
import { parseYmd, todayYmd, toYmd } from "@/lib/dates";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

type Ctx = { params: Promise<{ action: string }> };

export const POST = route(async (req: Request, ctx: Ctx) => {
  const { action } = await ctx.params;
  const body = await readJson(req);

  switch (action) {
    case "bulk-delete": {
      const resource = String(body.resource ?? "");
      const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
      if (!resource || !ids.length) throw new ApiError(422, "Select at least one record.");
      if (ids.length > 200) throw new ApiError(422, "Delete at most 200 records at a time.");
      const deleted: string[] = [];
      const failed: { id: string; error: string }[] = [];
      for (const id of ids) {
        try {
          await deleteResource(resource, id);
          deleted.push(id);
        } catch (error) {
          failed.push({ id, error: error instanceof Error ? error.message : "Delete failed" });
        }
      }
      return { deleted: deleted.length, failed };
    }

    case "payroll-generate": {
      const user = await requirePermission("hr");
      const month = String(body.month ?? "");
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new ApiError(422, "Month must be YYYY-MM.");
      const staff = await prisma.staff.findMany({ where: { status: "active" } });
      if (!staff.length) throw new ApiError(409, "There are no active staff to pay.");
      const existing = await prisma.payroll.findMany({ where: { month }, select: { staffId: true } });
      const done = new Set(existing.map((p) => p.staffId));
      const rows = staff
        .filter((s) => !done.has(s.id))
        .map((s) => ({
          staffId: s.id,
          month,
          basic: s.basic,
          allow: new Prisma.Decimal(0),
          deduct: new Prisma.Decimal(0),
          net: s.basic,
          status: "Generated",
        }));
      if (!rows.length) throw new ApiError(409, "Payroll for this month is already generated.");
      await prisma.$transaction([
        prisma.payroll.createMany({ data: rows }),
        prisma.auditLog.create({
          data: {
            user: user.username,
            act: "generate",
            entity: "payroll",
            description: `${month} · ${rows.length} staff`,
          },
        }),
      ]);
      return { created: rows.length, month };
    }

    case "payroll-pay": {
      const user = await requirePermission("hr");
      const id = String(body.id ?? "");
      const mode = String(body.mode ?? "");
      if (!["Cash", "Bank Transfer", "Cheque"].includes(mode)) {
        throw new ApiError(422, "Choose Cash, Bank Transfer or Cheque.");
      }
      const paidDate = body.date ? parseYmd(String(body.date)) : parseYmd(todayYmd());
      if (!paidDate) throw new ApiError(422, "Payment date is invalid.");
      const payroll = await prisma.payroll.findUnique({ where: { id } });
      if (!payroll) throw new ApiError(404, "Payroll row not found.");
      if (payroll.status === "Paid") throw new ApiError(409, "This salary is already paid.");
      const updated = await prisma.$transaction(async (tx) => {
        const row = await tx.payroll.update({
          where: { id },
          data: { status: "Paid", mode, paidDate },
        });
        await tx.auditLog.create({
          data: {
            user: user.username,
            act: "pay",
            entity: "payroll",
            description: `${payroll.month} · ₹${Number(payroll.net).toFixed(2)}`,
          },
        });
        return row;
      });
      return { status: updated.status, paidDate: updated.paidDate ? toYmd(updated.paidDate) : "" };
    }

    case "book-return": {
      const user = await requirePermission("lib");
      const id = String(body.id ?? "");
      const issue = await prisma.bookIssue.findUnique({ where: { id }, include: { book: true } });
      if (!issue) throw new ApiError(404, "Issue record not found.");
      if (issue.ret) throw new ApiError(409, "This book has already been returned.");
      const ret = body.date ? parseYmd(String(body.date)) : parseYmd(todayYmd());
      if (!ret) throw new ApiError(422, "Return date is invalid.");
      await prisma.$transaction([
        prisma.bookIssue.update({ where: { id }, data: { ret } }),
        prisma.auditLog.create({
          data: {
            user: user.username,
            act: "return",
            entity: "library",
            description: issue.book.title,
          },
        }),
      ]);
      return { returned: true, date: toYmd(ret) };
    }

    case "leave-status": {
      const user = await requirePermission("att");
      const kind = String(body.kind ?? "");
      const id = String(body.id ?? "");
      const status = String(body.status ?? "");
      if (!["Approved", "Rejected", "Pending"].includes(status)) {
        throw new ApiError(422, "Status must be Approved, Rejected or Pending.");
      }
      if (kind === "staff") {
        const row = await prisma.staffLeave.findUnique({ where: { id } });
        if (!row) throw new ApiError(404, "Leave request not found.");
        await prisma.staffLeave.update({ where: { id }, data: { status } });
      } else if (kind === "student") {
        const row = await prisma.studentLeave.findUnique({ where: { id } });
        if (!row) throw new ApiError(404, "Leave request not found.");
        await prisma.studentLeave.update({ where: { id }, data: { status } });
      } else {
        throw new ApiError(422, "Leave kind must be staff or student.");
      }
      await prisma.auditLog.create({
        data: {
          user: user.username,
          act: status.toLowerCase(),
          entity: `${kind}-leave`,
          description: id,
        },
      });
      return { status };
    }

    case "student-status": {
      const user = await requirePermission("stu");
      const id = String(body.id ?? "");
      const status = String(body.status ?? "");
      if (!["active", "disabled"].includes(status)) {
        throw new ApiError(422, "Status must be active or disabled.");
      }
      const student = await prisma.student.findUnique({ where: { id } });
      if (!student) throw new ApiError(404, "Student not found.");
      const reasonId = body.reasonId ? String(body.reasonId) : null;
      if (status === "disabled" && reasonId) {
        const reason = await prisma.disableReason.findUnique({ where: { id: reasonId } });
        if (!reason) throw new ApiError(404, "Disable reason not found.");
      }
      await prisma.$transaction([
        prisma.student.update({
          where: { id },
          data: { status, disReasonId: status === "disabled" ? reasonId : null },
        }),
        prisma.auditLog.create({
          data: {
            user: user.username,
            act: status === "disabled" ? "disable" : "enable",
            entity: "student",
            description: student.name,
          },
        }),
      ]);
      return { status };
    }

    case "staff-status": {
      const user = await requirePermission("hr");
      const id = String(body.id ?? "");
      const status = String(body.status ?? "");
      if (!["active", "inactive"].includes(status)) {
        throw new ApiError(422, "Status must be active or inactive.");
      }
      const staff = await prisma.staff.findUnique({ where: { id } });
      if (!staff) throw new ApiError(404, "Staff member not found.");
      await prisma.$transaction([
        prisma.staff.update({ where: { id }, data: { status } }),
        prisma.auditLog.create({
          data: {
            user: user.username,
            act: status === "active" ? "enable" : "disable",
            entity: "staff",
            description: staff.name,
          },
        }),
      ]);
      return { status };
    }

    case "lesson-copy": {
      const user = await requirePermission("lesson");
      const fromClassId = String(body.fromClassId ?? "");
      const toClassId = String(body.toClassId ?? "");
      const subjectId = String(body.subjectId ?? "");
      if (!fromClassId || !toClassId || !subjectId) {
        throw new ApiError(422, "Choose source class, target class and subject.");
      }
      if (fromClassId === toClassId) throw new ApiError(422, "Source and target classes must differ.");
      const lessons = await prisma.lesson.findMany({
        where: { classId: fromClassId, subjectId },
        include: { topics: true },
      });
      if (!lessons.length) throw new ApiError(409, "There are no lessons to copy for this selection.");
      const existing = await prisma.lesson.findMany({
        where: { classId: toClassId, subjectId },
        select: { name: true },
      });
      const names = new Set(existing.map((l) => l.name));
      let copied = 0;
      await prisma.$transaction(async (tx) => {
        for (const lesson of lessons) {
          if (names.has(lesson.name)) continue;
          const created = await tx.lesson.create({
            data: { classId: toClassId, subjectId, name: lesson.name },
          });
          if (lesson.topics.length) {
            await tx.topic.createMany({
              data: lesson.topics.map((topic) => ({
                lessonId: created.id,
                name: topic.name,
                planDate: topic.planDate,
                status: "Pending",
              })),
            });
          }
          copied++;
        }
        await tx.auditLog.create({
          data: {
            user: user.username,
            act: "copy",
            entity: "lesson",
            description: `${copied} lesson(s) copied`,
          },
        });
      });
      return { copied };
    }

    case "online-admit": {
      const user = await requirePermission("stu");
      const id = String(body.id ?? "");
      const admission = await prisma.onlineAdmission.findUnique({ where: { id } });
      if (!admission) throw new ApiError(404, "Application not found.");
      if (admission.status !== "Pending") throw new ApiError(409, "This application has already been processed.");
      const classId = String(body.classId ?? admission.classId ?? "");
      if (!classId) throw new ApiError(422, "Choose a class for the new student.");
      let sectionId = body.sectionId ? String(body.sectionId) : "";
      if (!sectionId) {
        const link = await prisma.classSection.findFirst({ where: { classId } });
        if (!link) throw new ApiError(409, "This class has no sections. Add a section first.");
        sectionId = link.sectionId;
      }
      const link = await prisma.classSection.findUnique({
        where: { classId_sectionId: { classId, sectionId } },
      });
      if (!link) throw new ApiError(422, "The selected section is not linked to this class.");
      if (!admission.phone) throw new ApiError(422, "The application has no phone number.");

      const result = await prisma.$transaction(async (tx) => {
        const counter = await tx.counter.upsert({
          where: { key: "adm" },
          create: { key: "adm", value: 1001 },
          update: { value: { increment: 1 } },
        });
        const admNo = `ICE${counter.value}`;
        const student = await tx.student.create({
          data: {
            admNo,
            name: admission.name,
            gender: admission.gender ?? "Male",
            classId,
            sectionId,
            dob: admission.dob,
            father: admission.father,
            phone: admission.phone,
            email: admission.email,
            address: admission.address,
            admDate: parseYmd(todayYmd())!,
            status: "active",
            portalPassword: `ice@${admNo}`,
          },
        });
        await tx.onlineAdmission.update({
          where: { id },
          data: { status: "Admitted", classId },
        });
        await tx.auditLog.create({
          data: {
            user: user.username,
            act: "admit",
            entity: "online-admission",
            description: `${admission.name} · ${admNo}`,
          },
        });
        return student;
      });
      return { studentId: result.id, admNo: result.admNo };
    }

    case "online-reject": {
      const user = await requirePermission("stu");
      const id = String(body.id ?? "");
      const row = await prisma.onlineAdmission.findUnique({ where: { id } });
      if (!row) throw new ApiError(404, "Application not found.");
      if (row.status !== "Pending") throw new ApiError(409, "This application has already been processed.");
      await prisma.$transaction([
        prisma.onlineAdmission.update({ where: { id }, data: { status: "Rejected" } }),
        prisma.auditLog.create({
          data: {
            user: user.username,
            act: "reject",
            entity: "online-admission",
            description: row.name,
          },
        }),
      ]);
      return { status: "Rejected" };
    }

    case "change-password": {
      const user = await requirePermission("sys");
      const current = String(body.current ?? "");
      const next = String(body.next ?? "");
      if (next.length < 6) throw new ApiError(422, "The new password must be at least 6 characters.");
      const account = await prisma.appUser.findUnique({ where: { id: user.uid } });
      if (!account) throw new ApiError(404, "Account not found.");
      if (!(await bcrypt.compare(current, account.passwordHash))) {
        throw new ApiError(422, "The current password is incorrect.");
      }
      await prisma.appUser.update({
        where: { id: user.uid },
        data: { passwordHash: await bcrypt.hash(next, 10) },
      });
      await prisma.auditLog.create({
        data: { user: user.username, act: "password", entity: "user", description: "Changed own password" },
      });
      return { ok: true };
    }

    default:
      throw new ApiError(404, "Unknown action.");
  }
});
