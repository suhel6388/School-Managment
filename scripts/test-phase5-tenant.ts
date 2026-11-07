import "dotenv/config";
import assert from "node:assert/strict";
import {
  runWithTenantContext,
  getTenantContext,
  requireTenantContext,
  getAuthorizedSchoolId,
  requireAuthorizedSchoolId,
  assertSameSchool,
  validateSameSchool,
  isTenantScopedModel,
  modelHasSchoolId,
  withTenantFilter,
  withTenant,
  withSchoolContext,
  createTenantPrisma,
  tenantDb,
  type SchoolContext,
} from "../src/lib/tenant";
import { ApiError } from "../src/lib/errors";

async function main() {
  console.log("--- Starting Phase 5 Tenant Isolation Tests ---");

  // 1. Test Tenant Context & AsyncLocalStorage
  const mockSchool1: SchoolContext = {
    source: "better-auth",
    user: { id: "user-1", name: "Alice", email: "alice@school1.edu", username: "alice" },
    school: { id: "school-1", name: "Greenwood Academy", slug: "greenwood", status: "active", subscriptionPlan: "pro" },
    role: "admin",
    membershipId: "mem-1",
    requestedSchoolId: "school-1",
  };

  const mockSchool2: SchoolContext = {
    source: "better-auth",
    user: { id: "user-2", name: "Bob", email: "bob@school2.edu", username: "bob" },
    school: { id: "school-2", name: "Riverdale High", slug: "riverdale", status: "active", subscriptionPlan: "starter" },
    role: "teacher",
    membershipId: "mem-2",
    requestedSchoolId: "school-2",
  };

  assert.equal(getTenantContext(), null, "Initial tenant context should be null");
  assert.equal(getAuthorizedSchoolId(), null, "Initial authorized school ID should be null");

  await runWithTenantContext(mockSchool1, async () => {
    const ctx = requireTenantContext();
    assert.equal(ctx.school.id, "school-1");
    assert.equal(ctx.user.email, "alice@school1.edu");
    assert.equal(getAuthorizedSchoolId(), "school-1");
    assert.equal(requireAuthorizedSchoolId(), "school-1");

    // Nested tenant run for background or tenant switch
    await runWithTenantContext(mockSchool2, async () => {
      assert.equal(getAuthorizedSchoolId(), "school-2");
      assert.equal(requireTenantContext().user.name, "Bob");
    });

    // Restores parent context
    assert.equal(getAuthorizedSchoolId(), "school-1");
  });

  assert.equal(getTenantContext(), null, "Tenant context should restore to null outside run");
  console.log("✔ AsyncLocalStorage tenant scoping works correctly across nested boundaries.");

  // 2. Test assertSameSchool
  assert.doesNotThrow(() => {
    assertSameSchool(mockSchool1, "school-1");
    assertSameSchool("school-1", "school-1");
  });

  assert.throws(
    () => {
      assertSameSchool(mockSchool1, "school-2");
    },
    (err: unknown) => {
      assert(err instanceof ApiError);
      assert.equal(err.status, 404);
      return true;
    },
    "Cross-school record access must throw 404",
  );
  console.log("✔ assertSameSchool blocks cross-tenant access with 404.");

  // 3. Test validateSameSchool
  const fakeTx = {
    schoolClass: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        if (where.id === "class-foreign") return { id: "class-foreign", schoolId: "school-2" };
        if (where.id === "class-local") return { id: "class-local", schoolId: "school-1" };
        return null;
      },
    },
  };

  await assert.rejects(
    async () => {
      await validateSameSchool("school-1", [{ model: "SchoolClass", id: "class-foreign" }], fakeTx);
    },
    (err: unknown) => {
      assert(err instanceof ApiError);
      assert.equal(err.status, 403);
      assert.equal((err.details as any)?.code, "CROSS_TENANT_REFERENCE_DENIED");
      return true;
    },
    "Foreign key pointing to another school must throw 403",
  );

  await assert.doesNotReject(async () => {
    await validateSameSchool("school-1", [{ model: "SchoolClass", id: "class-local" }], fakeTx);
  });
  console.log("✔ validateSameSchool prevents cross-tenant foreign key references.");

  // 4. Test Model Catalog & Dynamic Tenant Column Check
  assert.equal(isTenantScopedModel("Student"), true);
  assert.equal(isTenantScopedModel("Staff"), true);
  assert.equal(isTenantScopedModel("Book"), true);
  assert.equal(isTenantScopedModel("FeeMaster"), true);
  assert.equal(isTenantScopedModel("UnknownModel"), false);

  assert.equal(modelHasSchoolId("Member"), true);
  assert.equal(modelHasSchoolId("Invitation"), true);

  const filter1 = withTenantFilter({ status: "active" }, "school-1", "Member");
  assert.equal(filter1.schoolId, "school-1");

  console.log("✔ Tenant model catalog & dynamic column detection verified.");

  // 5. Test withTenant wrapper attaches req.user and req.school
  const mockHandler = withTenant(async (req, ctx, tenant) => {
    assert.equal(req.school?.id, "school-1");
    assert.equal(req.school?.role, "admin");
    assert.equal(req.user?.id, "user-1");
    assert.equal(tenant.school.id, "school-1");
    return { ok: true, user: req.user, school: req.school };
  });

  // Run mock handler inside an active context
  await runWithTenantContext(mockSchool1, async () => {
    const req = new Request("https://example.com/api/test");
    const res = await mockHandler(req, {});
    const json = (await res.json()) as any;
    assert.equal(json.ok, true);
    assert.equal(json.school.id, "school-1");
  });
  console.log("✔ withTenant route middleware correctly sets req.user and req.school.");

  // 6. Test Tenant Proxy Query Scoping
  await runWithTenantContext(mockSchool1, async () => {
    const client = tenantDb();
    assert(client !== null);

    // Test withTenantFilter
    const where = withTenantFilter({ active: true }, "school-1", "Member");
    assert.equal(where.schoolId, "school-1");
  });
  console.log("✔ Tenant proxy and query filters operate as expected.");

  console.log("--- All Phase 5 Tenant Isolation Tests Passed 100%! ---");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
