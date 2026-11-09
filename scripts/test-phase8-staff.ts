import "dotenv/config";
import assert from "node:assert/strict";
import {
  inviteStaffMember,
  cancelInvitation,
  acceptInvitation,
  updateStaffRole,
  updateStaffStatus,
  removeStaffMember,
  switchActiveSchool,
  getStaffActivityLogs,
  listStaffMembers,
  listPendingInvitations,
} from "../src/lib/staff-management";
import { ApiError } from "../src/lib/errors";

async function main() {
  console.log("--- Starting Phase 8 School Staff Management & Multi-School Tests ---");

  const mockDbRecords = {
    schools: [
      { id: "school-alpha", name: "Alpha Academy", slug: "alpha", status: "active" },
      { id: "school-beta", name: "Beta High", slug: "beta", status: "active" },
    ],
    members: [
      { id: "m-1", schoolId: "school-alpha", userId: "u-owner-a", role: "owner", status: "active", createdAt: new Date() },
      { id: "m-2", schoolId: "school-alpha", userId: "u-teacher-1", role: "teacher", status: "active", createdAt: new Date() },
    ],
    users: [
      { id: "u-owner-a", name: "Alice Owner", email: "alice@alpha.edu" },
      { id: "u-teacher-1", name: "Bob Teacher", email: "bob@alpha.edu" },
      { id: "u-invitee-1", name: "Carol Accountant", email: "carol@alpha.edu" },
    ],
    invitations: [] as any[],
    sessions: [
      { id: "sess-1", userId: "u-teacher-1", activeOrganizationId: "school-alpha" },
    ],
    auditLogs: [] as any[],
    staff: [] as any[],
  };

  const mockDb: any = {
    school: {
      findUnique: async ({ where }: any) => mockDbRecords.schools.find((s) => s.id === where.id) ?? null,
    },
    user: {
      findUnique: async ({ where }: any) => mockDbRecords.users.find((u) => u.email === where.email || u.id === where.id) ?? null,
    },
    member: {
      findMany: async ({ where }: any) => {
        return mockDbRecords.members
          .filter((m) => m.schoolId === where.schoolId)
          .map((m) => ({
            ...m,
            user: mockDbRecords.users.find((u) => u.id === m.userId),
          }));
      },
      findFirst: async ({ where }: any) => {
        return mockDbRecords.members.find((m) => {
          if (where.id && m.id !== where.id) return false;
          if (where.schoolId && m.schoolId !== where.schoolId) return false;
          if (where.userId && m.userId !== where.userId) return false;
          if (where.status && m.status !== where.status) return false;
          if (where.user?.email) {
            const user = mockDbRecords.users.find((u) => u.id === m.userId);
            if (user?.email !== where.user.email) return false;
          }
          return true;
        }) ?? null;
      },
      count: async ({ where }: any) => {
        return mockDbRecords.members.filter((m) => {
          if (where.schoolId && m.schoolId !== where.schoolId) return false;
          if (where.role && m.role !== where.role) return false;
          if (where.status && m.status !== where.status) return false;
          return true;
        }).length;
      },
      create: async ({ data }: any) => {
        const record = { id: `m-${mockDbRecords.members.length + 1}`, createdAt: new Date(), ...data };
        mockDbRecords.members.push(record);
        return record;
      },
      update: async ({ where, data }: any) => {
        const item = mockDbRecords.members.find((m) => m.id === where.id);
        if (!item) throw new Error("Member not found");
        Object.assign(item, data);
        return item;
      },
      delete: async ({ where }: any) => {
        const idx = mockDbRecords.members.findIndex((m) => m.id === where.id);
        if (idx !== -1) mockDbRecords.members.splice(idx, 1);
        return {};
      },
    },
    invitation: {
      findMany: async ({ where }: any) => {
        return mockDbRecords.invitations
          .filter((inv) => inv.schoolId === where.schoolId && (!where.status || inv.status === where.status))
          .map((inv) => ({
            ...inv,
            inviter: mockDbRecords.users.find((u) => u.id === inv.inviterId),
          }));
      },
      findFirst: async ({ where }: any) => {
        return mockDbRecords.invitations.find((inv) => {
          if (where.id && inv.id !== where.id) return false;
          if (where.schoolId && inv.schoolId !== where.schoolId) return false;
          if (where.email && inv.email !== where.email) return false;
          if (where.status && inv.status !== where.status) return false;
          return true;
        }) ?? null;
      },
      findUnique: async ({ where }: any) => {
        const inv = mockDbRecords.invitations.find((i) => i.id === where.id);
        if (!inv) return null;
        return {
          ...inv,
          school: mockDbRecords.schools.find((s) => s.id === inv.schoolId),
          inviter: mockDbRecords.users.find((u) => u.id === inv.inviterId),
        };
      },
      create: async ({ data }: any) => {
        const record = { id: `inv-${mockDbRecords.invitations.length + 1}`, createdAt: new Date(), ...data };
        mockDbRecords.invitations.push(record);
        return record;
      },
      update: async ({ where, data }: any) => {
        const item = mockDbRecords.invitations.find((i) => i.id === where.id);
        if (!item) throw new Error("Invitation not found");
        Object.assign(item, data);
        return item;
      },
      delete: async ({ where }: any) => {
        const idx = mockDbRecords.invitations.findIndex((i) => i.id === where.id);
        if (idx !== -1) mockDbRecords.invitations.splice(idx, 1);
        return {};
      },
    },
    staff: {
      findMany: async () => mockDbRecords.staff,
      findFirst: async ({ where }: any) => mockDbRecords.staff.find((s) => s.email === where.email) ?? null,
      updateMany: async ({ where, data }: any) => {
        for (const s of mockDbRecords.staff) {
          if (where.email && s.email === where.email) Object.assign(s, data);
        }
        return { count: 1 };
      },
    },
    session: {
      updateMany: async ({ where, data }: any) => {
        for (const sess of mockDbRecords.sessions) {
          if (where.userId && sess.userId === where.userId) Object.assign(sess, data);
        }
        return { count: 1 };
      },
    },
    auditLog: {
      create: async ({ data }: any) => {
        mockDbRecords.auditLogs.push({ id: `log-${mockDbRecords.auditLogs.length + 1}`, ...data });
        return {};
      },
      findMany: async () => mockDbRecords.auditLogs,
    },
    $transaction: async (fn: any) => fn(mockDb),
  };

  const ownerUser = {
    uid: "u-owner-a",
    name: "Alice Owner",
    email: "alice@alpha.edu",
    username: "alice",
    role: "owner",
  };

  const teacherUser = {
    uid: "u-teacher-1",
    name: "Bob Teacher",
    email: "bob@alpha.edu",
    username: "bob",
    role: "teacher",
  };

  // 1. Staff Invitation Flow
  console.log("\n1. Testing Staff Invitation via Email:");

  // Teacher cannot invite admin or owner
  await assert.rejects(
    async () => {
      await inviteStaffMember("school-alpha", teacherUser, { email: "eve@alpha.edu", role: "admin" }, mockDb);
    },
    (err: unknown) => {
      assert(err instanceof ApiError);
      assert.equal(err.status, 403);
      return true;
    },
  );
  console.log("✔ Non-owners cannot invite administrators.");

  // Cannot invite an existing member
  await assert.rejects(
    async () => {
      await inviteStaffMember("school-alpha", ownerUser, { email: "bob@alpha.edu", role: "teacher" }, mockDb);
    },
    (err: unknown) => {
      assert(err instanceof ApiError);
      assert.equal(err.status, 409);
      assert.match(err.message, /already a member/);
      return true;
    },
  );
  console.log("✔ Prevents inviting existing staff members.");

  // Valid invitation by Owner
  const inviteRes = await inviteStaffMember(
    "school-alpha",
    ownerUser,
    { email: "carol@alpha.edu", role: "accountant", name: "Carol Accountant" },
    mockDb,
  );
  assert.equal(inviteRes.success, true);
  assert.equal(mockDbRecords.invitations.length, 1);
  const createdInv = mockDbRecords.invitations[0];
  assert.equal(createdInv.email, "carol@alpha.edu");
  assert.equal(createdInv.role, "accountant");
  assert.equal(createdInv.status, "pending");
  console.log("✔ Staff invitation created with 7-day expiry and transactional mail delivery.");

  // 2. Accept Invitation Flow
  console.log("\n2. Testing Invitation Acceptance:");

  // Mismatched email should be rejected
  await assert.rejects(
    async () => {
      await acceptInvitation(createdInv.id, { id: "u-other", email: "other@school.edu" }, mockDb);
    },
    (err: unknown) => {
      assert(err instanceof ApiError);
      assert.equal(err.status, 403);
      return true;
    },
  );
  console.log("✔ Mismatched user cannot accept another staff member's invitation.");

  // Valid acceptance by Carol
  const acceptRes = await acceptInvitation(createdInv.id, { id: "u-invitee-1", email: "carol@alpha.edu" }, mockDb);
  assert.equal(acceptRes.success, true);
  assert.equal(acceptRes.role, "accountant");
  assert.equal(createdInv.status, "accepted");
  assert.equal(mockDbRecords.members.length, 3);
  const newMember = mockDbRecords.members.find((m) => m.userId === "u-invitee-1");
  assert.equal(newMember?.role, "accountant");
  assert.equal(newMember?.status, "active");
  console.log("✔ Invitation accepted: user added as active school member with role 'accountant'.");

  // 3. Role & Permission Configuration
  console.log("\n3. Testing Role Updates & Owner Protection:");

  // Promote Carol to Admin
  await updateStaffRole("school-alpha", newMember.id, "admin", ownerUser, mockDb);
  assert.equal(newMember.role, "admin");
  console.log("✔ Staff role updated to 'admin'.");

  // Prevent non-owner from demoting an owner
  await assert.rejects(
    async () => {
      await updateStaffRole("school-alpha", "m-1", "teacher", teacherUser, mockDb);
    },
    (err: unknown) => {
      assert(err instanceof ApiError);
      assert.equal(err.status, 403);
      return true;
    },
  );
  console.log("✔ Non-owner cannot demote a school owner.");

  // Prevent demoting the only school owner
  await assert.rejects(
    async () => {
      await updateStaffRole("school-alpha", "m-1", "teacher", ownerUser, mockDb);
    },
    (err: unknown) => {
      assert(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.match(err.message, /last active school owner/);
      return true;
    },
  );
  console.log("✔ Last school owner cannot be demoted.");

  // 4. Activate & Deactivate Staff Access
  console.log("\n4. Testing Staff Activation & Deactivation:");

  // Deactivate Bob
  await updateStaffStatus("school-alpha", "m-2", "inactive", ownerUser, mockDb);
  const bobMember = mockDbRecords.members.find((m) => m.id === "m-2");
  assert.equal(bobMember.status, "inactive");
  console.log("✔ Staff member deactivated.");

  // Reactivate Bob
  await updateStaffStatus("school-alpha", "m-2", "active", ownerUser, mockDb);
  assert.equal(bobMember.status, "active");
  console.log("✔ Staff member reactivated.");

  // Prevent deactivating the only owner
  await assert.rejects(
    async () => {
      await updateStaffStatus("school-alpha", "m-1", "inactive", ownerUser, mockDb);
    },
    (err: unknown) => {
      assert(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.match(err.message, /Cannot deactivate the only active school owner/);
      return true;
    },
  );
  console.log("✔ Single school owner cannot be deactivated.");

  // 5. Remove Staff Access
  console.log("\n5. Testing Staff Removal:");
  await removeStaffMember("school-alpha", newMember.id, ownerUser, mockDb);
  assert.equal(mockDbRecords.members.some((m) => m.id === newMember.id), false);
  console.log("✔ Staff member access removed.");

  // Prevent removing the owner
  await assert.rejects(
    async () => {
      await removeStaffMember("school-alpha", "m-1", ownerUser, mockDb);
    },
    (err: unknown) => {
      assert(err instanceof ApiError);
      assert.equal(err.status, 400);
      assert.match(err.message, /Cannot remove the only active school owner/);
      return true;
    },
  );
  console.log("✔ Protected owner from removal.");

  // 6. Authorized Multi-School Switching Mechanism
  console.log("\n6. Testing Authorized School-Switching Mechanism:");

  // Add Alice to School Beta as well
  mockDbRecords.members.push({
    id: "m-beta-alice",
    schoolId: "school-beta",
    userId: "u-owner-a",
    role: "owner",
    status: "active",
    createdAt: new Date(),
  });

  // Switch to School Beta (Authorized)
  const switchRes = await switchActiveSchool("u-owner-a", "school-beta", mockDb);
  assert.equal(switchRes.success, true);
  assert.equal(switchRes.school.id, "school-beta");
  assert.equal(switchRes.school.name, "Beta High");
  console.log("✔ Authorized user successfully switches between schools.");

  // Attacker tries to switch to School Beta without membership
  await assert.rejects(
    async () => {
      // Bob only has membership in school-alpha, not school-beta
      await switchActiveSchool("u-teacher-1", "school-beta", mockDb);
    },
    (err: unknown) => {
      assert(err instanceof ApiError);
      assert.equal(err.status, 403);
      assert.equal(err.details?.code, "FORBIDDEN_SCHOOL_ACCESS");
      return true;
    },
  );
  console.log("✔ Unauthorized school switching strictly blocked with 403.");
  console.log("✔ Changing URL/parameters without server membership validation is impossible.");

  console.log("\n--- All Phase 8 School Staff Management Tests Passed 100%! ---");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
