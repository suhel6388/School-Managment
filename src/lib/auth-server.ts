import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { prisma } from "./prisma";
import { ac, roles } from "./permissions";
import { sendMail } from "./mailer";

function authSecret(): string {
  const value = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;
  if (value && !value.includes("replace-with")) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET must be configured in production.");
  }
  return "ice-school-manager-development-better-auth-secret-change-me";
}

function baseUrl(): string {
  return (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

function trustedOrigins(): string[] {
  const configured = process.env.BETTER_AUTH_TRUSTED_ORIGINS;
  const origins = new Set<string>([baseUrl()]);
  if (configured) {
    for (const origin of configured.split(",")) {
      const value = origin.trim();
      if (value) origins.add(value.replace(/\/+$/, ""));
    }
  }
  if (process.env.NODE_ENV !== "production") {
    origins.add("http://127.0.0.1:3000");
    origins.add("http://localhost:3000");
  }
  return [...origins];
}

const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  appName: "ICE School Manager",
  baseURL: baseUrl(),
  secret: authSecret(),
  database: prismaAdapter(prisma, {
    provider: "mysql",
    // The MariaDB driver adapter supports interactive transactions, but
    // keeping them off avoids long-lived locks during authentication.
    transaction: false,
  }),
  trustedOrigins: trustedOrigins(),

  emailAndPassword: {
    enabled: true,
    // A session is only created after the email address is verified.
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendMail({
        to: user.email,
        subject: "Reset your ICE School Manager password",
        text: [
          `Hello ${user.name || "there"},`,
          "",
          "We received a request to reset your password. This link expires in 1 hour:",
          url,
          "",
          "If you did not request a password reset, you can safely ignore this email.",
        ].join("\n"),
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      await sendMail({
        to: user.email,
        subject: "Verify your ICE School Manager email",
        text: [
          `Hello ${user.name || "there"},`,
          "",
          "Confirm your email address to finish setting up your account:",
          url,
          "",
          "This link expires in 1 hour.",
        ].join("\n"),
      });
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 60, max: 5 },
      "/send-verification-email": { window: 60, max: 5 },
    },
  },

  advanced: {
    cookiePrefix: "ice",
    useSecureCookies: isProduction,
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
    },
  },

  plugins: [
    organization({
      ac,
      roles,
      creatorRole: "owner",
      allowUserToCreateOrganization: true,
      organizationLimit: 10,
      membershipLimit: 1000,
      schema: {
        session: {
          fields: {
            activeOrganizationId: "activeOrganizationId",
          },
        },
        organization: {
          // The existing tenant model is `School`. Better Auth's
          // organization plugin is mapped onto it so school = organization.
          modelName: "school",
          fields: {
            name: "name",
            slug: "slug",
            logo: "logo",
            createdAt: "createdAt",
            metadata: "metadata",
          },
          additionalFields: {
            email: { type: "string", required: false, input: true },
            phone: { type: "string", required: false, input: true },
            address: { type: "string", required: false, input: true },
            status: {
              type: "string",
              required: false,
              input: false,
              defaultValue: "active",
            },
            subscriptionPlan: {
              type: "string",
              required: false,
              input: false,
              defaultValue: "free",
            },
          },
        },
        member: {
          modelName: "member",
          fields: {
            organizationId: "schoolId",
            userId: "userId",
            role: "role",
            createdAt: "createdAt",
          },
          additionalFields: {
            status: {
              type: "string",
              required: false,
              input: false,
              defaultValue: "active",
            },
          },
        },
        invitation: {
          modelName: "invitation",
          fields: {
            organizationId: "schoolId",
            email: "email",
            role: "role",
            status: "status",
            expiresAt: "expiresAt",
            createdAt: "createdAt",
            inviterId: "inviterId",
          },
        },
      },
    }),
    // Must remain the last plugin so Better Auth can persist cookies from
    // server actions and route handlers.
    nextCookies(),
  ],
});

export type Auth = typeof auth;
