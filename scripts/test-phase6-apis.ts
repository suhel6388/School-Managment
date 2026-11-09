import "dotenv/config";
import assert from "node:assert/strict";
import { runWithTenantContext, assertSameSchool, validateSameSchool, type SchoolContext } from "../src/lib/tenant";
import { roleHasPermission, hasPermission } from "../src/lib/permissions";
import { ApiError } from "../src/lib/errors";

async function main() {
  console.log("--- Starting Phase 6 Multi-Tenant API & RBAC Migration Tests ---");

  // 1. Verify Permission Matrix for all 6 Phase Roles
  console.log("\n1. Verifying RBAC Role Matrix:");

  // SUPER_ADMIN
  assert.equal(roleHasPermission("super_admin", "student.create"), true);
  assert.equal(roleHasPermission("super_admin", "system.read"), true);
  assert.equal(roleHasPermission("super_admin", "staff.manage"), true);
  console.log("✔ SUPER_ADMIN has platform-wide full access.");

  // SCHOOL_OWNER
  assert.equal(roleHasPermission("owner", "student.create"), true);
  assert.equal(roleHasPermission("owner", "student.delete"), true);
  assert.equal(roleHasPermission("owner", "settings.update"), true);
  assert.equal(roleHasPermission("owner", "fees.delete"), true);
  assert.equal(roleHasPermission("owner", "staff.manage"), true);
  console.log("✔ SCHOOL_OWNER has full CRUD within school.");

  // SCHOOL_ADMIN
  assert.equal(roleHasPermission("admin", "student.create"), true);
  assert.equal(roleHasPermission("admin", "student.update"), true);
  assert.equal(roleHasPermission("admin", "attendance.create"), true);
  assert.equal(roleHasPermission("admin", "fees.create"), true);
  console.log("✔ SCHOOL_ADMIN has operational CRUD within school.");

  // STAFF
  assert.equal(roleHasPermission("staff", "student.read"), true);
  assert.equal(roleHasPermission("staff", "student.create"), true);
  assert.equal(roleHasPermission("staff", "student.delete"), false);
  assert.equal(roleHasPermission("staff", "settings.update"), false);
  console.log("✔ STAFF can create/read but cannot delete or update settings.");

  // TEACHER
  assert.equal(roleHasPermission("teacher", "student.read"), true);
  assert.equal(roleHasPermission("teacher", "attendance.create"), true);
  assert.equal(roleHasPermission("teacher", "attendance.read"), true);
  assert.equal(roleHasPermission("teacher", "lesson.read"), true);
  assert.equal(roleHasPermission("teacher", "fees.create"), false);
  assert.equal(roleHasPermission("teacher", "fees.delete"), false);
  assert.equal(roleHasPermission("teacher", "settings.update"), false);
  console.log("✔ TEACHER has academic and attendance access, cannot touch fees or settings.");

  // ACCOUNTANT
  assert.equal(roleHasPermission("accountant", "fees.read"), true);
  assert.equal(roleHasPermission("accountant", "fees.create"), true);
  assert.equal(roleHasPermission("accountant", "fees.update"), true);
  assert.equal(roleHasPermission("accountant", "reports.read"), true);
  assert.equal(roleHasPermission("accountant", "settings.update"), false);
  assert.equal(roleHasPermission("accountant", "student.delete"), false);
  console.log("✔ ACCOUNTANT has fees and financial report access, no administrative settings access.");

  // 2. Cross-Tenant Record Security Check
  console.log("\n2. Verifying Cross-Tenant Isolation Boundaries:");
  const schoolA: SchoolContext = {
    source: "better-auth",
    user: { id: "u-1", name: "Principal A", email: "principal@alpha.edu", username: "alpha_owner" },
    school: { id: "school-alpha", name: "Alpha Academy", slug: "alpha", status: "active", subscriptionPlan: "enterprise" },
    role: "owner",
    membershipId: "mem-a",
    requestedSchoolId: "school-alpha",
  };

  const schoolB: SchoolContext = {
    source: "better-auth",
    user: { id: "u-2", name: "Principal B", email: "principal@beta.edu", username: "beta_owner" },
    school: { id: "school-beta", name: "Beta High", slug: "beta", status: "active", subscriptionPlan: "pro" },
    role: "owner",
    membershipId: "mem-b",
    requestedSchoolId: "school-beta",
  };

  await runWithTenantContext(schoolA, async () => {
    // Reading/updating own school record succeeds
    assert.doesNotThrow(() => assertSameSchool(schoolA, "school-alpha"));

    // Attempting to read/modify school B record is rejected with 404
    assert.throws(
      () => assertSameSchool(schoolA, "school-beta"),
      (err: unknown) => {
        assert(err instanceof ApiError);
        assert.equal(err.status, 404);
        return true;
      },
    );
  });
  console.log("✔ Cross-school access strictly rejected with 404.");

  // 3. Foreign Key Cross-School Integrity Validation
  console.log("\n3. Verifying Related Records Validation (validateSameSchool):");
  const fakeDb = {
    schoolClass: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        if (where.id === "class-alpha") return { id: "class-alpha", schoolId: "school-alpha" };
        if (where.id === "class-beta") return { id: "class-beta", schoolId: "school-beta" };
        return null;
      },
    },
    section: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        if (where.id === "sec-alpha") return { id: "sec-alpha", schoolId: "school-alpha" };
        if (where.id === "sec-beta") return { id: "sec-beta", schoolId: "school-beta" };
        return null;
      },
    },
  };

  // Valid related records in School Alpha
  await assert.doesNotReject(async () => {
    await validateSameSchool(
      "school-alpha",
      [
        { model: "SchoolClass", id: "class-alpha" },
        { model: "Section", id: "sec-alpha" },
      ],
      fakeDb,
    );
  });

  // Cross-tenant related records (e.g. section from School Beta paired with class from School Alpha)
  await assert.rejects(
    async () => {
      await validateSameSchool(
        "school-alpha",
        [
          { model: "SchoolClass", id: "class-alpha" },
          { model: "Section", id: "sec-beta" }, // Mismatched tenant
        ],
        fakeDb,
      );
    },
    (err: unknown) => {
      assert(err instanceof ApiError);
      assert.equal(err.status, 403);
      assert.match(err.message, /Cross-school reference forbidden/);
      return true;
    },
  );
  console.log("✔ validateSameSchool catches foreign cross-school relations and rejects them.");

  console.log("\n--- All Phase 6 API Migration & RBAC Tests Passed 100%! ---");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
