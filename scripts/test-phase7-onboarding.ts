import "dotenv/config";
import assert from "node:assert/strict";
import {
  generateSchoolSlug,
  resolveUniqueSchoolSlug,
  validateOnboardingInput,
  onboardSchool,
  type SchoolOnboardingInput,
} from "../src/lib/onboarding";
import { ApiError } from "../src/lib/errors";

async function main() {
  console.log("--- Starting Phase 7 School Registration and Onboarding Tests ---");

  // 1. Test Slug Generation
  console.log("\n1. Testing Slug Generation & Normalization:");
  assert.equal(
    generateSchoolSlug("Springfield Elementary School"),
    "springfield-elementary-school",
  );
  assert.equal(
    generateSchoolSlug("St. Mary's Academy & College (Branch #1)!"),
    "st-mary-s-academy-college-branch-1",
  );
  assert.equal(generateSchoolSlug("   Delhi Public School   "), "delhi-public-school");
  assert.equal(generateSchoolSlug("---Special---Chars---"), "special-chars");
  assert.equal(generateSchoolSlug("   "), "school", "Empty string should fallback to 'school'");
  console.log("✔ Slug generation formats names cleanly to kebab-case.");

  // 2. Test Collision Resolution in Unique Slug
  console.log("\n2. Testing Unique Slug Resolution with Collision Avoidance:");
  const existingSlugs = new Set(["alpha-academy", "alpha-academy-2"]);
  const mockDbForSlug = {
    school: {
      findUnique: async ({ where }: { where: { slug: string } }) => {
        if (existingSlugs.has(where.slug)) return { id: "s-1", slug: where.slug };
        return null;
      },
    },
  };

  const resolved = await resolveUniqueSchoolSlug("Alpha Academy", undefined, mockDbForSlug);
  assert.equal(resolved, "alpha-academy-3", "Should increment until an unused slug is found");

  const resolvedUnused = await resolveUniqueSchoolSlug("Beta High", undefined, mockDbForSlug);
  assert.equal(resolvedUnused, "beta-high");
  console.log("✔ Unique slug resolver avoids collisions deterministically.");

  // 3. Test Input Validation
  console.log("\n3. Testing Onboarding Input Validation:");

  // School name too short
  assert.throws(
    () => validateOnboardingInput({ name: "A" }, false),
    (err: unknown) => {
      assert(err instanceof ApiError);
      assert.equal(err.status, 422);
      assert.match(err.message, /School name must be between 2 and 150 characters/);
      return true;
    },
  );

  // Invalid school email
  assert.throws(
    () => validateOnboardingInput({ name: "Valid School", email: "invalid-email" }, false),
    (err: unknown) => {
      assert(err instanceof ApiError);
      assert.equal(err.status, 422);
      assert.match(err.message, /valid school email address/);
      return true;
    },
  );

  // New user missing password / password too short
  assert.throws(
    () =>
      validateOnboardingInput(
        {
          name: "Valid School",
          ownerName: "Owner Name",
          ownerEmail: "owner@school.edu",
          password: "short",
        },
        true,
      ),
    (err: unknown) => {
      assert(err instanceof ApiError);
      assert.equal(err.status, 422);
      assert.match(err.message, /Password must be between 8 and 128 characters/);
      return true;
    },
  );

  // Password confirmation mismatch
  assert.throws(
    () =>
      validateOnboardingInput(
        {
          name: "Valid School",
          ownerName: "Owner Name",
          ownerEmail: "owner@school.edu",
          password: "password123",
          confirmPassword: "password999",
        },
        true,
      ),
    (err: unknown) => {
      assert(err instanceof ApiError);
      assert.equal(err.status, 422);
      assert.match(err.message, /confirmation does not match/);
      return true;
    },
  );
  console.log("✔ Input validation successfully catches malformed payloads.");

  // 4. Test Complete Onboarding Transaction and Record Initialization
  console.log("\n4. Testing Full School Onboarding Flow:");

  const mockDbRecords = {
    schools: [] as any[],
    members: [] as any[],
    settings: [] as any[],
    sessions: [] as any[],
    admitTemplates: [] as any[],
    markTemplates: [] as any[],
    idCardTemplates: [] as any[],
    auditLogs: [] as any[],
    userSessions: [] as any[],
  };

  const mockDb: any = {
    school: {
      findFirst: async ({ where }: any) =>
        mockDbRecords.schools.find((s) => s.name === where.name && s.email === where.email) ?? null,
      findUnique: async ({ where }: any) =>
        mockDbRecords.schools.find((s) => s.slug === where.slug || s.id === where.id) ?? null,
      create: async ({ data }: any) => {
        const record = { id: `school-${mockDbRecords.schools.length + 1}`, ...data };
        mockDbRecords.schools.push(record);
        return record;
      },
    },
    member: {
      create: async ({ data }: any) => {
        const record = { id: `member-${mockDbRecords.members.length + 1}`, ...data };
        mockDbRecords.members.push(record);
        return record;
      },
    },
    setting: {
      create: async ({ data }: any) => {
        const record = { id: mockDbRecords.settings.length + 1, ...data };
        mockDbRecords.settings.push(record);
        return record;
      },
    },
    academicSession: {
      create: async ({ data }: any) => {
        const record = { id: `session-${mockDbRecords.sessions.length + 1}`, ...data };
        mockDbRecords.sessions.push(record);
        return record;
      },
    },
    admitTemplate: {
      create: async ({ data }: any) => {
        const record = { id: mockDbRecords.admitTemplates.length + 1, ...data };
        mockDbRecords.admitTemplates.push(record);
        return record;
      },
    },
    markTemplate: {
      create: async ({ data }: any) => {
        const record = { id: mockDbRecords.markTemplates.length + 1, ...data };
        mockDbRecords.markTemplates.push(record);
        return record;
      },
    },
    idCardTemplate: {
      create: async ({ data }: any) => {
        const record = { id: mockDbRecords.idCardTemplates.length + 1, ...data };
        mockDbRecords.idCardTemplates.push(record);
        return record;
      },
    },
    session: {
      updateMany: async ({ where, data }: any) => {
        mockDbRecords.userSessions.push({ where, data });
        return { count: 1 };
      },
    },
    auditLog: {
      create: async ({ data }: any) => {
        const record = { id: mockDbRecords.auditLogs.length + 1, ...data };
        mockDbRecords.auditLogs.push(record);
        return record;
      },
    },
    $transaction: async (fn: any) => fn(mockDb),
  };

  const authenticatedOwner = {
    uid: "user-owner-1",
    name: "Dr. Evelyn Reed",
    email: "evelyn@riverdale.edu",
    username: "evelyn",
    role: "User",
    source: "better-auth" as const,
  };

  const onboardingInput: SchoolOnboardingInput = {
    name: "Riverdale High School",
    phone: "+1 555-0199",
    address: "100 Riverdale Ave",
    session: "2026-27",
    // Attacker tries to inject elevated role
    ...( { role: "super_admin", roles: ["super_admin"] } as any ),
  };

  const result = await onboardSchool(onboardingInput, {
    currentUser: authenticatedOwner,
    db: mockDb,
  });

  // Verify Returned Result
  assert.equal(result.success, true);
  assert.equal(result.school.name, "Riverdale High School");
  assert.equal(result.school.slug, "riverdale-high-school");
  assert.equal(result.owner.role, "owner", "Role must be strictly 'owner' (SCHOOL_OWNER)");
  assert.equal(result.redirectUrl, "/");

  // Verify Database State
  assert.equal(mockDbRecords.schools.length, 1);
  assert.equal(mockDbRecords.members.length, 1);
  const createdMember = mockDbRecords.members[0];
  assert.equal(createdMember.userId, "user-owner-1");
  assert.equal(createdMember.role, "owner", "Created member role must be 'owner'");
  assert.equal(createdMember.status, "active");

  console.log("✔ School and owner membership created with role 'owner' (SCHOOL_OWNER).");
  console.log("✔ Attacker-injected role payload ignored and prevented.");

  // 5. Test Duplicate Prevention
  console.log("\n5. Testing Duplicate School Prevention:");
  await assert.rejects(
    async () => {
      await onboardSchool(
        {
          name: "Riverdale High School",
          email: "evelyn@riverdale.edu",
        },
        {
          currentUser: authenticatedOwner,
          db: mockDb,
        },
      );
    },
    (err: unknown) => {
      assert(err instanceof ApiError);
      assert.equal(err.status, 409);
      assert.equal((err.details as any)?.code, "DUPLICATE_SCHOOL");
      return true;
    },
  );
  console.log("✔ Duplicate school creation rejected with 409 Conflict.");

  console.log("\n--- All Phase 7 School Onboarding Tests Passed 100%! ---");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
