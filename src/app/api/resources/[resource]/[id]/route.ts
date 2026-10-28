import { readJson, route } from "@/lib/http";
import { deleteResource, getResource, updateResource } from "@/lib/resources";

type Ctx = { params: Promise<{ resource: string; id: string }> };

export const GET = route(async (_req: Request, ctx: Ctx) => {
  const { resource, id } = await ctx.params;
  return getResource(resource, id);
});

export const PATCH = route(async (req: Request, ctx: Ctx) => {
  const { resource, id } = await ctx.params;
  return updateResource(resource, id, await readJson(req));
});

export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  const { resource, id } = await ctx.params;
  return deleteResource(resource, id);
});
