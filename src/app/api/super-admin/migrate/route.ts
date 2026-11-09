import { readJson, route } from "@/lib/http";
import { requireSuperAdmin } from "@/lib/rbac";
import {
  migrateExistingSchoolData,
  getTenantRecordCounts,
  TENANT_MODELS,
  getModelDelegate,
} from "@/lib/migration";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = route(async (req: Request) => {
  await requireSuperAdmin(req);

  const counts = await getTenantRecordCounts(prisma);
  const unassigned: Record<string, number> = {};

  for (const model of TENANT_MODELS) {
    const delegate = getModelDelegate(prisma, model);
    if (!delegate?.count) continue;
    try {
      const count = await delegate.count({
        where: {
          OR: [
            { schoolId: null },
            { schoolId: "" },
            { schoolId: "default" },
          ],
        },
      });
      if (count > 0) unassigned[model] = count;
    } catch {
      // Model might not have records with those conditions
    }
  }

  const schools = await prisma.school.findMany({ take: 5, orderBy: { createdAt: "asc" } });

  return {
    totalModels: TENANT_MODELS.length,
    counts,
    unassigned,
    unassignedTotal: Object.values(unassigned).reduce((a, b) => a + b, 0),
    existingSchools: schools.map((s) => ({ id: s.id, name: s.name, slug: s.slug, status: s.status })),
  };
});

export const POST = route(async (req: Request) => {
  const operator = await requireSuperAdmin(req);
  const body = ((await readJson(req).catch(() => ({}))) || {}) as Record<string, any>;

  const result = await migrateExistingSchoolData(prisma, {
    schoolName: body.schoolName ? String(body.schoolName) : undefined,
    schoolSlug: body.schoolSlug ? String(body.schoolSlug) : undefined,
    schoolEmail: body.schoolEmail ? String(body.schoolEmail) : undefined,
    schoolPhone: body.schoolPhone ? String(body.schoolPhone) : undefined,
    schoolAddress: body.schoolAddress ? String(body.schoolAddress) : undefined,
    dryRun: Boolean(body.dryRun),
    backupDir: "backups",
    operator,
  });

  return result;
});

