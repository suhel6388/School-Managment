import { Prisma } from "@prisma/client";
import { toYmd } from "./dates";

type FieldMeta = {
  name: string;
  kind: string;
  type: string;
  isList: boolean;
  isRequired: boolean;
  isId: boolean;
  hasDefaultValue: boolean;
  isUpdatedAt: boolean;
  nativeType?: unknown;
};

type ModelMeta = {
  fields: FieldMeta[];
  relations: Record<string, string>;
};

const models = new Map<string, ModelMeta>();

for (const model of Prisma.dmmf.datamodel.models) {
  const relations: Record<string, string> = {};
  for (const field of model.fields) {
    if (field.kind === "object") relations[field.name] = field.type;
  }
  models.set(model.name, {
    fields: model.fields.map((f) => ({
      name: f.name,
      kind: f.kind,
      type: f.type,
      isList: f.isList,
      isRequired: f.isRequired,
      isId: f.isId,
      hasDefaultValue: f.hasDefaultValue,
      isUpdatedAt: f.isUpdatedAt ?? false,
      nativeType: f.nativeType,
    })),
    relations,
  });
}

export function modelMeta(name: string): ModelMeta {
  const meta = models.get(name);
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
