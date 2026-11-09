import { Prisma } from "@/lib/prisma-client";
import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { parseYmd, todayYmd, toYmd } from "./dates";
import { resolveSchoolContext, assertSameSchool, modelHasSchoolId } from "./tenant";

const D = Prisma.Decimal;
export const ZERO = new D(0);
const r2 = (value: Prisma.Decimal) => value.toDecimalPlaces(2);
const money = (value: Prisma.Decimal) => Number(r2(value).toString());

export type FeePayment = {
  id: string;
  rc: string;
  amount: number;
  discount: number;
  fine: number;
  mode: string;
  date: string;
  note: string;
};

export type FeeRow = {
  key: string;
  name: string;
  group: string;
  amount: number;
  due: string;
  fine: number;
  paid: number;
  disc: number;
  bal: number;
  late: boolean;
  status: "Paid" | "Partial" | "Unpaid";
  payments: FeePayment[];
};

export type FeeStudent = {
  id: string;
  name: string;
  admNo: string;
  father: string;
  phone: string;
  classId: string | null;
  sectionId: string | null;
  className: string | null;
  sectionName: string | null;
  status: string;
};

export type FeeTotals = {
  amount: number;
  paid: number;
  disc: number;
  fine: number;
  bal: number;
  due: number;
};

type Db = Prisma.TransactionClient | typeof prisma;

type MasterRow = Prisma.FeeMasterGetPayload<{
  include: { type: true; group: true };
}>;
type CarryRow = Prisma.CarryForwardGetPayload<Record<string, never>>;
type AssignmentRow = Prisma.TransportAssignmentGetPayload<{ include: { pickup: true } }>;
type PaymentRow = Prisma.PaymentGetPayload<Record<string, never>>;

export function totalsOf(rows: FeeRow[]): FeeTotals {
  let amount = ZERO;
  let paid = ZERO;
  let disc = ZERO;
  let fine = ZERO;
  let bal = ZERO;
  let due = ZERO;
  const today = todayYmd();
  for (const row of rows) {
    amount = amount.plus(row.amount);
    paid = paid.plus(row.paid);
    disc = disc.plus(row.disc);
    fine = fine.plus(row.fine);
    bal = bal.plus(row.bal);
    if (row.bal > 0 && (!row.due || row.due <= today)) due = due.plus(row.bal);
  }
  return {
    amount: money(amount),
    paid: money(paid),
    disc: money(disc),
    fine: money(fine),
    bal: money(bal),
    due: money(due),
  };
}

function buildRows(
  student: FeeStudent,
  masters: MasterRow[],
  carries: CarryRow[],
  assignments: AssignmentRow[],
  transportFees: Map<string, { monthlyFee: Prisma.Decimal; months: number; fine: Prisma.Decimal }>,
  payments: PaymentRow[],
): FeeRow[] {
  const rows: Omit<FeeRow, "paid" | "disc" | "bal" | "late" | "status" | "payments">[] = [];

  for (const master of masters.filter((m) => m.classId === student.classId)) {
    rows.push({
      key: master.id,
      name: `${master.type.name}${master.label ? ` - ${master.label}` : ""}`,
      group: master.group.name,
      amount: money(master.amount),
      due: master.due ? toYmd(master.due) : "",
      fine: money(master.fine),
    });
  }

  for (const carry of carries.filter((c) => c.studentId === student.id)) {
    rows.push({
      key: `cf${carry.id}`,
      name: `Previous balance (${carry.fromSession})`,
      group: "Carry Forward",
      amount: money(carry.amount),
      due: carry.due ? toYmd(carry.due) : "",
      fine: 0,
    });
  }

  for (const assignment of assignments.filter((a) => a.studentId === student.id)) {
    const fee = transportFees.get(assignment.pickupId);
    if (!fee) continue;
    rows.push({
      key: `tp${assignment.id}`,
      name: `Transport (${assignment.pickup.name})`,
      group: "Transport",
      amount: money(new D(fee.monthlyFee).mul(fee.months)),
      due: assignment.due ? toYmd(assignment.due) : "",
      fine: money(fee.fine),
    });
  }

  const today = todayYmd();
  return rows.map((row) => {
    const pays = payments.filter((p) => p.feeKey === row.key);
    let paid = ZERO;
    let disc = ZERO;
    for (const p of pays) {
      paid = paid.plus(p.amount);
      disc = disc.plus(p.discount);
    }
    const amount = new D(row.amount);
    const bal = D.max(new D(0), r2(amount.minus(paid).minus(disc)));
    const balNum = money(bal);
    const paidNum = money(paid);
    const discNum = money(disc);
    return {
      ...row,
      paid: paidNum,
      disc: discNum,
      bal: balNum,
      late: balNum > 0 && !!row.due && row.due < today,
      status: balNum === 0 ? "Paid" : paidNum + discNum > 0 ? "Partial" : "Unpaid",
      payments: pays
        .slice()
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((p) => ({
          id: p.id,
          rc: p.rc,
          amount: money(p.amount),
          discount: money(p.discount),
          fine: money(p.fine),
          mode: p.mode,
          date: toYmd(p.date),
          note: p.note ?? "",
        })),
    };
  });
}

function studentBase(student: {
  id: string;
  name: string;
  admNo: string;
  father: string | null;
  phone: string | null;
  classId: string | null;
  sectionId: string | null;
  status: string;
  className?: string | null;
  sectionName?: string | null;
}): FeeStudent {
  return {
    id: student.id,
    name: student.name,
    admNo: student.admNo,
    father: student.father ?? "",
    phone: student.phone ?? "",
    classId: student.classId,
    sectionId: student.sectionId,
    className: student.className ?? null,
    sectionName: student.sectionName ?? null,
    status: student.status,
  };
}

export async function getStudentFees(studentId: string, tenantSchoolId?: string) {
  return loadStudentFees(prisma, studentId, tenantSchoolId);
}

async function loadStudentFees(db: Db, studentId: string, tenantSchoolId?: string) {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { class: true, section: true },
  });
  if (!student) throw new ApiError(404, "Student not found.");
  if (tenantSchoolId) {
    assertSameSchool(tenantSchoolId, (student as any).schoolId);
  }

  const [masters, carries, assignments, payments] = await Promise.all([
    db.feeMaster.findMany({
      where: { classId: student.classId ?? "__none__" },
      include: { type: true, group: true },
      orderBy: { due: "asc" },
    }),
    db.carryForward.findMany({ where: { studentId } }),
    db.transportAssignment.findMany({ where: { studentId }, include: { pickup: true } }),
    db.payment.findMany({ where: { studentId } }),
  ]);

  const pickupIds = assignments.map((a) => a.pickupId);
  const fees = pickupIds.length
    ? await db.transportFee.findMany({ where: { pickupId: { in: pickupIds } } })
    : [];
  const feeMap = new Map(
    fees.map((f) => [f.pickupId, { monthlyFee: f.monthlyFee, months: f.months, fine: f.fine }]),
  );

  const base = studentBase({
    ...student,
    className: student.class?.name ?? null,
    sectionName: student.section?.name ?? null,
  });
  const rows = buildRows(base, masters, carries, assignments, feeMap, payments);
  return { student: base, rows, totals: totalsOf(rows) };
}

export async function loadAllFeeData(tenantSchoolId?: string) {
  const tenantCtx = await resolveSchoolContext();
  const schoolId = tenantSchoolId ?? tenantCtx?.school.id;

  const studentWhere: Record<string, unknown> = { status: "active" };
  if (schoolId && modelHasSchoolId("Student")) studentWhere.schoolId = schoolId;

  const masterWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("FeeMaster")) masterWhere.schoolId = schoolId;

  const carryWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("CarryForward")) carryWhere.schoolId = schoolId;

  const assignmentWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("TransportAssignment")) assignmentWhere.schoolId = schoolId;

  const feeWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("TransportFee")) feeWhere.schoolId = schoolId;

  const paymentWhere: Record<string, unknown> = {};
  if (schoolId && modelHasSchoolId("Payment")) paymentWhere.schoolId = schoolId;

  const [students, masters, carries, assignments, transportFees, payments] = await Promise.all([
    prisma.student.findMany({
      where: studentWhere,
      include: { class: true, section: true },
      orderBy: { name: "asc" },
    }),
    prisma.feeMaster.findMany({ where: masterWhere, include: { type: true, group: true }, orderBy: { due: "asc" } }),
    prisma.carryForward.findMany({ where: carryWhere }),
    prisma.transportAssignment.findMany({ where: assignmentWhere, include: { pickup: true } }),
    prisma.transportFee.findMany({ where: feeWhere }),
    prisma.payment.findMany({ where: paymentWhere }),
  ]);

  const scopedStudents = schoolId
    ? students.filter((s: Record<string, unknown>) => !s.schoolId || s.schoolId === schoolId)
    : students;
  const scopedMasters = schoolId
    ? masters.filter((m: Record<string, unknown>) => !m.schoolId || m.schoolId === schoolId)
    : masters;
  const scopedCarries = schoolId
    ? carries.filter((c: Record<string, unknown>) => !c.schoolId || c.schoolId === schoolId)
    : carries;
  const scopedAssignments = schoolId
    ? assignments.filter((a: Record<string, unknown>) => !a.schoolId || a.schoolId === schoolId)
    : assignments;
  const scopedPayments = schoolId
    ? payments.filter((p: Record<string, unknown>) => !p.schoolId || p.schoolId === schoolId)
    : payments;

  const mastersByClass = new Map<string, MasterRow[]>();
  for (const master of scopedMasters) {
    const list = mastersByClass.get(master.classId) ?? [];
    list.push(master);
    mastersByClass.set(master.classId, list);
  }
  const feeMap = new Map(
    transportFees.map((f) => [
      f.pickupId,
      { monthlyFee: f.monthlyFee, months: f.months, fine: f.fine },
    ]),
  );

  return scopedStudents.map((student) => {
    const base = studentBase({
      ...student,
      className: student.class?.name ?? null,
      sectionName: student.section?.name ?? null,
    });
    const rows = buildRows(
      base,
      mastersByClass.get(student.classId ?? "") ?? [],
      scopedCarries,
      scopedAssignments,
      feeMap,
      scopedPayments,
    );
    return { student: base, rows, totals: totalsOf(rows) };
  });
}

export async function pendingFees(tenantSchoolId?: string) {
  const all = await loadAllFeeData(tenantSchoolId);
  return all
    .map((item) => ({ ...item, dueNow: item.totals.due }))
    .filter((item) => item.dueNow > 0)
    .sort((a, b) => b.dueNow - a.dueNow);
}

export async function dueFeeRows(
  opts: {
    classId?: string;
    sectionId?: string;
    type?: string;
  },
  tenantSchoolId?: string,
) {
  const all = await loadAllFeeData(tenantSchoolId);
  const out: {
    studentId: string;
    student: string;
    admNo: string;
    className: string;
    sectionName: string;
    fee: string;
    due: string;
    amount: number;
    paid: number;
    balance: number;
    status: string;
  }[] = [];

  for (const item of all) {
    if (opts.classId && item.student.classId !== opts.classId) continue;
    if (opts.sectionId && item.student.sectionId !== opts.sectionId) continue;
    for (const row of item.rows) {
      if (row.bal <= 0) continue;
      if (opts.type && !row.name.startsWith(opts.type)) continue;
      out.push({
        studentId: item.student.id,
        student: item.student.name,
        admNo: item.student.admNo,
        className: item.student.className ?? "",
        sectionName: item.student.sectionName ?? "",
        fee: row.name,
        due: row.due,
        amount: row.amount,
        paid: row.paid + row.disc,
        balance: row.bal,
        status: row.late ? "Overdue" : row.due ? "Upcoming" : "No due date",
      });
    }
  }
  return out;
}

/** Recompute one fee row inside a transaction (used when collecting a payment). */
async function loadRowForUpdate(tx: Prisma.TransactionClient, studentId: string, feeKey: string) {
  const tenantCtx = await resolveSchoolContext();
  const student = await tx.student.findUnique({ where: { id: studentId } });
  if (!student) throw new ApiError(404, "Student not found.");
  if (tenantCtx && (student as Record<string, unknown>).schoolId) {
    assertSameSchool(tenantCtx, String((student as Record<string, unknown>).schoolId));
  }
  const payments = await tx.payment.findMany({ where: { studentId } });

  let amount = ZERO;
  let name = "Fee";
  let group = "Fees";
  let due = "";
  let fine = ZERO;

  if (feeKey.startsWith("cf")) {
    const carry = await tx.carryForward.findUnique({ where: { id: feeKey.slice(2) } });
    if (!carry || carry.studentId !== studentId) throw new ApiError(404, "Fee row not found.");
    amount = carry.amount;
    name = `Previous balance (${carry.fromSession})`;
    group = "Carry Forward";
    due = carry.due ? toYmd(carry.due) : "";
  } else if (feeKey.startsWith("tp")) {
    const assignment = await tx.transportAssignment.findUnique({
      where: { id: feeKey.slice(2) },
      include: { pickup: true },
    });
    if (!assignment || assignment.studentId !== studentId) {
      throw new ApiError(404, "Fee row not found.");
    }
    const fee = await tx.transportFee.findUnique({ where: { pickupId: assignment.pickupId } });
    if (!fee) throw new ApiError(409, "Transport fee is not configured for this pickup point.");
    amount = new D(fee.monthlyFee).mul(fee.months);
    fine = fee.fine;
    name = `Transport (${assignment.pickup.name})`;
    group = "Transport";
    due = assignment.due ? toYmd(assignment.due) : "";
  } else {
    const master = await tx.feeMaster.findUnique({
      where: { id: feeKey },
      include: { type: true, group: true },
    });
    if (!master || master.classId !== student.classId) throw new ApiError(404, "Fee row not found.");
    amount = master.amount;
    fine = master.fine;
    name = `${master.type.name}${master.label ? ` - ${master.label}` : ""}`;
    group = master.group.name;
    due = master.due ? toYmd(master.due) : "";
  }

  let paid = ZERO;
  let disc = ZERO;
  for (const p of payments.filter((p) => p.feeKey === feeKey)) {
    paid = paid.plus(p.amount);
    disc = disc.plus(p.discount);
  }
  const bal = D.max(new D(0), r2(amount.minus(paid).minus(disc)));
  return {
    student,
    amount: r2(amount),
    name,
    group,
    due,
    fine: r2(fine),
    balance: bal,
  };
}

export async function collectFees(input: {
  studentId: string;
  feeKey: string;
  amount: number;
  discountId?: string | null;
  fine?: number;
  mode: string;
  date?: string;
  note?: string;
  username: string;
}) {
  const amount = new D(input.amount);
  if (!amount.isFinite() || amount.lte(0)) throw new ApiError(422, "Amount must be greater than zero.");
  const mode = input.mode?.trim();
  if (!mode) throw new ApiError(422, "Payment mode is required.");
  const date = input.date ? parseYmd(input.date) : parseYmd(todayYmd());
  if (!date) throw new ApiError(422, "Payment date is invalid.");
  const fine = new D(input.fine ?? 0);
  if (!fine.isFinite() || fine.lt(0)) throw new ApiError(422, "Fine cannot be negative.");

  return prisma.$transaction(async (tx) => {
    const row = await loadRowForUpdate(tx, input.studentId, input.feeKey);
    let discount = ZERO;
    if (input.discountId) {
      const d = await tx.feeDiscount.findUnique({ where: { id: input.discountId } });
      if (!d) throw new ApiError(404, "Discount not found.");
      discount =
        d.type === "Percent"
          ? r2(row.amount.mul(d.amount).div(100))
          : r2(D.min(d.amount, row.balance));
    }

    if (amount.plus(discount).gt(row.balance.plus("0.01"))) {
      throw new ApiError(
        422,
        `Amount plus discount is more than the balance of ₹${money(row.balance).toLocaleString("en-IN")}.`,
      );
    }

    const tenantCtx = await resolveSchoolContext();
    const schoolId = tenantCtx?.school.id;

    const counter = await tx.counter.upsert({
      where: { key: "receipt" },
      create: { key: "receipt", value: 1001 },
      update: { value: { increment: 1 } },
    });
    const paymentData: Record<string, unknown> = {
      rc: `RCPT-${counter.value}`,
      studentId: input.studentId,
      feeKey: input.feeKey,
      amount: r2(amount),
      discount: r2(discount),
      fine: r2(fine),
      mode,
      date,
      note: input.note?.trim() || null,
    };
    if (schoolId && modelHasSchoolId("Payment")) paymentData.schoolId = schoolId;
    const payment = await tx.payment.create({
      data: paymentData as any,
    });
    const auditData: Record<string, unknown> = {
      user: input.username,
      act: "collect",
      entity: "fees",
      description: `${row.student.name} ₹${money(amount).toFixed(2)} (${row.name})`,
    };
    if (schoolId && modelHasSchoolId("AuditLog")) auditData.schoolId = schoolId;
    await tx.auditLog.create({
      data: auditData as any,
    });
    return {
      payment: {
        id: payment.id,
        rc: payment.rc,
        amount: money(payment.amount),
        discount: money(payment.discount),
        fine: money(payment.fine),
        mode: payment.mode,
        date: toYmd(payment.date),
        note: payment.note ?? "",
      },
      student: {
        id: row.student.id,
        name: row.student.name,
        admNo: row.student.admNo,
        father: row.student.father ?? "",
      },
      fee: { key: input.feeKey, name: row.name, group: row.group, balance: money(row.balance) },
      balanceAfter: money(row.balance.minus(amount).minus(discount)),
    };
  });
}

export async function collectAllDues(input: {
  studentId: string;
  mode: string;
  date?: string;
  username: string;
}) {
  const tenantCtx = await resolveSchoolContext();
  const schoolId = tenantCtx?.school.id;
  const { rows, student, totals } = await getStudentFees(input.studentId);
  const payable = rows.filter((r) => r.bal > 0);
  if (!payable.length) throw new ApiError(409, "There is nothing to collect for this student.");

  const date = input.date ? parseYmd(input.date) : parseYmd(todayYmd());
  if (!date) throw new ApiError(422, "Payment date is invalid.");

  return prisma.$transaction(async (tx) => {
    const created: string[] = [];
    for (const row of payable) {
      const counter = await tx.counter.upsert({
        where: { key: "receipt" },
        create: { key: "receipt", value: 1001 },
        update: { value: { increment: 1 } },
      });
      const paymentData: Record<string, unknown> = {
        rc: `RCPT-${counter.value}`,
        studentId: input.studentId,
        feeKey: row.key,
        amount: new D(row.bal),
        discount: new D(0),
        fine: new D(0),
        mode: input.mode,
        date,
        note: "Collected in bulk",
      };
      if (schoolId && modelHasSchoolId("Payment")) paymentData.schoolId = schoolId;
      const payment = await tx.payment.create({
        data: paymentData as any,
      });
      created.push(payment.rc);
    }
    const auditData: Record<string, unknown> = {
      user: input.username,
      act: "collect",
      entity: "fees",
      description: `${student.name} bulk ₹${totals.bal.toFixed(2)}`,
    };
    if (schoolId && modelHasSchoolId("AuditLog")) auditData.schoolId = schoolId;
    await tx.auditLog.create({
      data: auditData as any,
    });
    return { collected: totals.bal, receipts: created, count: created.length };
  });
}

export async function revertPayment(paymentId: string, username: string) {
  const tenantCtx = await resolveSchoolContext();
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new ApiError(404, "Payment not found.");
    if (tenantCtx && (payment as Record<string, unknown>).schoolId) {
      assertSameSchool(tenantCtx, String((payment as Record<string, unknown>).schoolId));
    }
    await tx.payment.delete({ where: { id: paymentId } });
    const auditData: Record<string, unknown> = {
      user: username,
      act: "revert",
      entity: "payment",
      description: `${payment.rc} ₹${money(payment.amount).toFixed(2)}`,
    };
    if (tenantCtx?.school.id && modelHasSchoolId("AuditLog")) auditData.schoolId = tenantCtx.school.id;
    await tx.auditLog.create({
      data: auditData as any,
    });
    return { ok: true };
  });
}

export async function paymentReceipt(paymentId: string) {
  const tenantCtx = await resolveSchoolContext();
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      student: { include: { class: true, section: true } },
    },
  });
  if (!payment) throw new ApiError(404, "Payment not found.");
  if (tenantCtx && (payment as Record<string, unknown>).schoolId) {
    assertSameSchool(tenantCtx, String((payment as Record<string, unknown>).schoolId));
  }
  const { rows } = await getStudentFees(payment.studentId);
  const row = rows.find((r) => r.key === payment.feeKey);
  return {
    payment: {
      id: payment.id,
      rc: payment.rc,
      amount: money(payment.amount),
      discount: money(payment.discount),
      fine: money(payment.fine),
      mode: payment.mode,
      date: toYmd(payment.date),
      note: payment.note ?? "",
    },
    feeName: row?.name ?? "Fee",
    student: {
      id: payment.student.id,
      name: payment.student.name,
      admNo: payment.student.admNo,
      father: payment.student.father ?? "",
      className: payment.student.class?.name ?? "",
      sectionName: payment.student.section?.name ?? "",
    },
  };
}

export async function bankPaymentAction(id: string, action: "approve" | "reject", username: string) {
  const tenantCtx = await resolveSchoolContext();
  const schoolId = tenantCtx?.school.id;
  return prisma.$transaction(async (tx) => {
    const bank = await tx.bankPayment.findUnique({ where: { id } });
    if (!bank) throw new ApiError(404, "Bank payment not found.");
    if (tenantCtx && (bank as Record<string, unknown>).schoolId) {
      assertSameSchool(tenantCtx, String((bank as Record<string, unknown>).schoolId));
    }
    if (bank.status !== "Pending") throw new ApiError(409, "This payment has already been processed.");
    if (action === "reject") {
      const updated = await tx.bankPayment.update({
        where: { id },
        data: { status: "Rejected" },
      });
      const auditData: Record<string, unknown> = {
        user: username,
        act: "reject",
        entity: "bank-payment",
        description: bank.ref,
      };
      if (schoolId && modelHasSchoolId("AuditLog")) auditData.schoolId = schoolId;
      await tx.auditLog.create({
        data: auditData as any,
      });
      return { status: updated.status, posted: 0 };
    }

    const student = await tx.student.findUnique({ where: { id: bank.studentId } });
    if (!student) throw new ApiError(404, "Student not found.");
    if (tenantCtx && (student as Record<string, unknown>).schoolId) {
      assertSameSchool(tenantCtx, String((student as Record<string, unknown>).schoolId));
    }

    const { rows } = await loadStudentFees(tx, bank.studentId);
    const target = rows.find((r) => r.bal > 0);
    if (!target) throw new ApiError(409, "This student has no pending fee.");

    const amount = D.min(new D(bank.amount), new D(target.bal));
    const counter = await tx.counter.upsert({
      where: { key: "receipt" },
      create: { key: "receipt", value: 1001 },
      update: { value: { increment: 1 } },
    });
    const paymentData: Record<string, unknown> = {
      rc: `RCPT-${counter.value}`,
      studentId: bank.studentId,
      feeKey: target.key,
      amount: r2(amount),
      discount: new D(0),
      fine: new D(0),
      mode: "Bank Transfer",
      date: bank.date,
      note: `Bank ref ${bank.ref}`,
    };
    if (schoolId && modelHasSchoolId("Payment")) paymentData.schoolId = schoolId;

    await tx.payment.create({
      data: paymentData as any,
    });
    await tx.bankPayment.update({ where: { id }, data: { status: "Approved" } });
    const auditData: Record<string, unknown> = {
      user: username,
      act: "approve",
      entity: "bank-payment",
      description: `${bank.ref} ₹${money(amount).toFixed(2)}`,
    };
    if (schoolId && modelHasSchoolId("AuditLog")) auditData.schoolId = schoolId;
    await tx.auditLog.create({
      data: auditData as any,
    });
    return { status: "Approved", posted: money(amount), fee: target.name };
  });
}
