import { readJson, route } from "@/lib/http";
import { requireSuperAdmin } from "@/lib/rbac";
import { listPlatformSchools, createPlatformSchool } from "@/lib/super-admin";

export const dynamic = "force-dynamic";

export const GET = route(async (req: Request) => {
  await requireSuperAdmin(req);
  const url = new URL(req.url);

  const status = url.searchParams.get("status") || undefined;
  const plan = url.searchParams.get("plan") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "25", 10);

  const result = await listPlatformSchools({
    status,
    plan,
    search,
    page: Number.isNaN(page) ? 1 : page,
    limit: Number.isNaN(limit) ? 25 : limit,
  });

  return result;
});

export const POST = route(async (req: Request) => {
  const operator = await requireSuperAdmin(req);
  const body = await readJson(req);

  const result = await createPlatformSchool(
    {
      name: String(body.schoolName ?? body.name ?? ""),
      slug: body.slug ? String(body.slug) : undefined,
      email: body.email ? String(body.email) : undefined,
      phone: body.phone ? String(body.phone) : undefined,
      address: body.address ? String(body.address) : undefined,
      ownerName: String(body.ownerName ?? ""),
      ownerEmail: String(body.ownerEmail ?? ""),
      password: body.ownerPassword || body.password ? String(body.ownerPassword || body.password) : undefined,
      session: body.academicSessionName || body.session ? String(body.academicSessionName || body.session) : undefined,
      subscriptionPlan: body.subscriptionPlan ? String(body.subscriptionPlan) : undefined,
    },
    operator,
  );

  return result;
});

