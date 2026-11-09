import { prisma } from "@/lib/prisma";
import { readJson, route } from "@/lib/http";
import { ApiError } from "@/lib/errors";
import { deleteResource } from "@/lib/resources";
import { parseYmd, todayYmd, toYmd } from "@/lib/dates";
import { Prisma } from "@/lib/prisma-client";
import bcrypt from "bcryptjs";
import {
  requireSchoolContext,
  requireSchoolPermission,
  assertSameSchool,
  validateSameSchool,
  modelHasSchoolId,
} from "@/lib/tenant";
import { authenticateUser } from "@/lib/rbac";

type Ctx = { params: Promise<{ action: string }> };

export const POST = route(async (req: Request, ctx: Ctx) => {
  const { action } = await ctx.params;
  const body = await readJson(req);

  switch (action) {
    case "bulk-delete": {
      const context = await requireSchoolContext();
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
      const context = await requireSchoolPermission("staff.manage");
      const schoolId = context.school.id;
      const month = String(body.month ?? "");
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new ApiError(422, "Month must be YYYY-MM.");

      const staffWhere: Record<string, unknown> = { status: "active" };
      if (schoolId && modelHasSchoolId("Staff")) staffWhere.schoolId = schoolId;
      const staff = await prisma.staff.findMany({ where: staffWhere });
      if (!staff.length) throw new ApiError(409, "There are no active staff to pay.");

      const payrollWhere: Record<string, unknown> = { month };
      if (schoolId && modelHasSchoolId("Payroll")) payrollWhere.schoolId = schoolId;
      const existing = await prisma.payroll.findMany({ where: payrollWhere, select: { staffId: true } });
      const done = new Set(existing.map((p) => p.staffId));

      const rows = staff
        .filter((s) => !done.has(s.id))
        .map((s) => {
          const rowData: Record<string, unknown> = {
            staffId: s.id,
            month,
            basic: s.basic,
            allow: new Prisma.Decimal(0),
            deduct: new Prisma.Decimal(0),
            net: s.basic,
            status: "Generated",
          };
          if (schoolId && modelHasSchoolId("Payroll")) rowData.schoolId = schoolId;
          return rowData;
        });

      if (!rows.length) throw new ApiError(409, "Payroll for this month is already generated.");

      const auditData: Record<string, unknown> = {
        user: context.user.username,
        act: "generate",
        entity: "payroll",
        description: `${month} · ${rows.length} staff`,
      };
      if (schoolId && modelHasSchoolId("AuditLog")) auditData.schoolId = schoolId;

      await prisma.$transaction([
        prisma.payroll.createMany({ data: rows as any }),
        prisma.auditLog.create({
          data: auditData as any,
        }),
      ]);
      return { created: rows.length, month };
    }

    case "payroll-pay": {
      const context = await requireSchoolPermission("fees.update");
      const schoolId = context.school.id;
      const id = String(body.id ?? "");
      const mode = String(body.mode ?? "");
      if (!["Cash", "Bank Transfer", "Cheque"].includes(mode)) {
        throw new ApiError(422, "Choose Cash, Bank Transfer or Cheque.");
      }
      const paidDate = body.date ? parseYmd(String(body.date)) : parseYmd(todayYmd());
      if (!paidDate) throw new ApiError(422, "Payment date is invalid.");

      const payroll = await prisma.payroll.findUnique({ where: { id } });
      if (!payroll) throw new ApiError(404, "Payroll row not found.");
      if ((payroll as Record<string, unknown>).schoolId) {
        assertSameSchool(context, String((payroll as Record<string, unknown>).schoolId));
      }
      if (payroll.status === "Paid") throw new ApiError(409, "This salary is already paid.");

      const updated = await prisma.$transaction(async (tx) => {
        const row = await tx.payroll.update({
          where: { id },
          data: { status: "Paid", mode, paidDate },
        });
        const auditData: Record<string, unknown> = {
          user: context.user.username,
          act: "pay",
          entity: "payroll",
          description: `${payroll.month} · ₹${Number(payroll.net).toFixed(2)}`,
        };
        if (schoolId && modelHasSchoolId("AuditLog")) auditData.schoolId = schoolId;
        await tx.auditLog.create({
          data: auditData as any,
        });
        return row;
      });
      return { status: updated.status, paidDate: updated.paidDate ? toYmd(updated.paidDate) : "" };
    }

    case "book-return": {
      const context = await requireSchoolPermission("library.update");
      const schoolId = context.school.id;
      const id = String(body.id ?? "");
      const issue = await prisma.bookIssue.findUnique({ where: { id }, include: { book: true } });
      if (!issue) throw new ApiError(404, "Issue record not found.");
      if ((issue as Record<string, unknown>).schoolId) {
        assertSameSchool(context, String((issue as Record<string, unknown>).schoolId));
      }
      if (issue.ret) throw new ApiError(409, "This book has already been returned.");
      const ret = body.date ? parseYmd(String(body.date)) : parseYmd(todayYmd());
      if (!ret) throw new ApiError(422, "Return date is invalid.");

      const auditData: Record<string, unknown> = {
        user: context.user.username,
        act: "return",
        entity: "library",
        description: issue.book.title,
      };
      if (schoolId && modelHasSchoolId("AuditLog")) auditData.schoolId = schoolId;

      await prisma.$transaction([
        prisma.bookIssue.update({ where: { id }, data: { ret } }),
        prisma.auditLog.create({
          data: auditData as any,
        }),
      ]);
      return { returned: true, date: toYmd(ret) };
    }

    case "leave-status": {
      const context = await requireSchoolPermission("attendance.update");
      const schoolId = context.school.id;
      const kind = String(body.kind ?? "");
      const id = String(body.id ?? "");
      const status = String(body.status ?? "");
      if (!["Approved", "Rejected", "Pending"].includes(status)) {
        throw new ApiError(422, "Status must be Approved, Rejected or Pending.");
      }
      if (kind === "staff") {
        const row = await prisma.staffLeave.findUnique({ where: { id } });
        if (!row) throw new ApiError(404, "Leave request not found.");
        if ((row as Record<string, unknown>).schoolId) {
          assertSameSchool(context, String((row as Record<string, unknown>).schoolId));
        }
        await prisma.staffLeave.update({ where: { id }, data: { status } });
      } else if (kind === "student") {
        const row = await prisma.studentLeave.findUnique({ where: { id } });
        if (!row) throw new ApiError(404, "Leave request not found.");
        if ((row as Record<string, unknown>).schoolId) {
          assertSameSchool(context, String((row as Record<string, unknown>).schoolId));
        }
        await prisma.studentLeave.update({ where: { id }, data: { status } });
      } else {
        throw new ApiError(422, "Leave kind must be staff or student.");
      }

      const auditData: Record<string, unknown> = {
        user: context.user.username,
        act: status.toLowerCase(),
        entity: `${kind}-leave`,
        description: id,
      };
      if (schoolId && modelHasSchoolId("AuditLog")) auditData.schoolId = schoolId;

      await prisma.auditLog.create({
        data: auditData as any,
      });
      return { status };
    }

    case "student-status": {
      const context = await requireSchoolPermission("student.update");
      const schoolId = context.school.id;
      const id = String(body.id ?? "");
      const status = String(body.status ?? "");
      if (!["active", "disabled"].includes(status)) {
        throw new ApiError(422, "Status must be active or disabled.");
      }
      const student = await prisma.student.findUnique({ where: { id } });
      if (!student) throw new ApiError(404, "Student not found.");
      if ((student as Record<string, unknown>).schoolId) {
        assertSameSchool(context, String((student as Record<string, unknown>).schoolId));
      }
      const reasonId = body.reasonId ? String(body.reasonId) : null;
      if (status === "disabled" && reasonId) {
        const reason = await prisma.disableReason.findUnique({ where: { id: reasonId } });
        if (!reason) throw new ApiError(404, "Disable reason not found.");
        if ((reason as Record<string, unknown>).schoolId) {
          assertSameSchool(context, String((reason as Record<string, unknown>).schoolId));
        }
      }

      const auditData: Record<string, unknown> = {
        user: context.user.username,
        act: status === "disabled" ? "disable" : "enable",
        entity: "student",
        description: student.name,
      };
      if (schoolId && modelHasSchoolId("AuditLog")) auditData.schoolId = schoolId;

      await prisma.$transaction([
        prisma.student.update({
          where: { id },
          data: { status, disReasonId: status === "disabled" ? reasonId : null },
        }),
        prisma.auditLog.create({
          data: auditData as any,
        }),
      ]);
      return { status };
    }

    case "staff-status": {
      const context = await requireSchoolPermission("staff.manage");
      const schoolId = context.school.id;
      const id = String(body.id ?? "");
      const status = String(body.status ?? "");
      if (!["active", "inactive"].includes(status)) {
        throw new ApiError(422, "Status must be active or inactive.");
      }
      const staff = await prisma.staff.findUnique({ where: { id } });
      if (!staff) throw new ApiError(404, "Staff member not found.");
      if ((staff as Record<string, unknown>).schoolId) {
        assertSameSchool(context, String((staff as Record<string, unknown>).schoolId));
      }

      const auditData: Record<string, unknown> = {
        user: context.user.username,
        act: status === "active" ? "enable" : "disable",
        entity: "staff",
        description: staff.name,
      };
      if (schoolId && modelHasSchoolId("AuditLog")) auditData.schoolId = schoolId;

      await prisma.$transaction([
        prisma.staff.update({ where: { id }, data: { status } }),
        prisma.auditLog.create({
          data: auditData as any,
        }),
      ]);
      return { status };
    }

    case "lesson-copy": {
      const context = await requireSchoolPermission("lesson.create");
      const schoolId = context.school.id;
      const fromClassId = String(body.fromClassId ?? "");
      const toClassId = String(body.toClassId ?? "");
      const subjectId = String(body.subjectId ?? "");
      if (!fromClassId || !toClassId || !subjectId) {
        throw new ApiError(422, "Choose source class, target class and subject.");
      }
      if (fromClassId === toClassId) throw new ApiError(422, "Source and target classes must differ.");

      await validateSameSchool(schoolId, [
        { model: "SchoolClass", id: fromClassId },
        { model: "SchoolClass", id: toClassId },
        { model: "Subject", id: subjectId },
      ]);

      const lessonWhere: Record<string, unknown> = { classId: fromClassId, subjectId };
      if (schoolId && modelHasSchoolId("Lesson")) lessonWhere.schoolId = schoolId;

      const lessons = await prisma.lesson.findMany({
        where: lessonWhere,
        include: { topics: true },
      });
      if (!lessons.length) throw new ApiError(409, "There are no lessons to copy for this selection.");

      const targetWhere: Record<string, unknown> = { classId: toClassId, subjectId };
      if (schoolId && modelHasSchoolId("Lesson")) targetWhere.schoolId = schoolId;

      const existing = await prisma.lesson.findMany({
        where: targetWhere,
        select: { name: true },
      });
      const names = new Set(existing.map((l) => l.name));
      let copied = 0;

      await prisma.$transaction(async (tx) => {
        for (const lesson of lessons) {
          if (names.has(lesson.name)) continue;
          const lessonData: Record<string, unknown> = {
            classId: toClassId,
            subjectId,
            name: lesson.name,
          };
          if (schoolId && modelHasSchoolId("Lesson")) lessonData.schoolId = schoolId;

          const created = await tx.lesson.create({
            data: lessonData as any,
          });

          if (lesson.topics.length) {
            const topicRows = lesson.topics.map((topic) => {
              const topicData: Record<string, unknown> = {
                lessonId: created.id,
                name: topic.name,
                planDate: topic.planDate,
                status: "Pending",
              };
              if (schoolId && modelHasSchoolId("Topic")) topicData.schoolId = schoolId;
              return topicData;
            });
            await tx.topic.createMany({
              data: topicRows as any,
            });
          }
          copied++;
        }

        const auditData: Record<string, unknown> = {
          user: context.user.username,
          act: "copy",
          entity: "lesson",
          description: `${copied} lesson(s) copied`,
        };
        if (schoolId && modelHasSchoolId("AuditLog")) auditData.schoolId = schoolId;
        await tx.auditLog.create({
          data: auditData as any,
        });
      });
      return { copied };
    }

    case "online-admit": {
      const context = await requireSchoolPermission("student.create");
      const schoolId = context.school.id;
      const id = String(body.id ?? "");
      const admission = await prisma.onlineAdmission.findUnique({ where: { id } });
      if (!admission) throw new ApiError(404, "Application not found.");
      if ((admission as Record<string, unknown>).schoolId) {
        assertSameSchool(context, String((admission as Record<string, unknown>).schoolId));
      }
      if (admission.status !== "Pending") throw new ApiError(409, "This application has already been processed.");

      const classId = String(body.classId ?? admission.classId ?? "");
      if (!classId) throw new ApiError(422, "Choose a class for the new student.");
      await validateSameSchool(schoolId, [{ model: "SchoolClass", id: classId }]);

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
        const studentData: Record<string, unknown> = {
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
        };
        if (schoolId && modelHasSchoolId("Student")) studentData.schoolId = schoolId;

        const student = await tx.student.create({
          data: studentData as any,
        });

        await tx.onlineAdmission.update({
          where: { id },
          data: { status: "Admitted", classId },
        });

        const auditData: Record<string, unknown> = {
          user: context.user.username,
          act: "admit",
          entity: "online-admission",
          description: `${admission.name} · ${admNo}`,
        };
        if (schoolId && modelHasSchoolId("AuditLog")) auditData.schoolId = schoolId;

        await tx.auditLog.create({
          data: auditData as any,
        });
        return student;
      });
      return { studentId: result.id, admNo: result.admNo };
    }

    case "online-reject": {
      const context = await requireSchoolPermission("student.update");
      const schoolId = context.school.id;
      const id = String(body.id ?? "");
      const row = await prisma.onlineAdmission.findUnique({ where: { id } });
      if (!row) throw new ApiError(404, "Application not found.");
      if ((row as Record<string, unknown>).schoolId) {
        assertSameSchool(context, String((row as Record<string, unknown>).schoolId));
      }
      if (row.status !== "Pending") throw new ApiError(409, "This application has already been processed.");

      const auditData: Record<string, unknown> = {
        user: context.user.username,
        act: "reject",
        entity: "online-admission",
        description: row.name,
      };
      if (schoolId && modelHasSchoolId("AuditLog")) auditData.schoolId = schoolId;

      await prisma.$transaction([
        prisma.onlineAdmission.update({ where: { id }, data: { status: "Rejected" } }),
        prisma.auditLog.create({
          data: auditData as any,
        }),
      ]);
      return { status: "Rejected" };
    }

    case "change-password": {
      const user = await authenticateUser(req);
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
