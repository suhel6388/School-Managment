import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearSession, getSessionUser } from "@/lib/auth";
import { route } from "@/lib/http";

export const POST = route(async () => {
  const user = await getSessionUser();
  if (user) {
    await prisma.userLog.create({ data: { user: user.username, act: "Signed out" } });
  }
  const res = NextResponse.json({ ok: true });
  return clearSession(res);
});
