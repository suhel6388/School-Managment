import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearSession, getSessionUser } from "@/lib/auth";
import { auth } from "@/lib/auth-server";
import { route } from "@/lib/http";

export const POST = route(async (req: Request) => {
  const user = await getSessionUser();
  if (user) {
    await prisma.userLog.create({ data: { user: user.username, act: "Signed out" } });
  }

  const res = NextResponse.json({ ok: true });

  // Revoke the Better Auth session and forward its cookie-clearing headers.
  // A missing/expired session is not an error for logout.
  try {
    const revoked = await auth.api.signOut({ headers: req.headers, asResponse: true });
    for (const cookie of revoked.headers.getSetCookie()) {
      res.headers.append("set-cookie", cookie);
    }
  } catch (error) {
    console.error("[auth] Better Auth sign-out skipped:", error);
  }

  // Always clear the legacy signed cookie too.
  return clearSession(res);
});
