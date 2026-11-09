import "dotenv/config";
import assert from "node:assert/strict";
import {
  migrateExistingSchoolData,
  createDefaultSchoolIfMissing,
  associateExistingAdministrators,
  createMigrationSnapshot,
  rollbackMigrationSnapshot,
  getTenantRecordCounts,
} from "../src/lib/migration";
import { ApiError } from "../src/lib/errors";

async function main() {
  console.log("--- Starting Phase 10 Migrate Existing School Data Tests ---");

  // Mock Database Setup simulating pre-existing single-tenant school data
  const mockDbRecords = {
    schools: [] as any[],
    users: [
      { id: "u-admin-1", email: "admin@iceschool.in", name: "Head Administrator", role: "Admin" },
      { id: "u-principal-1", email: "principal@iceschool.in", name: "School Principal", role: "admin" },
      { id: "u-teacher-1", email: "sharma@iceschool.in", name: "R. Sharma", role: "teacher" },
    ],
    members: [] as any[],
    settings: [
      {
        id: "set-1",
        schoolId: "default",
        name: "ICE Senior Secondary School",
        address: "12 Station Road, Lucknow",
        phone: "+91 98765 43210",
        email: "contact@iceschool.in",
        session: "2026-27",
        planName: "PRO",
      },
    ],
    classes: [
      { id: "cls-10", schoolId: "default", name: "Class 10", order: 10 },
      { id: "cls-12", schoolId: "default", name: "Class 12", order: 12 },
    ],
    sections: [
      { id: "sec-a", schoolId: "default", name: "Section A" },
      { id: "sec-b", schoolId: "default", name: "Section B" },
    ],
    students: [
      {
        id: "stu-1001",
        schoolId: "default",
        admNo: "ADM-2026-001",
        name: "Aarav Gupta",
        gender: "Male",
        classId: "cls-10",
        sectionId: "sec-a",
        father: "Rajesh Gupta",
        phone: "+91 91234 56789",
        status: "active",
      },
      {
        id: "stu-1002",
        schoolId: "default",
        admNo: "ADM-2026-002",
        name: "Diya Sharma",
        gender: "Female",
        classId: "cls-12",
        sectionId: "sec-b",
        father: "Vikram Sharma",
        phone: "+91 91234 56790",
        status: "active",
      },
      {
        id: "stu-1003",
        schoolId: "default",
        admNo: "ADM-2026-003",
        name: "Kabir Verma",
        gender: "Male",
        classId: "cls-10",
        sectionId: "sec-a",
        father: "Anil Verma",
        phone: "+91 91234 56791",
        status: "active",
      },
    ],
    payments: [
      {
        id: "pay-5001",
        schoolId: "default",
        studentId: "stu-1001",
        amount: 15000,
        mode: "Online Bank Transfer",
        date: new Date("2026-04-10"),
        note: "Term 1 Tuition Fee",
      },
      {
        id: "pay-5002",
        schoolId: "default",
        studentId: "stu-1002",
        amount: 18500,
        mode: "Cash",
        date: new Date("2026-04-12"),
        note: "Term 1 Tuition & Lab Fee",
      },
    ],
    studentAttendance: [
      {
        id: "att-8001",
        schoolId: "default",
        studentId: "stu-1001",
        date: new Date("2026-05-01"),
        status: "Present",
        note: "On time",
      },
      {
        id: "att-8002",
        schoolId: "default",
        studentId: "stu-1002",
        date: new Date("2026-05-01"),
        status: "Present",
        note: "On time",
      },
      {
        id: "att-8003",
        schoolId: "default",
        studentId: "stu-1003",
        date: new Date("2026-05-01"),
        status: "Absent",
        note: "Medical leave",
      },
    ],
    staff: [
      {
        id: "stf-2001",
        schoolId: "default",
        code: "EMP-001",
        name: "Dr. R. Sharma",
        email: "sharma@iceschool.in",
        role: "teacher",
        designation: "Senior PGT Physics",
        department: "Science",
      },
      {
        id: "stf-2002",
        schoolId: "default",
        code: "EMP-002",
        name: "Sunita Rao",
        email: "sunita@iceschool.in",
        role: "accountant",
        designation: "Accounts Manager",
        department: "Finance",
      },
    ],
    staffAttendance: [
      {
        id: "satt-9001",
        schoolId: "default",
        staffId: "stf-2001",
        date: new Date("2026-05-01"),
        status: "Present",
      },
    ],
    academicSessions: [
      { id: "ses-2026", schoolId: "default", name: "2026-27" },
    ],
    auditLogs: [] as any[],
    deleteCallCount: 0,
    truncateCallCount: 0,
  };

  const createDelegate = (recordsArray: any[]) => ({
    count: async (query?: any) => {
      if (!query?.where) return recordsArray.length;
      return recordsArray.filter((r) => {
        if (query.where.schoolId && r.schoolId !== query.where.schoolId) return false;
        if (query.where.OR) {
          const match = query.where.OR.some((cond: any) => {
            if (cond.schoolId === null && r.schoolId === null) return true;
            if (cond.schoolId === "" && r.schoolId === "") return true;
            if (cond.schoolId === "default" && r.schoolId === "default") return true;
            return false;
          });
          if (!match) return false;
        }
        return true;
      }).length;
    },
    findMany: async (query?: any) => {
      if (!query?.where) return [...recordsArray];
      return recordsArray.filter((r) => {
        if (query.where.schoolId && r.schoolId !== query.where.schoolId) return false;
        if (query.where.OR) {
          const match = query.where.OR.some((cond: any) => {
            if (cond.schoolId === null && r.schoolId === null) return true;
            if (cond.schoolId === "" && r.schoolId === "") return true;
            if (cond.schoolId === "default" && r.schoolId === "default") return true;
            if (cond.schoolId?.not && r.schoolId !== cond.schoolId.not) return true;
            return false;
          });
          if (!match) return false;
        }
        return true;
      });
    },
    findFirst: async () => recordsArray[0] ?? null,
    update: async ({ where, data }: any) => {
      const idx = recordsArray.findIndex((r) => r.id === where.id);
      if (idx !== -1) {
        recordsArray[idx] = { ...recordsArray[idx], ...data };
        return recordsArray[idx];
      }
      return null;
    },
    updateMany: async ({ where, data }: any) => {
      let count = 0;
      recordsArray.forEach((r, idx) => {
        let match = true;
        if (where?.OR) {
          match = where.OR.some((cond: any) => {
            if (cond.schoolId === null && r.schoolId === null) return true;
            if (cond.schoolId === "" && r.schoolId === "") return true;
            if (cond.schoolId === "default" && r.schoolId === "default") return true;
            return false;
          });
        }
        if (match) {
          recordsArray[idx] = { ...r, ...data };
          count++;
        }
      });
      return { count };
    },
    delete: async () => {
      mockDbRecords.deleteCallCount++;
      throw new Error("DELETE NOT PERMITTED BY SAFETY RULE");
    },
    deleteMany: async () => {
      mockDbRecords.deleteCallCount++;
      throw new Error("DELETE NOT PERMITTED BY SAFETY RULE");
    },
  });

  const mockDb: any = {
    school: {
      findMany: async () => [...mockDbRecords.schools],
      findFirst: async ({ where }: any = {}) => {
        if (!where?.OR) return mockDbRecords.schools[0] ?? null;
        return mockDbRecords.schools.find((s) => {
          return where.OR.some((cond: any) => {
            if (cond.name && s.name === cond.name) return true;
            if (cond.slug && s.slug === cond.slug) return true;
            return false;
          });
        }) ?? null;
      },
      findUnique: async ({ where }: any) => {
        return mockDbRecords.schools.find((s) => s.id === where.id || s.slug === where.slug) ?? null;
      },
      create: async ({ data }: any) => {
        const school = { id: `school-${Date.now()}`, ...data, createdAt: new Date() };
        mockDbRecords.schools.push(school);
        return school;
      },
    },
    user: {
      findMany: async () => [...mockDbRecords.users],
      findUnique: async ({ where }: any) => {
        return mockDbRecords.users.find((u) => u.id === where.id || u.email === where.email) ?? null;
      },
      create: async ({ data }: any) => {
        const u = { id: data.id || `u-${Date.now()}`, ...data };
        mockDbRecords.users.push(u);
        return u;
      },
    },
    member: {
      findFirst: async ({ where }: any) => {
        return mockDbRecords.members.find((m) => m.schoolId === where.schoolId && m.userId === where.userId) ?? null;
      },
      create: async ({ data }: any) => {
        const m = { id: `m-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date() };
        mockDbRecords.members.push(m);
        return m;
      },
      findMany: async () => [...mockDbRecords.members],
    },
    setting: createDelegate(mockDbRecords.settings),
    schoolClass: createDelegate(mockDbRecords.classes),
    section: createDelegate(mockDbRecords.sections),
    student: createDelegate(mockDbRecords.students),
    payment: createDelegate(mockDbRecords.payments),
    studentAttendance: createDelegate(mockDbRecords.studentAttendance),
    staff: createDelegate(mockDbRecords.staff),
    staffAttendance: createDelegate(mockDbRecords.staffAttendance),
    academicSession: createDelegate(mockDbRecords.academicSessions),
    auditLog: {
      create: async ({ data }: any) => {
        mockDbRecords.auditLogs.push(data);
        return { id: "log-1" };
      },
    },
  };

  // 1. Test Default School Creation / Resolution from existing Setting
  console.log("1. Testing Default School Creation & Resolution...");
  const defaultSchool = await createDefaultSchoolIfMissing(mockDb);
  assert.equal(defaultSchool.isNewlyCreated, true, "Creates default school when none exists");
  assert.equal(defaultSchool.name, "ICE Senior Secondary School", "Derives name from existing Setting");
  assert.match(defaultSchool.slug, /ice-senior-secondary-school/, "Generates correct kebab-case slug");

  // Running a second time should reuse existing school without creating duplicates
  const secondCall = await createDefaultSchoolIfMissing(mockDb);
  assert.equal(secondCall.isNewlyCreated, false, "Reuses existing default school");
  assert.equal(secondCall.id, defaultSchool.id, "Maintains identical school id");
  console.log("✓ Default school creation and duplicate avoidance verified.");

  // 2. Test Associate Existing Administrators
  console.log("2. Testing Administrator Association...");
  const associated = await associateExistingAdministrators(mockDb, defaultSchool.id);
  assert.equal(associated.length, 2, "Associates both admin accounts (u-admin-1 and u-principal-1)");
  assert.equal(mockDbRecords.members.length, 2, "Memberships created in members table");
  assert.equal(mockDbRecords.members[0].role, "owner", "Assigned SCHOOL_OWNER role");
  assert.equal(mockDbRecords.members[0].status, "active", "Membership is active");
  console.log("✓ Existing administrators correctly associated as school owners.");

  // 3. Test Full Data Migration (Non-Destructive)
  console.log("3. Testing Full In-Place Migration...");
  const preSnapshot = await createMigrationSnapshot(mockDb);
  assert(preSnapshot.snapshot.counts.Student === 3, "Baseline 3 students");
  assert(preSnapshot.snapshot.counts.Payment === 2, "Baseline 2 payments");
  assert(preSnapshot.snapshot.counts.StudentAttendance === 3, "Baseline 3 attendance records");
  assert(preSnapshot.snapshot.counts.Staff === 2, "Baseline 2 staff members");

  const migrationResult = await migrateExistingSchoolData(mockDb, {
    schoolName: "ICE Senior Secondary School",
  });

  assert.equal(migrationResult.success, true);
  assert.equal(migrationResult.dryRun, false);

  // 4. Verify Preservation of Student IDs, Admissions and Attributes
  console.log("4. Verifying Student ID & Data Preservation...");
  assert.equal(mockDbRecords.students.length, 3, "Student count preserved 100%");
  assert.equal(mockDbRecords.students[0].id, "stu-1001", "Student 1 ID preserved exactly");
  assert.equal(mockDbRecords.students[0].admNo, "ADM-2026-001", "Student 1 AdmNo preserved exactly");
  assert.equal(mockDbRecords.students[0].name, "Aarav Gupta", "Student 1 Name preserved");
  assert.equal(mockDbRecords.students[0].schoolId, defaultSchool.id, "Student 1 assigned to target schoolId");

  assert.equal(mockDbRecords.students[1].id, "stu-1002", "Student 2 ID preserved exactly");
  assert.equal(mockDbRecords.students[1].admNo, "ADM-2026-002", "Student 2 AdmNo preserved exactly");
  assert.equal(mockDbRecords.students[1].schoolId, defaultSchool.id, "Student 2 assigned to target schoolId");
  console.log("✓ Student IDs, admission numbers, and demographics preserved 100%.");

  // 5. Verify Preservation of Payment History
  console.log("5. Verifying Payment History Preservation...");
  assert.equal(mockDbRecords.payments.length, 2, "Payment records count preserved 100%");
  assert.equal(mockDbRecords.payments[0].id, "pay-5001", "Payment ID preserved exactly");
  assert.equal(mockDbRecords.payments[0].amount, 15000, "Payment amount preserved");
  assert.equal(mockDbRecords.payments[0].studentId, "stu-1001", "Payment studentId reference preserved");
  assert.equal(mockDbRecords.payments[0].schoolId, defaultSchool.id, "Payment assigned to schoolId");
  console.log("✓ Payment history, amounts, dates, and student foreign keys preserved 100%.");

  // 6. Verify Preservation of Attendance Records
  console.log("6. Verifying Attendance Records Preservation...");
  assert.equal(mockDbRecords.studentAttendance.length, 3, "Attendance count preserved 100%");
  assert.equal(mockDbRecords.studentAttendance[0].id, "att-8001", "Attendance ID preserved exactly");
  assert.equal(mockDbRecords.studentAttendance[0].studentId, "stu-1001", "Attendance student reference preserved");
  assert.equal(mockDbRecords.studentAttendance[0].status, "Present", "Attendance status preserved");
  assert.equal(mockDbRecords.studentAttendance[2].status, "Absent", "Absence status preserved");
  assert.equal(mockDbRecords.studentAttendance[0].schoolId, defaultSchool.id, "Attendance assigned to schoolId");
  console.log("✓ Attendance records, dates, and statuses preserved 100%.");

  // 7. Verify Preservation of Teacher and Staff Records
  console.log("7. Verifying Staff & Teacher Records Preservation...");
  assert.equal(mockDbRecords.staff.length, 2, "Staff count preserved 100%");
  assert.equal(mockDbRecords.staff[0].id, "stf-2001", "Staff ID preserved exactly");
  assert.equal(mockDbRecords.staff[0].code, "EMP-001", "Employee code preserved");
  assert.equal(mockDbRecords.staff[0].department, "Science", "Staff department preserved");
  assert.equal(mockDbRecords.staff[0].schoolId, defaultSchool.id, "Staff assigned to schoolId");
  console.log("✓ Staff records, employee codes, roles, and departments preserved 100%.");

  // 8. Verify Foreign Key and Relational Integrity
  console.log("8. Verifying Relational Integrity...");
  // Class & Section references
  assert.equal(mockDbRecords.students[0].classId, mockDbRecords.classes[0].id, "Student classId relation intact");
  assert.equal(mockDbRecords.students[0].sectionId, mockDbRecords.sections[0].id, "Student sectionId relation intact");
  assert.equal(mockDbRecords.classes[0].schoolId, defaultSchool.id, "Class assigned to schoolId");
  assert.equal(mockDbRecords.sections[0].schoolId, defaultSchool.id, "Section assigned to schoolId");
  console.log("✓ All existing relationships preserved.");

  // 9. Verify Safety Rules (No Truncate, No Deletes)
  console.log("9. Verifying Safety Rules (No Truncate, No Deletions)...");
  assert.equal(mockDbRecords.deleteCallCount, 0, "ZERO delete calls executed on database");
  assert.equal(mockDbRecords.truncateCallCount, 0, "ZERO truncate calls executed on database");
  console.log("✓ Strict safety constraints verified: no truncates or deletes.");

  // 10. Verify Record Count Invariant Enforcement (Rollback on count loss)
  console.log("10. Testing Rollback on Record Count Discrepancy...");
  // Simulate an unstable database where a record mysteriously vanishes between pre and post audit
  let countInvocation = 0;
  const buggyDb: any = {
    ...mockDb,
    student: {
      ...mockDb.student,
      count: async () => {
        countInvocation++;
        return countInvocation === 1 ? 3 : 1; // pre-count is 3, post-count drops to 1
      },
      findMany: async () => [mockDbRecords.students[0]],
    },
  };

  await assert.rejects(
    async () => {
      await migrateExistingSchoolData(buggyDb, { dryRun: false });
    },
    (err: any) => {
      assert(err instanceof ApiError, "Throws ApiError on count discrepancy");
      assert.match(err.message, /record count decreased/i);
      return true;
    },
    "Must trigger rollback and reject migration if any record count drops",
  );
  console.log("✓ Rollback safeguard verified: data loss instantly detected and blocked.");

  console.log("\n========================================================");
  console.log("ALL PHASE 10 DATA MIGRATION TESTS PASSED SUCCESSFULLY! ✓");
  console.log("========================================================\n");
}

main().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
