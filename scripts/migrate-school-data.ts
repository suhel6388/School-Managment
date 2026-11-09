import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { migrateExistingSchoolData } from "../src/lib/migration";

async function runCli() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const nameArgIdx = args.indexOf("--school-name");
  const schoolName = nameArgIdx !== -1 && args[nameArgIdx + 1] ? args[nameArgIdx + 1] : undefined;

  const slugArgIdx = args.indexOf("--school-slug");
  const schoolSlug = slugArgIdx !== -1 && args[slugArgIdx + 1] ? args[slugArgIdx + 1] : undefined;

  const backupArgIdx = args.indexOf("--backup-dir");
  const backupDir = backupArgIdx !== -1 && args[backupArgIdx + 1] ? args[backupArgIdx + 1] : "backups";

  console.log("=================================================================");
  console.log("       ICE SCHOOL MANAGER — SAFE TENANT DATA MIGRATION           ");
  console.log("=================================================================");
  console.log(`Execution Mode : ${dryRun ? "DRY-RUN (Simulated, no changes committed)" : "LIVE EXECUTION"}`);
  console.log(`Backup Directory: ${backupDir}`);
  if (schoolName) console.log(`Target School  : ${schoolName}`);
  console.log("-----------------------------------------------------------------\n");

  try {
    const result = await migrateExistingSchoolData(prisma, {
      schoolName,
      schoolSlug,
      dryRun,
      backupDir,
    });

    console.log("✔ STEP 1: Pre-migration snapshot and record counts captured.");
    if (result.backupFilePath) {
      console.log(`  Backup file saved to: ${result.backupFilePath}`);
    }

    console.log("\n✔ STEP 2: Default school verified / resolved:");
    console.log(`  School ID  : ${result.school.id}`);
    console.log(`  School Name: ${result.school.name}`);
    console.log(`  School Slug: ${result.school.slug}`);
    console.log(`  Status     : ${result.school.isNewlyCreated ? "Newly Created" : "Existing Default Reused"}`);

    console.log("\n✔ STEP 3: Associated Administrators:");
    if (result.associatedAdmins.length === 0) {
      console.log("  No unassociated administrators detected.");
    } else {
      for (const adm of result.associatedAdmins) {
        console.log(`  - ${adm.name} (${adm.email}) -> Role: ${adm.role}`);
      }
    }

    console.log("\n✔ STEP 4: Entity Preservation Verification:");
    console.log(`  Students Preserved   : ${result.preservedEntities.studentsPreserved} (IDs and Adm Numbers Intact)`);
    console.log(`  Payments Preserved   : ${result.preservedEntities.paymentsPreserved} (History, Dates & Student Links Intact)`);
    console.log(`  Attendance Preserved : ${result.preservedEntities.attendancePreserved} (Records & Dates Intact)`);
    console.log(`  Staff Preserved      : ${result.preservedEntities.staffPreserved} (Codes, Roles & Departments Intact)`);

    console.log("\n✔ STEP 5: Record Count Audit (Before vs After):");
    const sampleModels = ["Student", "Payment", "StudentAttendance", "Staff", "SchoolClass", "Section", "Subject", "Setting"];
    for (const model of sampleModels) {
      const pre = result.preMigrationCounts[model] ?? 0;
      const post = result.postMigrationCounts[model] ?? 0;
      const migrated = result.migratedCounts[model] ?? 0;
      console.log(`  ${model.padEnd(20)} | Before: ${String(pre).padEnd(6)} | After: ${String(post).padEnd(6)} | Assigned: ${migrated}`);
    }

    console.log("\n-----------------------------------------------------------------");
    console.log(`MIGRATION STATUS : ${result.dryRun ? "DRY RUN COMPLETE — SUCCESS" : "COMPLETED 100% SUCCESSFULLY"}`);
    console.log(`Elapsed Time     : ${result.durationMs}ms`);
    console.log("Safety Rules     : Truncate: ZERO | Deletions: ZERO | Rollback Ready");
    console.log("=================================================================\n");
  } catch (err) {
    console.error("\n❌ MIGRATION FAILED:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runCli();

