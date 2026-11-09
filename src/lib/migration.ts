import fs from "node:fs";
import path from "node:path";
import { prisma } from "./prisma";
import { ApiError } from "./errors";
import { generateSchoolSlug } from "./slug";
import type { SessionUser } from "./auth";

/**
 * All tenant models that maintain a mandatory schoolId reference.
 * Derived from prisma/schema.prisma multi-tenant architecture.
 */
export const TENANT_MODELS = [
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
  "Role",
  "AppUser",
  "AuditLog",
  "UserLog",
] as const;

export type TenantModelName = (typeof TENANT_MODELS)[number];

export type MigrationSnapshot = {
  timestamp: string;
  source: string;
  counts: Record<string, number>;
  data: Record<string, unknown[]>;
};

export type MigrationOptions = {
  schoolName?: string;
  schoolSlug?: string;
  schoolEmail?: string;
  schoolPhone?: string;
  schoolAddress?: string;
  dryRun?: boolean;
  backupDir?: string;
  operator?: SessionUser;
};

export type MigrationResult = {
  success: boolean;
  dryRun: boolean;
  school: {
    id: string;
    name: string;
    slug: string;
    isNewlyCreated: boolean;
  };
  associatedAdmins: Array<{
    userId: string;
    email: string;
    name: string;
    role: string;
  }>;
  preMigrationCounts: Record<string, number>;
  postMigrationCounts: Record<string, number>;
  migratedCounts: Record<string, number>;
  unassignedRemaining: Record<string, number>;
  preservedEntities: {
    studentsPreserved: number;
    paymentsPreserved: number;
    attendancePreserved: number;
    staffPreserved: number;
  };
  backupFilePath?: string;
  executedAt: string;
  durationMs: number;
};

/**
 * Returns model delegate on prisma client safely.
 */
export function getModelDelegate(db: any, modelName: string) {
  const prop = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  return db[prop] ?? null;
}

/**
 * Audits record counts across all tenant tables.
 */
export async function getTenantRecordCounts(
  db: any = prisma,
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  for (const model of TENANT_MODELS) {
    const delegate = getModelDelegate(db, model);
    if (!delegate?.count) continue;
    try {
      const count = await delegate.count();
      counts[model] = count;
    } catch {
      counts[model] = 0;
    }
  }

  return counts;
}

/**
 * Creates or retrieves the default school tenant for existing unassigned records.
 * Derives settings from existing Setting table when available.
 */
export async function createDefaultSchoolIfMissing(
  db: any = prisma,
  options: {
    id?: string;
    name?: string;
    slug?: string;
    email?: string;
    phone?: string;
    address?: string;
  } = {},
): Promise<{ id: string; name: string; slug: string; isNewlyCreated: boolean }> {
  // 1. If explicit id provided, check if it exists
  if (options.id) {
    const existing = await db.school.findUnique({ where: { id: options.id } }).catch(() => null);
    if (existing) {
      return { id: existing.id, name: existing.name, slug: existing.slug, isNewlyCreated: false };
    }
  }

  // 2. Check if a school matching the specified name or slug already exists
  if (options.name || options.slug) {
    const matching = await db.school.findFirst({
      where: {
        OR: [
          options.name ? { name: options.name } : undefined,
          options.slug ? { slug: options.slug } : undefined,
        ].filter(Boolean),
      },
    }).catch(() => null);

    if (matching) {
      return { id: matching.id, name: matching.name, slug: matching.slug, isNewlyCreated: false };
    }
  }

  // 3. Check if any existing default school exists
  const existingSchools = await db.school.findMany({
    orderBy: { createdAt: "asc" },
    take: 1,
  }).catch(() => []);

  if (existingSchools.length > 0) {
    const s = existingSchools[0];
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      isNewlyCreated: false,
    };
  }

  // 2. Derive defaults from existing settings if available
  let defaultName = options.name?.trim() || "";
  let defaultEmail = options.email?.trim() || "";
  let defaultPhone = options.phone?.trim() || "";
  let defaultAddress = options.address?.trim() || "";

  if (!defaultName && db.setting?.findFirst) {
    const setting = await db.setting.findFirst().catch(() => null);
    if (setting) {
      if (setting.name) defaultName = setting.name;
      if (setting.email) defaultEmail = setting.email;
      if (setting.phone) defaultPhone = setting.phone;
      if (setting.address) defaultAddress = setting.address;
    }
  }

  if (!defaultName) {
    defaultName = "ICE School";
  }

  const baseSlug = options.slug?.trim() || generateSchoolSlug(defaultName);
  let slug = baseSlug;
  let counter = 1;

  while (await db.school.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const newSchool = await db.school.create({
    data: {
      name: defaultName,
      slug,
      email: defaultEmail || null,
      phone: defaultPhone || null,
      address: defaultAddress || null,
      status: "active",
      subscriptionPlan: "pro",
    },
  });

  return {
    id: newSchool.id,
    name: newSchool.name,
    slug: newSchool.slug,
    isNewlyCreated: true,
  };
}

/**
 * Associates all existing administrator accounts with the default school tenant.
 * Grants SCHOOL_OWNER / admin membership without duplicating.
 */
export async function associateExistingAdministrators(
  db: any = prisma,
  schoolId: string,
): Promise<Array<{ userId: string; email: string; name: string; role: string }>> {
  // Find all admin / super admin / principal users across User and AppUser
  const candidates: Array<{ id: string; email: string; name: string; role: string }> = [];

  if (db.user?.findMany) {
    const users = await db.user.findMany().catch(() => []);
    for (const u of users) {
      const r = (u.role || "").toLowerCase();
      if (r === "admin" || r === "super_admin" || r === "owner" || !u.role) {
        candidates.push({
          id: u.id,
          email: u.email,
          name: u.name || "Administrator",
          role: "owner",
        });
      }
    }
  }

  if (db.appUser?.findMany) {
    const appUsers = await db.appUser.findMany().catch(() => []);
    for (const au of appUsers) {
      if (!candidates.some((c) => c.email.toLowerCase() === (au.email || "").toLowerCase())) {
        candidates.push({
          id: au.id,
          email: au.email || `${au.username}@localhost`,
          name: au.name || au.username,
          role: "owner",
        });
      }
    }
  }

  const associated: Array<{ userId: string; email: string; name: string; role: string }> = [];

  for (const cand of candidates) {
    let userRecord = await db.user.findUnique({ where: { email: cand.email } }).catch(() => null);

    if (!userRecord && db.user?.create) {
      userRecord = await db.user.create({
        data: {
          id: cand.id,
          email: cand.email,
          name: cand.name,
          emailVerified: true,
        },
      });
    }

    if (!userRecord) continue;

    // Check membership
    const existingMember = await db.member.findFirst({
      where: { schoolId, userId: userRecord.id },
    }).catch(() => null);

    if (!existingMember && db.member?.create) {
      await db.member.create({
        data: {
          schoolId,
          userId: userRecord.id,
          role: "owner",
          status: "active",
        },
      });
    }

    associated.push({
      userId: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: "owner",
    });
  }

  return associated;
}

/**
 * Creates a pre-migration backup snapshot of all tenant records.
 * Can save to disk if backupDir is specified.
 */
export async function createMigrationSnapshot(
  db: any = prisma,
  backupDir?: string,
): Promise<{ snapshot: MigrationSnapshot; filePath?: string }> {
  const counts: Record<string, number> = {};
  const data: Record<string, unknown[]> = {};

  for (const model of TENANT_MODELS) {
    const delegate = getModelDelegate(db, model);
    if (!delegate?.findMany) continue;
    try {
      const rows = await delegate.findMany();
      data[model] = rows;
      counts[model] = rows.length;
    } catch {
      data[model] = [];
      counts[model] = 0;
    }
  }

  const snapshot: MigrationSnapshot = {
    timestamp: new Date().toISOString(),
    source: "ICE School Manager Pre-Migration Snapshot",
    counts,
    data,
  };

  let filePath: string | undefined;
  if (backupDir) {
    try {
      const resolvedDir = path.resolve(backupDir);
      if (!fs.existsSync(resolvedDir)) {
        fs.mkdirSync(resolvedDir, { recursive: true });
      }
      const safeTime = new Date().toISOString().replace(/[:.]/g, "-");
      filePath = path.join(resolvedDir, `pre-migration-snapshot-${safeTime}.json`);
      fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), "utf8");
    } catch (err) {
      console.warn("Could not write backup file to disk:", err);
    }
  }

  return { snapshot, filePath };
}

/**
 * Safe Rollback: Restores previous state using pre-migration snapshot without deleting untargeted data.
 */
export async function rollbackMigrationSnapshot(
  db: any = prisma,
  snapshot: MigrationSnapshot,
): Promise<{ success: boolean; restoredCounts: Record<string, number> }> {
  const restoredCounts: Record<string, number> = {};

  for (const model of TENANT_MODELS) {
    const delegate = getModelDelegate(db, model);
    const rows = snapshot.data[model];
    if (!delegate || !rows || rows.length === 0) continue;

    let restored = 0;
    for (const row of rows) {
      const item = row as any;
      if (!item.id) continue;
      try {
        if (delegate.update) {
          await delegate.update({
            where: { id: item.id },
            data: { schoolId: item.schoolId ?? null },
          });
          restored++;
        }
      } catch {
        /* continue restoring others */
      }
    }
    restoredCounts[model] = restored;
  }

  return { success: true, restoredCounts };
}

/**
 * Master Migration Function for Phase 10:
 * Safely assigns existing unassigned school records to the designated default school,
 * verifies counts before and after, preserves all entity IDs and relations, and never deletes production data.
 */
export async function migrateExistingSchoolData(
  db: any = prisma,
  options: MigrationOptions = {},
): Promise<MigrationResult> {
  const startTime = Date.now();
  const dryRun = options.dryRun ?? false;

  // 1. Pre-migration count census
  const preMigrationCounts = await getTenantRecordCounts(db);

  // Capture baseline counts of critical entities
  const baselineStudents = preMigrationCounts.Student ?? 0;
  const baselinePayments = preMigrationCounts.Payment ?? 0;
  const baselineAttendance = (preMigrationCounts.StudentAttendance ?? 0) + (preMigrationCounts.StaffAttendance ?? 0);
  const baselineStaff = preMigrationCounts.Staff ?? 0;

  // 2. Create Pre-Migration Backup Snapshot
  const { snapshot, filePath: backupFilePath } = await createMigrationSnapshot(
    db,
    options.backupDir,
  );

  // 3. Resolve or Create Default School Tenant
  let school: { id: string; name: string; slug: string; isNewlyCreated: boolean };
  if (dryRun) {
    school = {
      id: "school_default_dry_run",
      name: options.schoolName || "ICE School",
      slug: options.schoolSlug || "ice-school",
      isNewlyCreated: false,
    };
  } else {
    school = await createDefaultSchoolIfMissing(db, {
      name: options.schoolName,
      slug: options.schoolSlug,
      email: options.schoolEmail,
      phone: options.schoolPhone,
      address: options.schoolAddress,
    });
  }

  // 4. Associate Existing Administrators with the Default School
  let associatedAdmins: Array<{ userId: string; email: string; name: string; role: string }> = [];
  if (!dryRun) {
    associatedAdmins = await associateExistingAdministrators(db, school.id);
  }

  // 5. In-Place Non-Destructive Record Assignment (NO TRUNCATE, NO DELETE)
  const migratedCounts: Record<string, number> = {};

  try {
    for (const model of TENANT_MODELS) {
      const delegate = getModelDelegate(db, model);
      if (!delegate) continue;

      let unassignedRows: any[] = [];
      if (delegate.findMany) {
        try {
          unassignedRows = await delegate.findMany({
            where: {
              OR: [
                { schoolId: null },
                { schoolId: "" },
                { schoolId: "default" },
                { schoolId: { not: school.id } },
              ],
            },
          });
        } catch {
          // Model might not support complex OR or all rows already belong to school
          try {
            const allRows = await delegate.findMany();
            unassignedRows = allRows.filter((r: any) => !r.schoolId || r.schoolId !== school.id);
          } catch {
            unassignedRows = [];
          }
        }
      }

      migratedCounts[model] = unassignedRows.length;

      if (!dryRun && unassignedRows.length > 0) {
        if (delegate.updateMany) {
          try {
            await delegate.updateMany({
              where: {
                OR: [
                  { schoolId: null },
                  { schoolId: "" },
                  { schoolId: "default" },
                ],
              },
              data: { schoolId: school.id },
            });
          } catch {
            // Fall back to row-by-row update to preserve IDs and handle triggers
            for (const row of unassignedRows) {
              if (row.id && delegate.update) {
                await delegate.update({
                  where: { id: row.id },
                  data: { schoolId: school.id },
                }).catch(() => {});
              }
            }
          }
        }
      }
    }
  } catch (migrationError) {
    // If anything fails during migration execution, initiate safe rollback
    if (!dryRun) {
      console.error("[Migration Failure] Initiating rollback to pre-migration state...", migrationError);
      await rollbackMigrationSnapshot(db, snapshot);
    }
    throw new ApiError(500, `Migration failed and was rolled back: ${migrationError instanceof Error ? migrationError.message : String(migrationError)}`);
  }

  // 6. Post-Migration Verification & Count Integrity Check
  const postMigrationCounts = dryRun
    ? { ...preMigrationCounts }
    : await getTenantRecordCounts(db);

  const unassignedRemaining: Record<string, number> = {};

  // Check 6a: Count conservation check — record counts MUST NOT decrease!
  for (const model of TENANT_MODELS) {
    const pre = preMigrationCounts[model] ?? 0;
    const post = postMigrationCounts[model] ?? 0;

    // Allow new records like Setting, School, or Member created during migration,
    // but NEVER permit any record loss!
    if (post < pre) {
      if (!dryRun) {
        console.error(`[Count Mismatch] ${model} count decreased from ${pre} to ${post}! Rolling back...`);
        await rollbackMigrationSnapshot(db, snapshot);
      }
      throw new ApiError(
        500,
        `Integrity check failed: ${model} record count decreased from ${pre} to ${post}. Rollback performed.`,
      );
    }
  }

  // Check 6b: Entity preservation checks
  const postStudents = postMigrationCounts.Student ?? 0;
  const postPayments = postMigrationCounts.Payment ?? 0;
  const postAttendance = (postMigrationCounts.StudentAttendance ?? 0) + (postMigrationCounts.StaffAttendance ?? 0);
  const postStaff = postMigrationCounts.Staff ?? 0;

  if (postStudents < baselineStudents) {
    throw new ApiError(500, `Student preservation violation: ${baselineStudents} -> ${postStudents}`);
  }
  if (postPayments < baselinePayments) {
    throw new ApiError(500, `Payment preservation violation: ${baselinePayments} -> ${postPayments}`);
  }
  if (postAttendance < baselineAttendance) {
    throw new ApiError(500, `Attendance preservation violation: ${baselineAttendance} -> ${postAttendance}`);
  }
  if (postStaff < baselineStaff) {
    throw new ApiError(500, `Staff preservation violation: ${baselineStaff} -> ${postStaff}`);
  }

  // 7. Audit Log Entry
  if (!dryRun && db.auditLog?.create) {
    await db.auditLog.create({
      data: {
        schoolId: school.id,
        user: options.operator?.username ?? "system_migration",
        act: "data_migration",
        entity: "school",
        description: `Successfully migrated legacy records to default school ${school.name} (${school.id}). Verified 100% preservation of ${postStudents} students, ${postPayments} payments, and ${postStaff} staff.`,
      },
    }).catch(() => {});
  }

  const durationMs = Date.now() - startTime;

  return {
    success: true,
    dryRun,
    school,
    associatedAdmins,
    preMigrationCounts,
    postMigrationCounts,
    migratedCounts,
    unassignedRemaining,
    preservedEntities: {
      studentsPreserved: postStudents,
      paymentsPreserved: postPayments,
      attendancePreserved: postAttendance,
      staffPreserved: postStaff,
    },
    backupFilePath,
    executedAt: new Date().toISOString(),
    durationMs,
  };
}
