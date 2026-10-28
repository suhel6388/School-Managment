import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ApiError } from "./errors";

export { ApiError };

type Handler<C> = (req: Request, ctx: C) => Promise<unknown>;

function prismaMessage(error: Prisma.PrismaClientKnownRequestError): { status: number; message: string } {
  const target = Array.isArray(error.meta?.target)
    ? (error.meta?.target as string[]).join(", ")
    : String(error.meta?.target ?? "");
  switch (error.code) {
    case "P2002":
      return { status: 409, message: `A record with this ${target || "value"} already exists.` };
    case "P2003":
      return {
        status: 409,
        message: "This record is still referenced by other data, so it cannot be changed or deleted.",
      };
    case "P2025":
      return { status: 404, message: "Record not found." };
    case "P2000":
      return { status: 400, message: `A value is too long for its database column${target ? ` (${target})` : ""}.` };
    case "P2014":
      return { status: 409, message: "This change would break a required relationship." };
    default:
      return { status: 500, message: "Database error. Please try again." };
  }
}

export function route<C>(fn: Handler<C>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      const result = await fn(req, ctx);
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message, details: error.details ?? undefined },
          { status: error.status },
        );
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const { status, message } = prismaMessage(error);
        if (status === 500) console.error("[prisma]", error.code, error.message);
        return NextResponse.json({ error: message, code: error.code }, { status });
      }
      if (error instanceof Prisma.PrismaClientValidationError) {
        return NextResponse.json({ error: "Invalid data sent to the database." }, { status: 400 });
      }
      console.error("[api]", error);
      const message =
        process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : "Unexpected server error.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

export function query(req: Request): URLSearchParams {
  return new URL(req.url).searchParams;
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const type = req.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) {
    throw new ApiError(415, "Expected application/json.");
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Request body is not valid JSON.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "Request body must be a JSON object.");
  }
  return body as Record<string, unknown>;
}
