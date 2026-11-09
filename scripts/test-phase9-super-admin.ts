import "dotenv/config";
import assert from "node:assert/strict";
import { isSuperAdmin } from "../src/lib/rbac";
import {
  getPlatformOverview,
  listPlatformSchools,
  getPlatformSchoolDetails,
  createPlatformSchool,
  updateSchoolStatus,
  updateSchoolSubscription,
  manageSchoolOwner,
} from "../src/lib/super-admin";
import { ApiError } from "../src/lib/errors";
import type { SessionUser } from "../src/lib/auth";

async function main() {
  console.log("--- Starting Phase 9 Platform Super Admin Dashboard Tests ---");

  // 1. RBAC Tests: Super Admin role isolation
  console.log("1. Testing Super Admin role verification & isolation...");

  const superAdminUser: SessionUser = {
    uid: "sa-1",
    username: "superadmin",
    name: "Platform Admin",
    role: "super_admin",
  };

  const legacyAdminUser: SessionUser = {
    uid: "admin-legacy",
    username: "admin",
    name: "System Admin",
    role: "Admin",
  };

  const schoolOwnerUser: SessionUser = {
    uid: "owner-1",
    username: "schoolowner",
    name: "School Owner",
    role: "owner",
    schoolId: "school-1",
  };

  const schoolAdminUser: SessionUser = {
    uid: "sadmin-1",
    username: "principal",
    name: "School Principal",
    role: "admin",
    schoolId: "school-1",
  };

  const teacherUser: SessionUser = {
    uid: "teacher-1",
    username: "mathteacher",
    name: "Teacher",
    role: "teacher",
    schoolId: "school-1",
  };

  const accountantUser: SessionUser = {
    uid: "acct-1",
    username: "accountant",
    name: "Accountant",
    role: "accountant",
    schoolId: "school-1",
  };

  assert.equal(isSuperAdmin(superAdminUser), true, "super_admin role must be identified as Super Admin");
  assert.equal(isSuperAdmin(legacyAdminUser), true, "Legacy Admin role must be identified as Super Admin");
  assert.equal(isSuperAdmin(schoolOwnerUser), false, "school_owner MUST NOT have platform super admin privileges");
  assert.equal(isSuperAdmin(schoolAdminUser), false, "school_admin MUST NOT have platform super admin privileges");
  assert.equal(isSuperAdmin(teacherUser), false, "teacher MUST NOT have platform super admin privileges");
  assert.equal(isSuperAdmin(accountantUser), false, "accountant MUST NOT have platform super admin privileges");
  assert.equal(isSuperAdmin(null), false, "null user must be rejected");

  console.log("✓ RBAC Isolation verified: school-level roles cannot access super admin resources.");

  // 2. Setup mock platform database
  const now = new Date();
  const mockDbRecords = {
    schools: [
      {
        id: "school-1",
        name: "Northview Academy",
        slug: "northview",
        email: "contact@northview.edu",
        phone: "+1 555-0101",
        address: "100 North Rd",
        status: "active",
        subscriptionPlan: "pro",
        createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 10),
      },
      {
        id: "school-2",
        name: "Southpoint High",
        slug: "southpoint",
        email: "office@southpoint.org",
        phone: "+1 555-0102",
        address: "200 South Blvd",
        status: "active",
        subscriptionPlan: "starter",
        createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      },
      {
        id: "school-3",
        name: "Eastlake Prep",
        slug: "eastlake",
        email: "admin@eastlake.com",
        phone: "+1 555-0103",
        address: "300 East Dr",
        status: "suspended",
        subscriptionPlan: "free",
        createdAt: new Date(now.getFullYear(), now.getMonth(), 2),
      },
    ],
    users: [
      { id: "u-owner-1", name: "Alice Owner", email: "alice@northview.edu" },
      { id: "u-owner-2", name: "Bob Owner", email: "bob@southpoint.org" },
      { id: "u-owner-3", name: "Charlie Owner", email: "charlie@eastlake.com" },
      { id: "u-candidate-1", name: "David Candidate", email: "david@northview.edu" },
      { id: "u-staff-1", name: "Emma Teacher", email: "emma@northview.edu" },
    ],
    members: [
      {
        id: "m-1",
        schoolId: "school-1",
        userId: "u-owner-1",
        role: "owner",
        status: "active",
        createdAt: new Date(),
      },
      {
        id: "m-2",
        schoolId: "school-2",
        userId: "u-owner-2",
        role: "owner",
        status: "active",
        createdAt: new Date(),
      },
      {
        id: "m-3",
        schoolId: "school-3",
        userId: "u-owner-3",
        role: "owner",
        status: "inactive",
        createdAt: new Date(),
      },
      {
        id: "m-4",
        schoolId: "school-1",
        userId: "u-staff-1",
        role: "teacher",
        status: "active",
        createdAt: new Date(),
      },
    ],
    students: [
      { id: "stu-1", schoolId: "school-1", name: "Student 1" },
      { id: "stu-2", schoolId: "school-1", name: "Student 2" },
      { id: "stu-3", schoolId: "school-2", name: "Student 3" },
    ],
    staff: [
      { id: "stf-1", schoolId: "school-1", name: "Staff 1" },
      { id: "stf-2", schoolId: "school-2", name: "Staff 2" },
    ],
    settings: [
      { id: "set-1", schoolId: "school-1", planName: "PRO", planExpires: null },
      { id: "set-2", schoolId: "school-2", planName: "STARTER", planExpires: null },
      { id: "set-3", schoolId: "school-3", planName: "FREE", planExpires: null },
    ],
    academicSessions: [
      { id: "ses-1", schoolId: "school-1", session: "2026-2027", isCurrent: 1 },
      { id: "ses-2", schoolId: "school-2", session: "2026-2027", isCurrent: 1 },
    ],
    auditLogs: [] as any[],
  };

  const mockDb: any = {
    school: {
      count: async ({ where }: any = {}) => {
        return mockDbRecords.schools.filter((s) => {
          if (where?.status?.in && !where.status.in.includes(s.status)) return false;
          if (where?.status && typeof where.status === "string" && s.status !== where.status) return false;
          if (where?.subscriptionPlan && s.subscriptionPlan !== where.subscriptionPlan) return false;
          if (where?.OR) {
            const matches = where.OR.some((cond: any) => {
              if (cond.name?.contains && s.name.toLowerCase().includes(cond.name.contains.toLowerCase())) return true;
              if (cond.slug?.contains && s.slug.toLowerCase().includes(cond.slug.contains.toLowerCase())) return true;
              if (cond.email?.contains && (s.email || "").toLowerCase().includes(cond.email.contains.toLowerCase())) return true;
              return false;
            });
            if (!matches) return false;
          }
          return true;
        }).length;
      },
      findMany: async ({ where, skip = 0, take = 50 }: any = {}) => {
        let list = mockDbRecords.schools.filter((s) => {
          if (where?.status && s.status !== where.status) return false;
          if (where?.subscriptionPlan && s.subscriptionPlan !== where.subscriptionPlan) return false;
          if (where?.OR) {
            const matches = where.OR.some((cond: any) => {
              if (cond.name?.contains && s.name.toLowerCase().includes(cond.name.contains.toLowerCase())) return true;
              if (cond.slug?.contains && s.slug.toLowerCase().includes(cond.slug.contains.toLowerCase())) return true;
              if (cond.email?.contains && (s.email || "").toLowerCase().includes(cond.email.contains.toLowerCase())) return true;
              return false;
            });
            if (!matches) return false;
          }
          return true;
        });
        return list.slice(skip, skip + take).map((s) => ({
          ...s,
          members: mockDbRecords.members
            .filter((m) => m.schoolId === s.id && m.role === "owner")
            .map((m) => ({
              ...m,
              user: mockDbRecords.users.find((u) => u.id === m.userId),
            })),
        }));
      },
      findUnique: async ({ where }: any) => {
        const found = mockDbRecords.schools.find((s) => s.id === where.id || s.slug === where.slug);
        if (!found) return null;
        return {
          ...found,
          members: mockDbRecords.members
            .filter((m) => m.schoolId === found.id)
            .map((m) => ({
              ...m,
              user: mockDbRecords.users.find((u) => u.id === m.userId),
            })),
        };
      },
      update: async ({ where, data }: any) => {
        const index = mockDbRecords.schools.findIndex((s) => s.id === where.id);
        if (index === -1) throw new Error("School not found");
        mockDbRecords.schools[index] = { ...mockDbRecords.schools[index], ...data };
        return mockDbRecords.schools[index];
      },
    },
    user: {
      count: async () => mockDbRecords.users.length,
      findUnique: async ({ where }: any) => {
        return mockDbRecords.users.find((u) => u.id === where.id || u.email === where.email) ?? null;
      },
    },
    student: {
      count: async ({ where }: any = {}) => {
        if (where?.schoolId) return mockDbRecords.students.filter((st) => st.schoolId === where.schoolId).length;
        return mockDbRecords.students.length;
      },
    },
    staff: {
      count: async ({ where }: any = {}) => {
        if (where?.schoolId) return mockDbRecords.staff.filter((st) => st.schoolId === where.schoolId).length;
        return mockDbRecords.staff.length;
      },
    },
    member: {
      count: async ({ where }: any = {}) => {
        return mockDbRecords.members.filter((m) => {
          if (where?.schoolId && m.schoolId !== where.schoolId) return false;
          if (where?.role && m.role !== where.role) return false;
          if (where?.status && m.status !== where.status) return false;
          return true;
        }).length;
      },
      findFirst: async ({ where }: any = {}) => {
        return mockDbRecords.members.find((m) => {
          if (where?.schoolId && m.schoolId !== where.schoolId) return false;
          if (where?.userId && m.userId !== where.userId) return false;
          if (where?.role && m.role !== where.role) return false;
          return true;
        }) ?? null;
      },
      create: async ({ data }: any) => {
        const record = { id: `m-${Date.now()}`, ...data, createdAt: new Date() };
        mockDbRecords.members.push(record);
        return record;
      },
      update: async ({ where, data }: any) => {
        const idx = mockDbRecords.members.findIndex((m) => m.id === where.id);
        if (idx !== -1) {
          mockDbRecords.members[idx] = { ...mockDbRecords.members[idx], ...data };
          return mockDbRecords.members[idx];
        }
        return null;
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        mockDbRecords.members.forEach((m, idx) => {
          if (where.schoolId && m.schoolId !== where.schoolId) return;
          if (where.role && m.role !== where.role) return;
          mockDbRecords.members[idx] = { ...m, ...data };
          count++;
        });
        return { count };
      },
      delete: async ({ where }: any) => {
        const idx = mockDbRecords.members.findIndex((m) => m.id === where.id);
        if (idx !== -1) mockDbRecords.members.splice(idx, 1);
        return { ok: true };
      },
    },
    setting: {
      findFirst: async ({ where }: any) => {
        return mockDbRecords.settings.find((s) => s.schoolId === where.schoolId) ?? null;
      },
      updateMany: async ({ where, data }: any) => {
        mockDbRecords.settings.forEach((s, idx) => {
          if (s.schoolId === where.schoolId) {
            mockDbRecords.settings[idx] = { ...s, ...data };
          }
        });
        return { count: 1 };
      },
    },
    academicSession: {
      findMany: async ({ where }: any) => {
        return mockDbRecords.academicSessions.filter((s) => s.schoolId === where.schoolId);
      },
    },
    auditLog: {
      create: async ({ data }: any) => {
        mockDbRecords.auditLogs.push({ id: `log-${Date.now()}`, ...data });
        return { id: "log-1" };
      },
    },
  };

  // 3. Test getPlatformOverview
  console.log("2. Testing getPlatformOverview KPI calculations...");
  const overview = await getPlatformOverview(mockDb);

  assert.equal(overview.kpis.totalSchools, 3, "Total schools count should match");
  assert.equal(overview.kpis.activeSchools, 2, "Active schools count should match");
  assert.equal(overview.kpis.suspendedSchools, 1, "Suspended schools count should match");
  assert.equal(overview.kpis.totalUsers, 5, "Total platform users should match");
  assert.equal(overview.kpis.totalStudents, 3, "Total students enrolled should match");
  assert.equal(overview.subscriptions.pro, 1, "Pro subscriptions count matches");
  assert.equal(overview.subscriptions.starter, 1, "Starter subscriptions count matches");
  assert.equal(overview.subscriptions.free, 1, "Free subscriptions count matches");
  assert.equal(overview.registrationAnalytics.length, 6, "Registration analytics covers 6 months");
  console.log("✓ Platform overview metrics validated.");

  // 4. Test listPlatformSchools
  console.log("3. Testing listPlatformSchools with filtering and search...");
  const allSchools = await listPlatformSchools({}, mockDb);
  assert.equal(allSchools.schools.length, 3, "Lists all 3 schools");

  const filteredStatus = await listPlatformSchools({ status: "active" }, mockDb);
  assert.equal(filteredStatus.schools.length, 2, "Filters by active status");

  const filteredPlan = await listPlatformSchools({ plan: "pro" }, mockDb);
  assert.equal(filteredPlan.schools.length, 1, "Filters by pro plan");
  assert.equal(filteredPlan.schools[0].slug, "northview");

  const searchResults = await listPlatformSchools({ search: "south" }, mockDb);
  assert.equal(searchResults.schools.length, 1, "Searches by slug/name");
  assert.equal(searchResults.schools[0].slug, "southpoint");
  console.log("✓ School listing, search, and filtering verified.");

  // 5. Test getPlatformSchoolDetails
  console.log("4. Testing getPlatformSchoolDetails...");
  const details = await getPlatformSchoolDetails("school-1", mockDb);
  assert.equal(details.school.name, "Northview Academy");
  assert.equal(details.metrics.studentCount, 2, "Student count for school-1 is 2");
  assert.equal(details.owners.length, 1, "Has 1 owner");
  assert.equal(details.owners[0].name, "Alice Owner");
  assert.equal(details.staff.length, 1, "Has 1 teacher staff");
  assert.equal(details.sessions.length, 1, "Has 1 academic session");
  console.log("✓ School details inspection verified.");

  // 6. Test updateSchoolStatus (Suspend & Activate)
  console.log("5. Testing updateSchoolStatus...");
  const suspendResult = await updateSchoolStatus("school-1", "suspended", "Payment past due", superAdminUser, mockDb);
  assert.equal(suspendResult.status, "suspended");
  assert.equal(mockDbRecords.schools[0].status, "suspended");
  // Membership cascade
  assert.equal(mockDbRecords.members[0].status, "inactive", "Owner membership was cascaded to inactive");
  assert.equal(mockDbRecords.members[3].status, "inactive", "Teacher membership was cascaded to inactive");

  // Reactivate
  const activateResult = await updateSchoolStatus("school-1", "active", "Account resolved", superAdminUser, mockDb);
  assert.equal(activateResult.status, "active");
  assert.equal(mockDbRecords.schools[0].status, "active");
  assert.equal(mockDbRecords.members[0].status, "active", "Owner membership reactivated");
  console.log("✓ School status lifecycle and member cascade verified.");

  // 7. Test updateSchoolSubscription
  console.log("6. Testing updateSchoolSubscription...");
  const subResult = await updateSchoolSubscription("school-1", "enterprise", "2027-12-31", superAdminUser, mockDb);
  assert.equal(subResult.subscriptionPlan, "enterprise");
  assert.equal(mockDbRecords.schools[0].subscriptionPlan, "enterprise");
  assert.equal(mockDbRecords.settings[0].planName, "ENTERPRISE");

  // Invalid plan rejection
  await assert.rejects(
    async () => {
      await updateSchoolSubscription("school-1", "invalid_plan" as any, null, superAdminUser, mockDb);
    },
    (err: any) => err instanceof ApiError && err.status === 422,
    "Rejects invalid plan names with 422",
  );
  console.log("✓ Subscription plan updates and validations verified.");

  // 8. Test manageSchoolOwner
  console.log("7. Testing manageSchoolOwner (assign & revoke with protections)...");
  // Assign david as an additional owner
  const assignResult = await manageSchoolOwner("school-1", "assign", "david@northview.edu", superAdminUser, mockDb);
  assert.equal(assignResult.success, true);
  const school1OwnersAfter = mockDbRecords.members.filter((m) => m.schoolId === "school-1" && m.role === "owner");
  assert.equal(school1OwnersAfter.length, 2, "Now school-1 has 2 owners");

  // Revoke david
  const revokeResult = await manageSchoolOwner("school-1", "revoke", "david@northview.edu", superAdminUser, mockDb);
  assert.equal(revokeResult.success, true);

  // Attempt to revoke the ONLY remaining active owner (alice) -> MUST be blocked
  await assert.rejects(
    async () => {
      await manageSchoolOwner("school-1", "revoke", "alice@northview.edu", superAdminUser, mockDb);
    },
    (err: any) => {
      assert(err instanceof ApiError, "Must throw ApiError");
      assert.equal(err.status, 400);
      assert.match(err.message, /Cannot revoke the only active school owner/i);
      return true;
    },
    "Must prevent revoking the single active school owner",
  );
  console.log("✓ Owner management and single-owner safety invariant verified.");

  console.log("\n========================================================");
  console.log("ALL PHASE 9 SUPER ADMIN TESTS PASSED SUCCESSFULLY! ✓");
  console.log("========================================================\n");
}

main().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});

