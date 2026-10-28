import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { ApiError } from "./errors";

export const SESSION_COOKIE = "ice_session";
const MAX_AGE = 60 * 60 * 12; // 12 hours

export type SessionUser = {
  uid: string;
  username: string;
  name: string;
  role: string;
};

type SessionPayload = SessionUser & { exp: number };

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.includes("replace-with")) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be configured in production.");
    }
    return "ice20manager-development-secret-change-me";
  }
  return value;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function hmac(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function signSession(user: SessionUser): string {
  const payload: SessionPayload = { ...user, exp: Date.now() + MAX_AGE * 1000 };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${hmac(body)}`;
}

export function verifySession(token: string | undefined | null): SessionUser | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = hmac(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now() || !payload.uid) return null;
    return { uid: payload.uid, username: payload.username, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Please sign in to continue.");
  return user;
}

export function applySession(res: NextResponse, user: SessionUser): NextResponse {
  res.cookies.set(SESSION_COOKIE, signSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}

export function clearSession(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

export async function rolePermissions(roleName: string): Promise<string[] | "all"> {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) return roleName === "Admin" ? "all" : [];
  if (role.perms === "all") return "all";
  if (Array.isArray(role.perms)) return role.perms.filter((p): p is string => typeof p === "string");
  return [];
}

export async function userPermissions(user: SessionUser): Promise<string[] | "all"> {
  if (user.role === "Admin") return "all";
  return rolePermissions(user.role);
}

export async function can(user: SessionUser, group: string): Promise<boolean> {
  if (user.role === "Admin") return true;
  const perms = await userPermissions(user);
  return perms === "all" || perms.includes(group);
}

export async function requirePermission(group: string): Promise<SessionUser> {
  const user = await requireUser();
  if (!(await can(user, group))) {
    throw new ApiError(403, "Your role does not have access to this module.");
  }
  return user;
}

export async function audit(
  user: SessionUser | string,
  act: string,
  entity: string,
  description?: string,
): Promise<void> {
  const username = typeof user === "string" ? user : user.username;
  await prisma.auditLog.create({ data: { user: username, act, entity, description } });
}

/** Signed, short-lived captcha token: answer + expiry, no server state required. */
export function signCaptcha(answer: number): string {
  const exp = Date.now() + 5 * 60 * 1000;
  const body = b64url(JSON.stringify({ answer, exp }));
  return `cap_${body}.${hmac(body)}`;
}

export function verifyCaptcha(token: string, answer: number): boolean {
  if (!token.startsWith("cap_")) return false;
  const [body, signature] = token.slice(4).split(".");
  if (!body || !signature) return false;
  const expected = hmac(body);
  if (Buffer.from(signature).length !== Buffer.from(expected).length) return false;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      answer: number;
      exp: number;
    };
    return payload.exp > Date.now() && payload.answer === answer;
  } catch {
    return false;
  }
}
