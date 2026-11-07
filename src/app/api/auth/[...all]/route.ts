import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth-server";

/**
 * Better Auth endpoints (sign-up, sign-in, verify-email, reset-password,
 * organization management, session management).
 *
 * The existing static routes under /api/auth (login, logout, me, captcha) are
 * more specific and keep serving the legacy flow during the transition.
 */
export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(auth);
