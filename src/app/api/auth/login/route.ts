import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/errors";
import { readJson, route } from "@/lib/http";
import { applySession, verifyCaptcha } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { rolePermissions } from "@/lib/auth";

const attempts = new Map<string, { count: number; first: number }>();
const WINDOW = 5 * 60 * 1000;
const LIMIT = 8;

function clientKey(req: Request, username: string) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  return `${ip}|${username.toLowerCase()}`;
}

function checkLimit(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.first > WINDOW) {
    attempts.set(key, { count: 1, first: now });
    return;
  }
  entry.count++;
  if (entry.count > LIMIT) {
    throw new ApiError(429, "Too many sign-in attempts. Please wait a few minutes.");
  }
}

export const POST = route(async (req) => {
  const body = await readJson(req);
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  if (!username || !password) throw new ApiError(422, "Enter your username and password.");

  const key = clientKey(req, username);
  checkLimit(key);

  const settings = await getSettings();
  if (settings.captcha) {
    const answer = Number(body.captchaAnswer);
    if (!body.captchaToken || !Number.isFinite(answer) || !verifyCaptcha(String(body.captchaToken), answer)) {
      throw new ApiError(422, "The captcha answer is incorrect.");
    }
  }

  const user = await prisma.appUser.findUnique({ where: { username } });
  const valid = user && user.active && (await bcrypt.compare(password, user.passwordHash));
  if (!valid) {
    await prisma.userLog.create({ data: { user: username.slice(0, 64), act: "Failed sign-in" } });
    throw new ApiError(401, "Invalid username or password.");
  }

  attempts.delete(key);
  const perms = await rolePermissions(user.role);
  await prisma.userLog.create({ data: { user: user.username, act: "Signed in" } });

  const res = NextResponse.json({
    user: { uid: user.id, username: user.username, name: user.name, role: user.role },
    perms,
  });
  return applySession(res, {
    uid: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  });
});
