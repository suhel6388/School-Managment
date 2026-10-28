import { query, readJson, route } from "@/lib/http";
import { createResource, listResource } from "@/lib/resources";

type Ctx = { params: Promise<{ resource: string }> };

export const GET = route(async (req: Request, ctx: Ctx) => {
  const { resource } = await ctx.params;
  return listResource(resource, query(req));
});

export const POST = route(async (req: Request, ctx: Ctx) => {
  const { resource } = await ctx.params;
  return createResource(resource, await readJson(req));
});
