import { Prisma } from "@/lib/prisma-client";
import {
  prismaModelMeta,
  type PrismaFieldMeta,
  type PrismaModelMeta,
} from "./prisma-model-meta";
import { toYmd } from "./dates";

type FieldMeta = PrismaFieldMeta;
type ModelMeta = PrismaModelMeta;

export function modelMeta(name: string): ModelMeta {
  const meta = prismaModelMeta[name];
  if (!meta) throw new Error(`Unknown Prisma model: ${name}`);
  return meta;
}

export function scalarFieldNames(name: string): string[] {
  return modelMeta(name)
    .fields.filter((f) => f.kind === "scalar")
    .map((f) => f.name);
}

export function relationModel(modelName: string, relationName: string): string | undefined {
  return modelMeta(modelName).relations[relationName];
}

/** Convert Prisma values into JSON-safe values the browser can render. */
export function serializeModel(modelName: string, value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value === undefined ? undefined : null;
  if (depth > 6) return null;
  if (Array.isArray(value)) return value.map((v) => serializeModel(modelName, v, depth + 1));
  if (Prisma.Decimal.isDecimal(value)) return Number(value.toString());
  if (value instanceof Date) return toYmd(value);
  if (typeof value !== "object") return value;

  const meta = modelMeta(modelName);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const field of meta.fields) {
    if (field.name === "passwordHash") continue;
    if (!(field.name in obj)) continue;
    const raw = obj[field.name];
    if (field.kind === "object") {
      if (raw === null || raw === undefined) {
        out[field.name] = null;
      } else {
        out[field.name] = serializeModel(field.type, raw, depth + 1);
      }
      continue;
    }
    out[field.name] = serializeScalar(raw, field.nativeType);
  }

  // Include computed keys added by a resource transform.
  for (const [key, raw] of Object.entries(obj)) {
    if (key in out) continue;
    if (raw instanceof Date) out[key] = toYmd(raw);
    else if (Prisma.Decimal.isDecimal(raw)) out[key] = Number(raw.toString());
    else out[key] = raw;
  }
  return out;
}

function serializeScalar(raw: unknown, nativeType?: unknown): unknown {
  if (raw === null || raw === undefined) return raw ?? null;
  if (Prisma.Decimal.isDecimal(raw)) return Number(raw.toString());
  if (raw instanceof Date) {
    const native = Array.isArray(nativeType) ? String(nativeType[0]) : "";
    return native === "Date" ? toYmd(raw) : raw.toISOString();
  }
  if (typeof raw === "bigint") return Number(raw);
  return raw;
}
